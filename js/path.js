/**
 * Path engine: horizontal travel + orbit scrub + themes + house + accordion
 */
(function () {
  const track = document.getElementById("track");
  if (!track) {
    console.error("[Path] #track missing — scroll engine aborted");
    return;
  }
  const bays = [...track.querySelectorAll(".bay")];
  const scrub = document.getElementById("scrub");
  const scrubFill = document.getElementById("scrubFill");
  const scrubThumb = document.getElementById("scrubThumb");
  const scrubPlanets = document.getElementById("scrubPlanets");
  const scrubNames = document.getElementById("scrubNames");
  const progressPct = document.getElementById("progressPct");
  const bayIndex = document.getElementById("bayIndex");
  const sectionLabel = document.getElementById("sectionLabel");
  const macClock = document.getElementById("macClock");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnHome = document.getElementById("btnHome");
  if (!scrub || !scrubFill || !scrubThumb || !scrubPlanets || !scrubNames) {
    console.warn("[Path] scrub chrome incomplete — continuing with reduced UI");
  }

  const PLANETS = [
    "sun", "mercury", "venus", "earth", "mars",
    "jupiter", "saturn", "uranus", "neptune", "pluto",
    "jupiter", "saturn", "uranus", "neptune", "pluto"
  ];

  const total = bays.length;
  let active = 0;
  let scrubbing = false;
  let lastPathDir = 1;

  // planets + names under scrub
  if (scrubPlanets) {
    scrubPlanets.innerHTML = bays
      .map((bay, i) => {
        const p = PLANETS[i] || "pluto";
        const name = bay.dataset.name || bay.dataset.label || String(i + 1);
        return `<button type="button" data-planet-go="${i}" title="${name}" aria-label="${name}">
          <img src="assets/planets/${p}.svg" alt="" width="22" height="22">
        </button>`;
      })
      .join("");
  }

  if (scrubNames) {
    scrubNames.innerHTML = bays
      .map((bay) => {
        const name = bay.dataset.name || "";
        return `<span>${name}</span>`;
      })
      .join("");
  }

  const planetBtns = scrubPlanets ? [...scrubPlanets.querySelectorAll("button")] : [];
  const nameEls = scrubNames ? [...scrubNames.querySelectorAll("span")] : [];

  planetBtns.forEach((btn) => {
    btn.addEventListener("click", () => goToIndex(Number(btn.dataset.planetGo)));
  });

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function maxScroll() {
    return Math.max(0, track.scrollWidth - track.clientWidth);
  }

  function progress() {
    const m = maxScroll();
    return m <= 0 ? 0 : track.scrollLeft / m;
  }

  function goToIndex(i, behavior = "smooth") {
    const prev = active;
    i = clamp(i, 0, total - 1);
    const left = bays[i].offsetLeft;
    track.style.scrollBehavior = behavior === "smooth" ? "smooth" : "auto";
    track.scrollTo({ left, behavior });
    if (i !== prev) {
      lastPathDir = i > prev ? 1 : -1;
      // spawnSeamBurst defined later — hoisted as function declaration... use delayed call if needed
      try {
        spawnSeamBurst(lastPathDir);
        setTimeout(() => spawnSeamBurst(lastPathDir), 80);
      } catch (_) { /* early call before seam ready */ }
    }
    if (behavior === "smooth") {
      setTimeout(() => {
        track.style.scrollBehavior = "auto";
      }, 600);
    }
  }

  // Public API for JARVIS / gestures / i18n
  window.PathAPI = {
    goToIndex,
    goRelative(delta) {
      goToIndex(active + delta);
    },
    goHome() {
      goToIndex(0);
    },
    goNext() {
      goToIndex(active + 1);
    },
    goPrev() {
      goToIndex(active - 1);
    },
    getActive() {
      return active;
    },
    getTotal() {
      return total;
    }
  };

  function updateUI() {
    const p = progress();
    const pct = Math.round(p * 100);
    if (scrubFill) scrubFill.style.width = `${pct}%`;
    if (scrubThumb) scrubThumb.style.left = `${pct}%`;
    if (scrub) scrub.setAttribute("aria-valuenow", String(pct));
    if (progressPct) progressPct.textContent = `${pct}%`;

    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    bays.forEach((bay, i) => {
      const mid = bay.offsetLeft + bay.offsetWidth / 2;
      const d = Math.abs(mid - center);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    active = nearest;
    if (bayIndex) bayIndex.textContent = `${active + 1} / ${total}`;
    if (sectionLabel) sectionLabel.textContent = bays[active].dataset.label || `0${active + 1}`;

    planetBtns.forEach((el, i) => {
      el.classList.toggle("is-on", i <= active);
      el.classList.toggle("is-active", i === active);
    });
    nameEls.forEach((el, i) => {
      el.classList.toggle("is-active", i === active);
    });
  }

  // Wheel: vertical → bay content first; horizontal (or edge spill) → Path orbit.
  let lastSeamBurst = 0;
  let wheelSnapTimer = 0;

  function canScrollY(el, dy) {
    if (!el) return false;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 4) return false;
    const top = el.scrollTop;
    if (dy < 0 && top > 1) return true;
    if (dy > 0 && top < max - 2) return true;
    return false;
  }

  /** Nearest overflow-y scroller under the pointer (bay / panel / data-vscroll). */
  function findVerticalScroller(from) {
    let el = from && from.nodeType === 1 ? from : null;
    const stop = track.parentElement || document.body;
    while (el && el !== stop && el !== document.documentElement) {
      if (el === track) break;
      if (el.classList && (el.classList.contains("bay") || el.hasAttribute("data-vscroll"))) {
        if (el.scrollHeight > el.clientHeight + 4) return el;
      }
      try {
        const st = getComputedStyle(el);
        const oy = st.overflowY;
        if (
          (oy === "auto" || oy === "scroll" || oy === "overlay") &&
          el.scrollHeight > el.clientHeight + 4
        ) {
          return el;
        }
      } catch (_) { /* */ }
      el = el.parentElement;
    }
    const bay = bays[active];
    if (bay && bay.scrollHeight > bay.clientHeight + 4) return bay;
    return null;
  }

  function applyPathDelta(delta) {
    if (!delta) return false;
    const prevBehavior = track.style.scrollBehavior;
    const prevSnap = track.style.scrollSnapType;
    track.style.scrollBehavior = "auto";
    track.style.scrollSnapType = "none";

    const before = track.scrollLeft;
    track.scrollLeft = before + delta;

    clearTimeout(wheelSnapTimer);
    wheelSnapTimer = setTimeout(() => {
      track.style.scrollBehavior = prevBehavior || "";
      track.style.scrollSnapType = prevSnap || "";
    }, 140);

    const moved = Math.abs(track.scrollLeft - before) > 2;
    if (moved) {
      lastPathDir = delta >= 0 ? 1 : -1;
      spawnSeamBurst(lastPathDir);
      if (!scrubbing) updateUI();
    }
    return moved;
  }

  function spawnSeamBurst(direction) {
    try {
      const now = performance.now();
      if (now - lastSeamBurst < 90) return;
      lastSeamBurst = now;
      let layer = document.getElementById("seamFx");
      if (!layer) {
        layer = document.createElement("div");
        layer.id = "seamFx";
        layer.className = "seam-fx";
        layer.setAttribute("aria-hidden", "true");
        document.body.appendChild(layer);
      }
      while (layer.childElementCount > 96) layer.firstElementChild.remove();

      const glyphs = "SergeyBezhaevPATH0123456789ЛЕКМЕДЕА";
      const seamX =
        direction > 0
          ? window.innerWidth * (0.78 + Math.random() * 0.12)
          : window.innerWidth * (0.08 + Math.random() * 0.12);
      const barH = 48;
      const deckH = 100;
      const usableH = Math.max(200, window.innerHeight - barH - deckH);
      const n = 36 + ((Math.random() * 18) | 0);

      for (let i = 0; i < n; i++) {
        const s = document.createElement("span");
        const big = Math.random() > 0.72;
        s.className = "seam-fx__ch" + (big ? " seam-fx__ch--lg" : "");
        s.textContent = glyphs[(Math.random() * glyphs.length) | 0];
        const t = i / Math.max(1, n - 1);
        const y = barH + t * usableH + (Math.random() - 0.5) * 28;
        const xJitter = (Math.random() - 0.5) * 120;
        s.style.left = seamX + xJitter + "px";
        s.style.top = y + "px";
        const outward = direction * (40 + Math.random() * 160);
        const along = (Math.random() - 0.5) * 140;
        s.style.setProperty("--dx", outward + "px");
        s.style.setProperty("--dy", along + "px");
        s.style.setProperty("--rot", (Math.random() - 0.5) * 80 + "deg");
        s.style.animationDelay = Math.random() * 0.18 + "s";
        s.style.animationDuration = 0.75 + Math.random() * 0.55 + "s";
        layer.appendChild(s);
        setTimeout(() => s.remove(), 1400);
      }
      const spine = document.createElement("div");
      spine.className = "seam-fx__spine";
      spine.style.left = seamX + "px";
      spine.style.setProperty("--dir", String(direction));
      layer.appendChild(spine);
      setTimeout(() => spine.remove(), 700);
    } catch (_) { /* never block scroll */ }
  }

  function wheelToPath(event) {
    if (document.documentElement.classList.contains("boot-await-scroll")) {
      if (event.deltaY > 4 || event.deltaX > 4) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("path-cosmos-scroll"));
      }
      return;
    }

    if (
      event.target.closest(
        ".deck, .mac-bar, .acc__panel, .jarvis-hud__panel, .sophia-hud__panel, .gesture-hud, .assist-panel__scroll, .jarvis-hud__chat-log, .sophia-hud__chat-log"
      )
    ) {
      return;
    }

    if (event.target.closest("iframe, .case-window, .case-pair")) return;

    let dx = event.deltaX;
    let dy = event.deltaY;
    if (event.deltaMode === 1) {
      dx *= 16;
      dy *= 16;
    } else if (event.deltaMode === 2) {
      dx *= track.clientWidth;
      dy *= track.clientHeight;
    }
    if (dx === 0 && dy === 0) return;

    if (event.shiftKey) {
      event.preventDefault();
      applyPathDelta(dy || dx);
      return;
    }

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const horizontalIntent = absX >= absY * 0.55 && absX > 0.5;
    const verticalIntent = absY > absX * 0.85;

    // Vertical first: scroll bay / nested content when there is room
    if (verticalIntent && !horizontalIntent) {
      const sc =
        (event.target.closest && event.target.closest("[data-vscroll]")) ||
        findVerticalScroller(event.target);
      if (sc && canScrollY(sc, dy)) {
        // Capture-phase + preventDefault would kill native — apply manually
        event.preventDefault();
        sc.scrollTop += dy;
        return;
      }
      // No vertical room → convert to path
      event.preventDefault();
      applyPathDelta(dy);
      return;
    }

    if (horizontalIntent || absX > 0.5) {
      event.preventDefault();
      applyPathDelta(dx !== 0 ? dx : dy);
      return;
    }

    const sc = findVerticalScroller(event.target);
    if (sc && canScrollY(sc, dy)) {
      event.preventDefault();
      sc.scrollTop += dy;
      return;
    }
    event.preventDefault();
    applyPathDelta(dy || dx);
  }

  window.addEventListener("wheel", wheelToPath, { passive: false, capture: true });

  track.addEventListener(
    "scroll",
    () => {
      if (!scrubbing) updateUI();
    },
    { passive: true }
  );

  window.addEventListener("keydown", (event) => {
    if (event.target.closest("input, textarea")) return;
    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      goToIndex(active + 1);
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      goToIndex(active - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goToIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goToIndex(total - 1);
    }
  });

  if (btnPrev) btnPrev.addEventListener("click", () => goToIndex(active - 1));
  if (btnNext) btnNext.addEventListener("click", () => goToIndex(active + 1));
  if (btnHome) btnHome.addEventListener("click", () => goToIndex(0));

  document.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      goToIndex(Number(btn.dataset.go));
      closeAllAcc();
    });
  });

  function setFromClientX(clientX) {
    if (!scrub) return;
    const trackEl = scrub.querySelector(".scrub__track");
    if (!trackEl) return;
    const rect = trackEl.getBoundingClientRect();
    const t = clamp((clientX - rect.left) / rect.width, 0, 1);
    track.scrollLeft = t * maxScroll();
    updateUI();
  }

  if (scrub) {
    scrub.addEventListener("pointerdown", (event) => {
      if (event.target.closest("[data-planet-go]")) return;
      scrubbing = true;
      scrub.setPointerCapture(event.pointerId);
      setFromClientX(event.clientX);
    });
    scrub.addEventListener("pointermove", (event) => {
      if (!scrubbing) return;
      setFromClientX(event.clientX);
    });
    scrub.addEventListener("pointerup", () => {
      scrubbing = false;
    });
    scrub.addEventListener("pointercancel", () => {
      scrubbing = false;
    });
  }

  // light cards
  const lights = [...document.querySelectorAll(".light-card")];
  let lightIdx = 0;
  if (lights.length) {
    setInterval(() => {
      lights.forEach((el) => el.classList.remove("is-pulse"));
      lightIdx = (lightIdx + 1) % lights.length;
      lights[lightIdx].classList.add("is-pulse");
    }, 2800);
    lights[0].classList.add("is-pulse");
  }

  // clock
  function tickClock() {
    if (!macClock) return;
    const now = new Date();
    macClock.textContent = now.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  tickClock();
  setInterval(tickClock, 15000);

  // ——— Accordion nav ———
  const accBtns = [...document.querySelectorAll(".acc__btn")];
  function closeAllAcc() {
    accBtns.forEach((b) => {
      b.setAttribute("aria-expanded", "false");
      const panel = document.getElementById(`acc-${b.dataset.acc}`);
      if (panel) panel.hidden = true;
    });
  }
  accBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.acc;
      const panel = document.getElementById(`acc-${id}`);
      const open = btn.getAttribute("aria-expanded") === "true";
      closeAllAcc();
      if (!open && panel) {
        btn.setAttribute("aria-expanded", "true");
        panel.hidden = false;
      }
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".acc")) closeAllAcc();
  });

  // ——— Themes ———
  const THEME_KEY = "path-theme";
  function applyTheme(name) {
    document.documentElement.setAttribute("data-theme", name);
    localStorage.setItem(THEME_KEY, name);
    document.querySelectorAll(".theme-card").forEach((card) => {
      card.classList.toggle("is-active", card.dataset.theme === name);
    });
  }
  document.querySelectorAll("[data-theme]").forEach((card) => {
    if (!card.classList.contains("theme-card")) return;
    card.addEventListener("click", () => applyTheme(card.dataset.theme));
  });
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) applyTheme(saved);

  // chaos switch
  const btnChaos = document.getElementById("btnChaos");
  if (btnChaos) {
    btnChaos.addEventListener("click", () => {
      document.body.classList.add("is-chaos");
      closeAllAcc();
      setTimeout(() => document.body.classList.remove("is-chaos"), 8000);
    });
  }
  const btnSnap = document.getElementById("btnSnap");
  if (btnSnap) {
    btnSnap.addEventListener("click", () => {
      goToIndex(active);
      closeAllAcc();
    });
  }

  // ——— House interactive ———
  const houseStage = document.getElementById("houseStage");
  if (houseStage) {
    const houseImg = document.getElementById("houseImg");
    const doorHot = document.getElementById("doorHot");
    const lampHot = document.getElementById("lampHot");
    const houseHint = document.getElementById("houseHint");
    const houseState = document.getElementById("houseState");
    const houseBack = document.getElementById("houseBack");
    const houseStreet = document.getElementById("houseStreet");
    const doorAudio = document.getElementById("doorClick");

    const HOUSE = {
      closed: "assets/house/house-closed.jpg",
      open: "assets/house/house-open.jpg",
      party: "assets/house/house-party.jpg",
      dark: "assets/house/house-dark.jpg"
    };

    let doorOpen = false;
    let lightMode = "normal"; // normal | party | dark
    const history = ["street"];

    function playClick() {
      if (!doorAudio) return;
      try {
        doorAudio.currentTime = 0;
        // prefer wav if mp3 missing
        if (!doorAudio.querySelector("source") || !doorAudio.src) {
          doorAudio.src = "assets/ui/click.wav";
        }
        doorAudio.play().catch(() => {});
      } catch (_) {}
    }

    function streetSrc() {
      if (lightMode === "dark") return HOUSE.dark;
      if (lightMode === "party") return HOUSE.party;
      return doorOpen ? HOUSE.open : HOUSE.closed;
    }

    function showScene(name) {
      houseStage.querySelectorAll(".house-scene").forEach((s) => {
        s.classList.toggle("is-active", s.dataset.scene === name);
      });
      houseStage.classList.toggle("is-zoom", name !== "street");
    }

    function setStateText() {
      if (history[history.length - 1] !== "street") {
        houseState.textContent = `комната · ${history[history.length - 1]}`;
        return;
      }
      const d = doorOpen ? "открыта" : "закрыта";
      const l =
        lightMode === "party" ? "дискотека" : lightMode === "dark" ? "свет выкл" : "свет норм";
      houseState.textContent = `улица · дверь ${d} · ${l}`;
      houseHint.textContent = doorOpen
        ? "Дверь открыта · кликни ещё раз, чтобы провалиться внутрь"
        : "Кликни дверь · фонарь меняет свет в окнах";
    }

    function refreshStreet() {
      houseImg.src = streetSrc();
      lampHot.classList.toggle("is-party", lightMode === "party");
      lampHot.classList.toggle("is-dark", lightMode === "dark");
      setStateText();
    }

    function enterRoom(room) {
      history.push(room);
      showScene(room);
      setStateText();
      playClick();
    }

    doorHot.addEventListener("click", () => {
      playClick();
      if (!doorOpen) {
        doorOpen = true;
        if (lightMode === "dark") lightMode = "normal";
        refreshStreet();
        return;
      }
      // second click → enter
      enterRoom("hall");
    });

    lampHot.addEventListener("click", () => {
      playClick();
      if (lightMode === "normal") lightMode = "party";
      else if (lightMode === "party") lightMode = "dark";
      else lightMode = "normal";
      // party/dark force closed door visual variants
      if (lightMode !== "normal") doorOpen = false;
      refreshStreet();
    });

    houseStage.querySelectorAll("[data-room]").forEach((btn) => {
      btn.addEventListener("click", () => {
        enterRoom(btn.dataset.room);
      });
    });

    houseStage.querySelectorAll("[data-switch]").forEach((sw) => {
      sw.addEventListener("click", () => {
        playClick();
        const scene = sw.closest(".house-scene");
        if (scene) scene.classList.toggle("is-lights-off");
      });
    });

    houseBack.addEventListener("click", () => {
      if (history.length <= 1) {
        showScene("street");
        history.length = 0;
        history.push("street");
        houseStage.classList.remove("is-zoom");
        setStateText();
        return;
      }
      history.pop();
      const prev = history[history.length - 1];
      showScene(prev);
      if (prev === "street") houseStage.classList.remove("is-zoom");
      setStateText();
      playClick();
    });

    houseStreet.addEventListener("click", () => {
      history.length = 0;
      history.push("street");
      showScene("street");
      houseStage.classList.remove("is-zoom");
      setStateText();
      playClick();
    });

    refreshStreet();
  }

  // audio src fix
  const doorAudioEl = document.getElementById("doorClick");
  if (doorAudioEl) {
    doorAudioEl.src = "assets/ui/click.wav";
  }

  // init
  updateUI();
  window.addEventListener("resize", updateUI);
  track.focus({ preventScroll: true });
})();
