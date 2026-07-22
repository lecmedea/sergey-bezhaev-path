/**
 * Path engine: horizontal travel + orbit scrub + themes + house + accordion
 */
(function () {
  const track = document.getElementById("track");
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

  const PLANETS = [
    "sun", "mercury", "venus", "earth", "mars",
    "jupiter", "saturn", "uranus", "neptune", "pluto"
  ];

  const total = bays.length;
  let active = 0;
  let scrubbing = false;

  // planets + names under scrub
  scrubPlanets.innerHTML = bays
    .map((bay, i) => {
      const p = PLANETS[i] || "pluto";
      const name = bay.dataset.name || bay.dataset.label || String(i + 1);
      return `<button type="button" data-planet-go="${i}" title="${name}" aria-label="${name}">
        <img src="assets/planets/${p}.svg" alt="" width="22" height="22">
      </button>`;
    })
    .join("");

  scrubNames.innerHTML = bays
    .map((bay) => {
      const name = bay.dataset.name || "";
      return `<span>${name}</span>`;
    })
    .join("");

  const planetBtns = [...scrubPlanets.querySelectorAll("button")];
  const nameEls = [...scrubNames.querySelectorAll("span")];

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
    i = clamp(i, 0, total - 1);
    const left = bays[i].offsetLeft;
    track.scrollTo({ left, behavior });
  }

  function updateUI() {
    const p = progress();
    const pct = Math.round(p * 100);
    scrubFill.style.width = `${pct}%`;
    scrubThumb.style.left = `${pct}%`;
    scrub.setAttribute("aria-valuenow", String(pct));
    progressPct.textContent = `${pct}%`;

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
    bayIndex.textContent = `${active + 1} / ${total}`;
    sectionLabel.textContent = bays[active].dataset.label || `0${active + 1}`;

    planetBtns.forEach((el, i) => {
      el.classList.toggle("is-on", i <= active);
      el.classList.toggle("is-active", i === active);
    });
    nameEls.forEach((el, i) => {
      el.classList.toggle("is-active", i === active);
    });
  }

  // wheel → horizontal
  track.addEventListener(
    "wheel",
    (event) => {
      const dy = event.deltaY;
      const dx = event.deltaX;
      if (Math.abs(dy) >= Math.abs(dx) && dy !== 0) {
        // don't steal scroll inside legal / house panels with vertical overflow when shift not held
        const scrollable = event.target.closest(".bay__inner--legal, .bay__inner--stack, .house-stage");
        if (scrollable && scrollable.scrollHeight > scrollable.clientHeight + 8) {
          // allow native vertical inside tall panels unless at edge wanting path travel
          return;
        }
        event.preventDefault();
        track.scrollLeft += dy;
      }
    },
    { passive: false }
  );

  window.addEventListener(
    "wheel",
    (event) => {
      if (event.target.closest(".deck") || event.target.closest(".mac-bar") || event.target.closest(".acc__panel")) {
        return;
      }
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX) && !event.defaultPrevented) {
        const inPanel = event.target.closest(".bay__inner--legal, .bay__inner--stack, .house-stage, .acc__panel");
        if (inPanel) return;
        const overTrack =
          event.target.closest(".track") ||
          event.target === document.body ||
          event.target === document.documentElement;
        if (overTrack || !event.target.closest("a, button, input, textarea")) {
          event.preventDefault();
          track.scrollLeft += event.deltaY;
        }
      }
    },
    { passive: false }
  );

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

  btnPrev.addEventListener("click", () => goToIndex(active - 1));
  btnNext.addEventListener("click", () => goToIndex(active + 1));
  btnHome.addEventListener("click", () => goToIndex(0));

  document.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      goToIndex(Number(btn.dataset.go));
      closeAllAcc();
    });
  });

  function setFromClientX(clientX) {
    const rect = scrub.querySelector(".scrub__track").getBoundingClientRect();
    const t = clamp((clientX - rect.left) / rect.width, 0, 1);
    track.scrollLeft = t * maxScroll();
    updateUI();
  }

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
