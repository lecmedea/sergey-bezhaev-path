/**
 * Path engine: horizontal travel + orbit scrub + themes + accordion
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

  const siteCases = bays.filter(bay => bay.hasAttribute('data-site-case'));
  const catalogIndex = bays.findIndex(bay => bay.id === 'bay-sites');
  const sitesStrip = document.getElementById('sitesStrip');
  const sitesToggle = document.getElementById('sitesToggle');
  let casesExpanded = false;
  const icon = window.PathIcon || (() => '');
  if (sitesStrip) sitesStrip.innerHTML = siteCases.map(bay =>
    `<button type="button" data-site-go="${bays.indexOf(bay)}">${icon(bay.dataset.icon)}${bay.dataset.name}</button>`
  ).join('');
  sitesStrip?.querySelectorAll('[data-site-go]').forEach(btn => btn.addEventListener('click', () => goToIndex(Number(btn.dataset.siteGo))));
  sitesToggle?.addEventListener('click', () => {
    if (casesExpanded) goToIndex(catalogIndex);
    else { setCasesExpanded(true); track.scrollTo({ left: bayLeft(active), behavior: "instant" }); updateUI(); }
  });
  function setCasesExpanded(expanded) {
    casesExpanded = expanded;
    siteCases.forEach(bay => { bay.hidden = !expanded; });
    sitesStrip?.classList.toggle('is-open', expanded);
    if (sitesStrip) sitesStrip.inert = !expanded;
    sitesToggle?.setAttribute('aria-expanded', String(expanded));
    const label = document.getElementById('sitesToggleLabel');
    if (label) label.textContent = expanded ? '/ свернуть' : '/ развернуть';
    planetBtns?.forEach((btn, i) => { btn.hidden = bays[i].hidden; });
    nameEls?.forEach((el, i) => { el.hidden = bays[i].hidden; });
  }
  function relativeIndex(delta) {
    const visible = bays.map((bay,i) => bay.hidden ? -1 : i).filter(i => i >= 0);
    return visible[clamp(visible.indexOf(active) + delta, 0, visible.length - 1)];
  }

  const total = bays.length;
  let active = 0;
  let scrubbing = false;
  let lastPathDir = 1;
  let programmaticUntil = 0;

  // planets + names under scrub
  if (scrubPlanets) {
    scrubPlanets.innerHTML = bays
      .map((bay, i) => {
        const name = bay.dataset.name || bay.dataset.label || String(i + 1);
        return `<button type="button" data-planet-go="${i}" title="${name}" aria-label="${name}" ${bay.hidden ? "hidden" : ""}>
          ${icon(bay.dataset.icon)}
        </button>`;
      })
      .join("");
  }

  if (scrubNames) {
    scrubNames.innerHTML = bays
      .map((bay) => {
        const name = bay.dataset.name || "";
        return `<span ${bay.hidden ? "hidden" : ""}>${name}</span>`;
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

  function bayLeft(i) {
    i = clamp(i, 0, total - 1);
    return bays[i].offsetLeft;
  }

  /** Always land on a full bay — never leave the seam in the middle of the screen. */
  function snapToAlignedBay(behavior = "smooth") {
    if (scrubbing) return;
    const sl = track.scrollLeft;
    const bayW = bays[0]?.offsetWidth || track.clientWidth || window.innerWidth;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < total; i++) {
      if (bays[i].hidden) continue;
      const d = Math.abs(bayLeft(i) - sl);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    const left = bayLeft(best);
    track.style.scrollSnapType = "x proximity";
    if (Math.abs(sl - left) < 2) {
      track.style.scrollBehavior = "auto";
      track.scrollLeft = left;
      active = best;
      updateUI();
      return;
    }
    track.style.scrollBehavior = behavior === "smooth" ? "smooth" : "auto";
    track.scrollTo({ left, behavior });
    active = best;
    updateUI();
    // Hard-correct if smooth scroll is interrupted mid-seam
    clearTimeout(snapToAlignedBay._hard);
    snapToAlignedBay._hard = setTimeout(() => {
      track.style.scrollBehavior = "auto";
      if (Math.abs(track.scrollLeft - left) > 2) {
        track.scrollLeft = left;
      }
      active = best;
      updateUI();
    }, behavior === "smooth" ? 480 : 0);
  }

  function goToIndex(i, behavior = "auto") {
    const prev = active;
    i = clamp(i, 0, total - 1);
    if (siteCases.includes(bays[i]) && !casesExpanded) setCasesExpanded(true);
    else if (i === catalogIndex && casesExpanded) setCasesExpanded(false);
    clearTimeout(wheelSnapTimer);
    clearTimeout(snapToAlignedBay._hard);
    wheelSnapTimer = 0;
    track.style.scrollSnapType = "x proximity";
    track.style.scrollBehavior = "auto";
    const smooth = behavior === "smooth" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    programmaticUntil = performance.now() + (smooth ? 1200 : 80);
    track.scrollTo({ left: bayLeft(i), behavior: smooth ? "smooth" : "instant" });
    active = i;
    updateUI();
    if (i !== prev) lastPathDir = i > prev ? 1 : -1;
  }

  // Public API for JARVIS / gestures / i18n
  window.PathAPI = {
    goToIndex,
    goRelative(delta) {
      goToIndex(relativeIndex(delta));
    },
    goHome() {
      goToIndex(0);
    },
    goNext() {
      goToIndex(relativeIndex(1));
    },
    goPrev() {
      goToIndex(relativeIndex(-1));
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
      if (bay.hidden) return;
      const mid = bay.offsetLeft + bay.offsetWidth / 2;
      const d = Math.abs(mid - center);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    active = nearest;
    const visibleBays = bays.filter(bay => !bay.hidden);
    if (bayIndex) bayIndex.textContent = `${visibleBays.indexOf(bays[active]) + 1} / ${visibleBays.length}`;
    sitesStrip?.querySelectorAll("[data-site-go]").forEach(btn => {
      if (Number(btn.dataset.siteGo) === active) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
    if (sectionLabel) sectionLabel.textContent = bays[active].dataset.label || `0${active + 1}`;

    planetBtns.forEach((el, i) => {
      el.classList.toggle("is-on", i <= active);
      el.classList.toggle("is-active", i === active);
    });
    nameEls.forEach((el, i) => {
      el.classList.toggle("is-active", i === active);
    });
  }

  // Wheel/trackpad: X is the primary site axis. Explicit nested scrollers keep Y.
  let wheelSnapTimer = 0;

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
    return null;
  }

  let wheelGestureStart = 0;
  let wheelGestureDelta = 0;
  let pendingPathDelta = 0;
  let pathFrame = 0;

  function settlePathGesture() {
    wheelSnapTimer = 0;
    const bayW = bays[0]?.offsetWidth || track.clientWidth || window.innerWidth;
    const threshold = Math.min(96, bayW * 0.09);
    const direction = Math.sign(wheelGestureDelta);
    const visible = bays.map((bay,i) => bay.hidden ? -1 : i).filter(i => i >= 0);
    const nearest = visible.reduce((best,i) => Math.abs(bayLeft(i)-track.scrollLeft) < Math.abs(bayLeft(best)-track.scrollLeft) ? i : best, visible[0]);
    const target = Math.abs(wheelGestureDelta) >= threshold
      ? visible[clamp(visible.indexOf(wheelGestureStart) + direction, 0, visible.length - 1)]
      : nearest;
    wheelGestureDelta = 0;
    goToIndex(target, "smooth");
  }

  function applyPathDelta(delta) {
    if (!delta) return false;
    if (!wheelSnapTimer) {
      const bayW = bays[0]?.offsetWidth || track.clientWidth || window.innerWidth;
      wheelGestureStart = active;
      wheelGestureDelta = 0;
    }
    wheelGestureDelta += delta;
    pendingPathDelta += delta;
    track.style.scrollBehavior = "auto";
    track.style.scrollSnapType = "none";
    const before = track.scrollLeft;
    if (!pathFrame) {
      pathFrame = requestAnimationFrame(() => {
        pathFrame = 0;
        track.scrollLeft += pendingPathDelta;
        pendingPathDelta = 0;
        if (!scrubbing) updateUI();
      });
    }
    lastPathDir = delta >= 0 ? 1 : -1;
    clearTimeout(wheelSnapTimer);
    wheelSnapTimer = setTimeout(settlePathGesture, 130);
    return Math.abs(track.scrollLeft - before) > 1 || pendingPathDelta !== 0;
  }

  function chooseWheelAxis(dx, dy) {
    return Math.abs(dx) > Math.abs(dy) * 1.5 ? "x" : "y";
  }

  let lockedWheelAxis = null;
  let lastWheelAt = 0;
  function wheelToPath(event) {
    if (event.ctrlKey || event.target.closest(".deck, .mac-bar, .acc__panel, iframe")) return;
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientHeight : 1;
    const dx = event.deltaX * scale;
    const dy = event.deltaY * scale;
    if (!dx && !dy) return;
    const now = performance.now();
    if (now - lastWheelAt > 220 || !lockedWheelAxis) {
      lockedWheelAxis = event.shiftKey ? "x" : chooseWheelAxis(dx, dy);
    }
    lastWheelAt = now;
    event.preventDefault();
    if (lockedWheelAxis === "x") {
      applyPathDelta(event.shiftKey ? dy || dx : dx);
    } else {
      const scroller = findVerticalScroller(event.target);
      if (scroller) scroller.scrollTop += dy;
    }
  }

  window.addEventListener("wheel", wheelToPath, { passive: false, capture: true });

  let touchGesture = null;
  track.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1 || event.target.closest("button, a, input, iframe, .case-pair")) {
      touchGesture = null;
      return;
    }
    const point = event.touches[0];
    touchGesture = { x: point.clientX, y: point.clientY, axis: null, scroller: findVerticalScroller(event.target) };
  }, { passive: true });
  track.addEventListener("touchmove", (event) => {
    if (!touchGesture || event.touches.length !== 1) return;
    const point = event.touches[0];
    const dx = touchGesture.x - point.clientX;
    const dy = touchGesture.y - point.clientY;
    if (!touchGesture.axis && Math.hypot(dx, dy) < 8) return;
    touchGesture.axis ||= chooseWheelAxis(dx, dy);
    event.preventDefault();
    if (touchGesture.axis === "x") applyPathDelta(dx);
    else if (touchGesture.scroller) touchGesture.scroller.scrollTop += dy;
    touchGesture.x = point.clientX;
    touchGesture.y = point.clientY;
  }, { passive: false });
  track.addEventListener("touchend", () => { touchGesture = null; }, { passive: true });
  track.addEventListener("touchcancel", () => { touchGesture = null; }, { passive: true });


  track.addEventListener(
    "scroll",
    () => {
      if (!scrubbing) updateUI();
    },
    { passive: true }
  );

  // After any free horizontal gesture ends, force full-page align
  track.addEventListener(
    "scrollend",
    () => {
      if (!scrubbing && !wheelSnapTimer && performance.now() > programmaticUntil) {
        snapToAlignedBay("auto");
      }
    },
    { passive: true }
  );

  window.addEventListener("keydown", (event) => {
    if (event.target.closest("input, textarea")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToIndex(relativeIndex(1));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToIndex(relativeIndex(-1));
    } else if (event.key === "Home") {
      event.preventDefault();
      goToIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goToIndex(total - 1);
    }
  });

  if (btnPrev) btnPrev.addEventListener("click", () => goToIndex(relativeIndex(-1)));
  if (btnNext) btnNext.addEventListener("click", () => goToIndex(relativeIndex(1)));
  if (btnHome) btnHome.addEventListener("click", () => goToIndex(0));

  document.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      goToIndex(Number(btn.dataset.go), "smooth");
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
      track.style.scrollSnapType = "none";
      scrub.setPointerCapture(event.pointerId);
      setFromClientX(event.clientX);
    });
    scrub.addEventListener("pointermove", (event) => {
      if (!scrubbing) return;
      setFromClientX(event.clientX);
    });
    scrub.addEventListener("pointerup", () => {
      scrubbing = false;
      snapToAlignedBay("smooth");
    });
    scrub.addEventListener("pointercancel", () => {
      scrubbing = false;
      snapToAlignedBay("smooth");
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
  // init
  updateUI();
  window.addEventListener("resize", () => { track.scrollTo({ left: bayLeft(active), behavior: "instant" }); updateUI(); });
  track.focus({ preventScroll: true });
})();
