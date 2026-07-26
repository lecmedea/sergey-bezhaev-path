/**
 * PATH OS boot — exactly 90s (1:30) from gate click → site
 * Slow eyelids 10s → matrix + EQ + terminals
 * Head calm first 12s, then fast; infection green→red; warnings; packages log
 * Gate: cookies + enable sound (required)
 */
(() => {
  'use strict';

  const BOOT_END_MS = 90000; // 1:30 total — site must be visible
  const MATERIALIZE_AT_MS = 84000; // start cosmic exit → site zoom
  const COSMIC_DUR = 3200; // fly into space + zoom to site
  const WAKE_MS = 10000; // slow eyelids
  const HEAD_CALM_MS = 12000; // head moves gently first 12s
  const RED_AT_MS = 68000; // infection starts ~1:08
  const RED_BLEND_MS = 12000; // ~12s smooth infection
  const WARN_START_MS = 75000; // 1:15 — warnings one-by-one
  const WARN_FLOOD_MS = 80000; // 1:20 — flood
  const COOKIE_KEY = 'sb_path_cookies_v3';
  const BOOT_DONE_KEY = 'sb_path_boot_done_v1'; // session: don't re-show gate after complete
  const HEAD_VIDEO = 'assets/video/boot-head.mp4';
  const HEAD_VIDEO_2 = 'assets/video/boot-head-2.mp4';
  const HEAD2_AT_MS = 50000; // second character appears at 0:50
  const SPEAKER_CUES_URL = 'assets/video/speaker-cues.json';
  const DIGIT_GLYPHS = '0123456789';
  // Locked EQ colors (NOT infection palette): voice1 red, voice2 green
  const EQ_VOICE1 = [255, 69, 58];   // first voice
  const EQ_VOICE2 = [48, 209, 88];   // second voice — always this green
  const TRAIL_GLYPHS = 'SergeyBezhaev0123456789';
  // Bottom-left console zone — no terminals / no warnings here
  const CONSOLE_SAFE = { leftMax: 48, topMin: 58 };
  let SPEAKER_CUES = null; // [{t, spk}, ...]
  let HIT_TIMES = null;    // impact times (sec) for warning sync
  let speakerLoadPromise = null;

  // Screen short-circuit sparks 1:15–1:19
  const GLITCHES = [
    { t: 75000, x: 0.88, y: 0.10 }, // top-right
    { t: 76000, x: 0.10, y: 0.88 }, // bottom-left
    { t: 77000, x: 0.12, y: 0.74 }, // a bit above previous
    { t: 78000, x: 0.78, y: 0.80 }, // near bottom-right, not extreme
    { t: 79000, x: 0.50, y: 0.70 }  // 20% below center
  ];

  function loadSpeakerCues() {
    if (SPEAKER_CUES) return Promise.resolve(SPEAKER_CUES);
    if (speakerLoadPromise) return speakerLoadPromise;
    speakerLoadPromise = fetch(SPEAKER_CUES_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        SPEAKER_CUES = (data && data.cues) || [];
        HIT_TIMES = (data && data.hits) || [];
        return SPEAKER_CUES;
      })
      .catch(() => {
        SPEAKER_CUES = [];
        HIT_TIMES = [];
        return SPEAKER_CUES;
      });
    return speakerLoadPromise;
  }

  function speakerAt(timeSec) {
    const cues = SPEAKER_CUES;
    if (!cues || !cues.length) return 0;
    let spk = cues[0].spk;
    for (let i = 0; i < cues.length; i++) {
      if (cues[i].t <= timeSec) spk = cues[i].spk;
      else break;
    }
    return spk;
  }

  function hexToRgb(hex) {
    const h = String(hex || '#30d158').replace('#', '');
    if (h.length === 3) {
      return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
    }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function rgbCss(ch, a) {
    if (a == null) return `rgb(${ch[0] | 0},${ch[1] | 0},${ch[2] | 0})`;
    return `rgba(${ch[0] | 0},${ch[1] | 0},${ch[2] | 0},${a})`;
  }

  function mixRgb(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  }

  const GREEN = {
    rain: [0, 255, 120, 0.85],
    rainHot: [200, 255, 220, 0.95],
    eq: [48, 209, 88],
    term: [0, 255, 140]
  };
  const RED = {
    rain: [255, 40, 60, 0.88],
    rainHot: [255, 180, 180, 0.95],
    eq: [255, 69, 58],
    term: [255, 90, 100]
  };

  const TERM_LINES = [
    'BEZHAEV_INDUSTRIES :: core.mount()',
    'encoding lattice… OK',
    'decrypt skill://ai-digital-product',
    'orbit.deck.calibrate(horizontal)',
    'path.modules.load([azimut,grillz,elena])',
    'neural.interface.boot()',
    'ethics.core.check() → human-first',
    'compile://ui-atoms --precision=ive',
    'stream audio.sync(eq)',
    'matrix.rain.bind(canvas)',
    'warn: 4th wall integrity 12%',
    'operator: Sergey Bezhaev',
    'entity PATH OS · online',
    'hash 0x' + Math.random().toString(16).slice(2, 10),
    'telemetry://path ping 14ms',
    'rebuild consciousness…',
    'link modules: vision, build, ship',
    'sandbox://safe-mode',
    'deploy stage: public',
    'BEZHAEV_INDUSTRIES © systems'
  ];

  const WARNINGS = [
    'WARNING · SYSTEM PERSONA SHIFT DETECTED',
    'WARNING · BEZHAEV INDUSTRIES PROTOCOL BREACH',
    'WARNING · PATH OS NO LONGER IN SAFE MODE',
    'WARNING · USER IS INSIDE THE MACHINE',
    'WARNING · 4TH WALL COLLAPSE IMMINENT',
    'WARNING · DIGITAL ENTITY STABILIZING',
    'WARNING · BEZHAEV · AUTHORIZED ONLY',
    'WARNING · REALITY MESH REWRITING UI',
    'WARNING · YOU OPENED THIS — I NOTICED',
    'WARNING · HIGH ENERGY DISCHARGE',
    'WARNING · CONSCIOUSNESS THRESHOLD EXCEEDED',
    'WARNING · BEZHAEV INDUSTRIES · CLASSIFIED'
  ];

  // Package-install log of Sergey Bezhaev cases (EN, CLI style + creative)
  const LOG_LINES = [
    { t: 1200, text: '$ path-os init --operator=Sergey.Bezhaev', cls: 'line--sys' },
    { t: 2800, text: 'resolving dependencies for portfolio workspace…', cls: 'line--sys' },
    { t: 4500, text: 'fetch package: origin-hero@1.0.0', cls: 'line--ok' },
    { t: 6200, text: 'unpacking  dist/origin/path-modules.webp  OK', cls: 'line--ok' },
    { t: 8000, text: 'fetch package: profile-core@2025.6', cls: 'line--ok' },
    { t: 9800, text: 'installing  who-i-am-honestly.md  · human-first ethics', cls: 'line--ok' },
    { t: 12000, text: 'fetch package: azimut-clinic@2.4.1  (azimutclinic.ru)', cls: 'line--ok' },
    { t: 14500, text: '  → medical digital / UX / content pipeline', cls: 'line--sys' },
    { t: 16800, text: 'unpacking  cases/azimut/site-build.tgz  ████████░░ 82%', cls: 'line--ok' },
    { t: 19200, text: 'fetch package: grillz-customs-moscow@1.8.0  (grillzcustoms.ru)', cls: 'line--ok' },
    { t: 21800, text: '  → constructor · forma · product, not a mockup', cls: 'line--sys' },
    { t: 24200, text: 'installing  cases/grillz/constructor.wasm  OK', cls: 'line--ok' },
    { t: 26800, text: 'fetch package: elena-shop@1.3.2  (elena.shop)', cls: 'line--ok' },
    { t: 29200, text: '  → brand e-com · craft storefront', cls: 'line--sys' },
    { t: 31800, text: 'unpacking  cases/elena/theme-pack.tgz  OK', cls: 'line--ok' },
    { t: 34500, text: 'fetch package: soft-automation@0.9.4', cls: 'line--ok' },
    { t: 37000, text: '  → 2GIS parsers · TG→Excel · bots · static ship', cls: 'line--sys' },
    { t: 39800, text: 'installing  bin/ai-coder  bin/chat-export  OK', cls: 'line--ok' },
    { t: 42500, text: 'fetch package: ai-blogger-bb@1.0.0-first-in-rf', cls: 'line--ok' },
    { t: 45200, text: '  → Bad Balance · AI content system (not a toy demo)', cls: 'line--break' },
    { t: 48000, text: 'linking  collaborators/*  clients/*  · graph OK', cls: 'line--ok' },
    { t: 51000, text: 'fetch package: house-gallery@0.7.1', cls: 'line--ok' },
    { t: 53800, text: '  → walk the rooms · flip the lights · do not break', cls: 'line--sys' },
    { t: 56500, text: 'fetch package: legal-disclaimer@1.1.0', cls: 'line--ok' },
    { t: 59000, text: '  → authorship · IP · rules of the game', cls: 'line--sys' },
    { t: 62000, text: 'fetch package: contact-cta@1.0.0', cls: 'line--ok' },
    { t: 64500, text: 'warn: signal instability · color vector warming…', cls: 'line--warn' },
    { t: 68000, text: 'INFECTION · packages still resolving under red load', cls: 'line--danger' },
    { t: 72000, text: 'npm run path:ship -- --all-cases', cls: 'line--sys' },
    { t: 76000, text: 'WARNING cascade · keep installing anyway', cls: 'line--danger' },
    { t: 80000, text: 'solidifying UI atoms from case modules…', cls: 'line--sys' },
    { t: 84000, text: 'build complete · 10 bays linked · welcome to Path', cls: 'line--break' },
    { t: 87000, text: '$ open ./sergey.bezhaev/portfolio.workspace', cls: 'line--ok' }
  ];

  const $ = (s, r = document) => r.querySelector(s);

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(t) {
    const x = Math.max(0, Math.min(1, t));
    // smootherstep — infection feels organic
    return x * x * x * (x * (x * 6 - 15) + 10);
  }

  function mixChan(a, b, t) {
    return a.map((v, i) => lerp(v, b[i], t));
  }

  function rgba(ch) {
    if (ch.length === 4) {
      return `rgba(${ch[0] | 0},${ch[1] | 0},${ch[2] | 0},${ch[3]})`;
    }
    return `rgb(${ch[0] | 0},${ch[1] | 0},${ch[2] | 0})`;
  }

  function hexFromRgb(ch) {
    const h = (n) => Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, '0');
    return '#' + h(ch[0]) + h(ch[1]) + h(ch[2]);
  }

  function paletteAt(infect) {
    const t = smoothstep(infect);
    return {
      rain: rgba(mixChan(GREEN.rain, RED.rain, t)),
      rainHot: rgba(mixChan(GREEN.rainHot, RED.rainHot, t)),
      eq: hexFromRgb(mixChan(GREEN.eq, RED.eq, t)),
      term: mixChan(GREEN.term, RED.term, t).map((n) => n | 0),
      t
    };
  }

  /* Disclaimer plates: macOS → 02–04, Windows/other → 01+05 */
  const PLATES_MAC = ['02', '03', '04'];
  const PLATES_WIN = ['01', '05'];

  // Lebedev-grade: short, rude, funny. Both buttons start the boot.
  const BTN_PAIRS = [
    ['Жми. Не ной.', 'Я не трус'],
    ['Включить звук, брат', 'Ломаем 4-ю стену'],
    ['Тащи меня внутрь', 'Без тормозов'],
    ['Согласен на всё', 'Пусть болит'],
    ['Я готов. Жги.', 'Не ссы — входи'],
    ['Окей, ломаем', 'Цифра зовёт'],
    ['Поехали, красавчик', 'Дальше без нытья'],
    ['Жми сюда, герой', 'Хватит пялиться'],
    ['В систему, живо', 'Cookies? Пофиг'],
    ['Давай уже', 'Я в деле']
  ];

  function detectOsPool() {
    const ua = navigator.userAgent || '';
    const p = navigator.platform || '';
    const mac = /Mac|iPhone|iPad|iPod/i.test(p) || /Mac OS X|Macintosh/i.test(ua);
    // Windows explicit; everyone else (Linux, Android, unknown) → win pool per brief
    return mac ? PLATES_MAC : PLATES_WIN;
  }

  function pickPlate() {
    const pool = detectOsPool();
    return pool[(Math.random() * pool.length) | 0];
  }

  function pickBtnPair() {
    return BTN_PAIRS[(Math.random() * BTN_PAIRS.length) | 0];
  }

  function createBootDOM() {
    const plate = pickPlate();
    const [btnA, btnB] = pickBtnPair();
    const root = document.createElement('div');
    root.className = 'boot is-gate';
    root.id = 'bootSequence';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Cookies · Audio · 4th wall');
    root.innerHTML = `
      <canvas class="boot__rain" id="bootRain" aria-hidden="true"></canvas>
      <div class="boot__infect" id="bootInfect" aria-hidden="true"></div>
      <canvas class="boot__eq" id="bootEq" aria-hidden="true"></canvas>
      <div class="boot__terms" id="bootTerms" aria-hidden="true"></div>
      <div class="boot__warnings" id="bootWarnings" aria-hidden="true"></div>
      <div class="boot__glitches" id="bootGlitches" aria-hidden="true"></div>
      <div class="boot__scan" aria-hidden="true"></div>
      <div class="boot__vignette" aria-hidden="true"></div>
      <div class="boot__eyelids" aria-hidden="true">
        <div class="boot__lid boot__lid--top"></div>
        <div class="boot__lid boot__lid--bot"></div>
      </div>
      <canvas class="boot__head-trail" id="bootHeadTrail" aria-hidden="true"></canvas>
      <div class="boot__head" id="bootHead" aria-hidden="true">
        <video
          id="bootVideo"
          class="boot__head-video"
          playsinline
          webkit-playsinline
          preload="auto"
          src="${HEAD_VIDEO}"
        ></video>
      </div>
      <canvas class="boot__head-trail boot__head-trail--cyan" id="bootHead2Trail" aria-hidden="true"></canvas>
      <div class="boot__head boot__head--alt" id="bootHead2" aria-hidden="true">
        <video
          id="bootVideo2"
          class="boot__head-video"
          playsinline
          webkit-playsinline
          muted
          preload="auto"
          src="${HEAD_VIDEO_2}"
        ></video>
      </div>
      <canvas class="boot__digits" id="bootDigits" aria-hidden="true"></canvas>

      <button type="button" class="boot__skip" id="bootSkip" title="Пропустить запуск" aria-label="Пропустить запуск и открыть главную">
        <img src="assets/ui/jarvis-fab.gif" alt="" width="64" height="64" decoding="async">
        <span class="boot__skip-tip">SKIP</span>
      </button>

      <div class="boot__gate" id="bootGate" data-plate="${plate}">
        <div class="boot__plate">
          <img
            class="boot__plate-img"
            src="assets/gate/plate-${plate}.jpg"
            alt="Cookies · Audio · 4th wall — дисклеймер Bezhaev Industries"
            width="1536"
            height="1024"
            decoding="async"
          />
          <p class="boot__plate-sr">
            Проснись друг или подруга. Система ждёт тебя.
            Сайт использует cookies. Запуск только со звуком.
          </p>
          <div class="boot__plate-actions">
            <button type="button" class="boot__plate-btn boot__plate-btn--ok" id="bootEnableSound" data-boot-go>${btnA}</button>
            <button type="button" class="boot__plate-btn boot__plate-btn--danger" id="bootEnableSoundAlt" data-boot-go>${btnB}</button>
          </div>
        </div>
      </div>

      <div class="boot__console" id="bootConsole">
        <div class="boot__status-list" id="bootLines"></div>
        <div class="boot__bar"><div class="boot__bar-fill" id="bootBar"></div></div>
        <div class="boot__meta">
          <span id="bootPhase">GATE</span>
          <span id="bootPct">0%</span>
        </div>
      </div>
    `;
    document.body.prepend(root);
    return root;
  }

  /**
   * Head ghost: video = audio + floating face.
   * Fast jumps; trail of SergeyBezhaev glyphs; show when red face in frame.
   */
  function startHeadGhost(video, host, trailCanvas) {
    if (!video || !host) return () => {};

    const sample = document.createElement('canvas');
    sample.width = 80;
    sample.height = 120;
    sample.className = 'boot__head-sample';
    sample.setAttribute('aria-hidden', 'true');
    host.parentElement?.appendChild(sample);
    const sctx = sample.getContext('2d', { willReadFrequently: true, alpha: false });

    let tctx = null;
    let tw = 0;
    let th = 0;
    function sizeTrail() {
      if (!trailCanvas) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      tw = trailCanvas.width = innerWidth * dpr;
      th = trailCanvas.height = innerHeight * dpr;
      trailCanvas.style.width = '100%';
      trailCanvas.style.height = '100%';
      tctx = trailCanvas.getContext('2d');
    }
    if (trailCanvas) {
      sizeTrail();
      addEventListener('resize', sizeTrail, { passive: true });
    }

    let raf = 0;
    let visible = false;
    let nextJump = 0;
    let stopped = false;
    let tick = 0;
    let forceShow = false;
    let glyphI = 0;
    const headT0 = performance.now();
    const trail = []; // {x,y,ch,life,size}

    // Avoid bottom-left console (package log)
    const POS_CALM = [
      { left: '50%', top: '10%', right: 'auto', bottom: 'auto', transform: 'translateX(-50%)' },
      { right: '6%', top: '12%', left: 'auto', bottom: 'auto', transform: 'none' },
      { left: '8%', top: '14%', right: 'auto', bottom: 'auto', transform: 'none' },
      { right: '10%', top: '38%', left: 'auto', bottom: 'auto', transform: 'none' },
      { left: '55%', top: '42%', right: 'auto', bottom: 'auto', transform: 'none' }
    ];
    const POS_FAST = [
      { left: '2%', top: '8%', right: 'auto', bottom: 'auto', transform: 'none' },
      { right: '2%', top: '8%', left: 'auto', bottom: 'auto', transform: 'none' },
      { right: '2%', bottom: '18%', left: 'auto', top: 'auto', transform: 'none' },
      { left: '4%', top: '36%', right: 'auto', bottom: 'auto', transform: 'none' },
      { right: '4%', top: '36%', left: 'auto', bottom: 'auto', transform: 'none' },
      { left: '50%', top: '8%', right: 'auto', bottom: 'auto', transform: 'translateX(-50%)' },
      { left: '55%', bottom: '16%', right: 'auto', top: 'auto', transform: 'none' },
      { left: '10%', top: '16%', right: 'auto', bottom: 'auto', transform: 'none' },
      { right: '10%', top: '20%', left: 'auto', bottom: 'auto', transform: 'none' },
      { left: '52%', top: '48%', right: 'auto', bottom: 'auto', transform: 'none' },
      { right: '18%', top: '52%', left: 'auto', bottom: 'auto', transform: 'none' }
    ];
    const SIZES_CALM = [0.26, 0.3, 0.34];
    const SIZES_FAST = [0.22, 0.28, 0.34, 0.4, 0.48, 0.56];

    const HERO_MS = 5000; // first 5s: huge centered face

    function isCalmPhase() {
      return performance.now() - headT0 < HEAD_CALM_MS;
    }

    function isHeroPhase() {
      return performance.now() - headT0 < HERO_MS;
    }

    function relayout() {
      // 0–5s: locked center, very large
      if (isHeroPhase()) {
        host.style.width = Math.min(innerWidth * 0.92, innerHeight * 0.78, 720) + 'px';
        host.style.left = '50%';
        host.style.right = 'auto';
        host.style.top = '50%';
        host.style.bottom = 'auto';
        host.style.transform = 'translate(-50%, -50%)';
        host.classList.add('is-hero');
        nextJump = headT0 + HERO_MS;
        return;
      }
      host.classList.remove('is-hero');
      const calm = isCalmPhase();
      const pool = calm ? POS_CALM : POS_FAST;
      const sizes = calm ? SIZES_CALM : SIZES_FAST;
      const minSide = Math.min(innerWidth, innerHeight);
      const frac = sizes[(Math.random() * sizes.length) | 0];
      const w = Math.round(Math.max(130, Math.min(480, minSide * frac)));
      host.style.width = w + 'px';
      const pos = pool[(Math.random() * pool.length) | 0];
      host.style.left = pos.left;
      host.style.right = pos.right;
      host.style.top = pos.top;
      host.style.bottom = pos.bottom;
      host.style.transform = pos.transform;
      // first 12s: slow drift; then snappy 0.35–0.9s
      nextJump = performance.now() + (calm
        ? 2200 + Math.random() * 2800
        : 350 + Math.random() * 550);
    }

    relayout();
    host.classList.remove('is-on', 'is-dim');
    // keep hero locked until 5s even if sample wants to jump
    setTimeout(() => {
      if (!stopped) relayout();
    }, HERO_MS + 30);

    function pushTrail() {
      if (!visible || !tctx) return;
      const r = host.getBoundingClientRect();
      if (r.width < 8) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const cx = (r.left + r.width / 2) * dpr;
      const cy = (r.top + r.height / 2) * dpr;
      // spray glyphs behind the box
      for (let k = 0; k < 5; k++) {
        glyphI = (glyphI + 1) % TRAIL_GLYPHS.length;
        trail.push({
          x: cx + (Math.random() - 0.5) * r.width * dpr * 0.9,
          y: cy + (Math.random() - 0.5) * r.height * dpr * 0.9,
          ch: TRAIL_GLYPHS[glyphI],
          life: 1,
          size: (10 + Math.random() * 16) * dpr
        });
      }
      if (trail.length > 220) trail.splice(0, trail.length - 220);
    }

    function drawTrail() {
      if (!tctx) return;
      tctx.clearRect(0, 0, tw, th);
      tctx.textAlign = 'center';
      tctx.textBaseline = 'middle';
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.life -= 0.028;
        if (p.life <= 0) {
          trail.splice(i, 1);
          continue;
        }
        tctx.globalAlpha = p.life * 0.85;
        tctx.fillStyle = `rgba(255,${60 + (1 - p.life) * 80 | 0},${70 + (1 - p.life) * 40 | 0},1)`;
        tctx.font = `600 ${p.size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        tctx.fillText(p.ch, p.x, p.y);
        // drift slightly opposite to last motion (outward fade)
        p.x += (Math.random() - 0.5) * 2;
        p.y += (Math.random() - 0.5) * 2;
      }
      tctx.globalAlpha = 1;
    }

    function sampleFrame() {
      if (stopped) return;
      tick++;
      if (video.readyState < 2) {
        raf = requestAnimationFrame(sampleFrame);
        return;
      }
      try {
        sctx.drawImage(video, 0, 0, sample.width, sample.height);
        const { data } = sctx.getImageData(0, 0, sample.width, sample.height);
        let maxL = 0;
        let maxR = 0;
        let hot = 0;
        const n = sample.width * sample.height;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const L = 0.299 * r + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (L > maxL) maxL = L;
          if (r > maxR) maxR = r;
          if (r > 28 || L > 22) hot++;
        }
        const hotRatio = hot / n;
        let show = maxR > 36 || maxL > 28 || hotRatio > 0.015;
        if (!forceShow && video.currentTime > 4 && !visible && tick > 120) forceShow = true;
        if (forceShow) show = true;

        const now = performance.now();
        // first 5s: always show huge center face
        if (isHeroPhase()) {
          show = true;
          forceShow = true;
          host.classList.add('is-on');
          host.classList.remove('is-dim');
          if (!visible) {
            visible = true;
            relayout();
          }
        }
        if (show) {
          if (!visible) {
            visible = true;
            relayout();
            host.classList.add('is-on');
          } else if (now >= nextJump && !isHeroPhase()) {
            relayout();
          }
          if (tick % 2 === 0) pushTrail();
          if (!isHeroPhase() && !forceShow && maxR < 70 && maxL < 50) host.classList.add('is-dim');
          else host.classList.remove('is-dim');
        } else if (visible && !isHeroPhase()) {
          visible = false;
          host.classList.remove('is-on', 'is-dim');
        }
        drawTrail();
      } catch (e) { /* frame not ready */ }
      raf = requestAnimationFrame(sampleFrame);
    }

    try {
      video.setAttribute('playsinline', '');
      video.playsInline = true;
    } catch { /* */ }

    raf = requestAnimationFrame(sampleFrame);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      sample.remove();
      if (trailCanvas) removeEventListener('resize', sizeTrail);
      if (tctx) tctx.clearRect(0, 0, tw, th);
      host.classList.remove('is-on', 'is-dim');
    };
  }

  /**
   * Second head @ 0:50 — cyan digit trail infects red near clip end.
   */
  function startSecondaryHead(video, host, trailCanvas) {
    if (!video || !host) return () => {};

    let tctx = null;
    let tw = 0;
    let th = 0;
    let raf = 0;
    let stopped = false;
    let nextJump = 0;
    let glyphI = 0;
    const trail = [];

    const POS = [
      { left: 'auto', right: '4%', top: '12%', bottom: 'auto', transform: 'none' },
      { left: '6%', right: 'auto', top: '18%', bottom: 'auto', transform: 'none' },
      { left: 'auto', right: '8%', top: '42%', bottom: 'auto', transform: 'none' },
      { left: '50%', right: 'auto', top: '10%', bottom: 'auto', transform: 'translateX(-50%)' },
      { left: 'auto', right: '12%', top: 'auto', bottom: '20%', transform: 'none' },
      { left: '10%', right: 'auto', top: '48%', bottom: 'auto', transform: 'none' }
    ];
    const SIZES = [0.28, 0.34, 0.4, 0.48];

    function sizeTrail() {
      if (!trailCanvas) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      tw = trailCanvas.width = innerWidth * dpr;
      th = trailCanvas.height = innerHeight * dpr;
      trailCanvas.style.width = '100%';
      trailCanvas.style.height = '100%';
      tctx = trailCanvas.getContext('2d');
    }
    if (trailCanvas) {
      sizeTrail();
      addEventListener('resize', sizeTrail, { passive: true });
    }

    function relayout() {
      const minSide = Math.min(innerWidth, innerHeight);
      const frac = SIZES[(Math.random() * SIZES.length) | 0];
      host.style.width = Math.round(Math.max(140, Math.min(420, minSide * frac))) + 'px';
      const pos = POS[(Math.random() * POS.length) | 0];
      host.style.left = pos.left;
      host.style.right = pos.right;
      host.style.top = pos.top;
      host.style.bottom = pos.bottom;
      host.style.transform = pos.transform;
      nextJump = performance.now() + 480 + Math.random() * 720;
    }

    function infectionT() {
      const dur = video.duration && isFinite(video.duration) ? video.duration : 8.6;
      const t = video.currentTime || 0;
      // cyan early → red infection ramps in last ~45% of clip
      const u = Math.max(0, Math.min(1, (t / dur - 0.5) / 0.5));
      return u * u * (3 - 2 * u);
    }

    function lerpC(a, b, t) {
      return (a + (b - a) * t) | 0;
    }

    function pushTrail() {
      if (!tctx) return;
      const r = host.getBoundingClientRect();
      if (r.width < 8) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const cx = (r.left + r.width / 2) * dpr;
      const cy = (r.top + r.height / 2) * dpr;
      const n = 8;
      for (let k = 0; k < n; k++) {
        glyphI = (glyphI + 1) % DIGIT_GLYPHS.length;
        const ang = Math.random() * Math.PI * 2;
        const sp = (1.4 + Math.random() * 4) * dpr;
        trail.push({
          x: cx + (Math.random() - 0.5) * r.width * dpr * 0.9,
          y: cy + (Math.random() - 0.5) * r.height * dpr * 0.9,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          ch: DIGIT_GLYPHS[glyphI],
          life: 1,
          size: (13 + Math.random() * 22) * dpr,
          infect: infectionT()
        });
      }
      if (trail.length > 360) trail.splice(0, trail.length - 360);
    }

    function drawTrail() {
      if (!tctx) return;
      tctx.clearRect(0, 0, tw, th);
      tctx.textAlign = 'center';
      tctx.textBaseline = 'middle';
      const liveInfect = infectionT();
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.life -= 0.016;
        if (p.life <= 0) {
          trail.splice(i, 1);
          continue;
        }
        p.infect = Math.min(1, p.infect + liveInfect * 0.014 + 0.0035);
        const t = Math.max(p.infect, liveInfect * 0.9);
        // cyan (80,210,255) → disease red (255,45,65)
        const cr = lerpC(80, 255, t);
        const cg = lerpC(210, 42, t);
        const cb = lerpC(255, 62, t);
        tctx.globalAlpha = p.life * 0.92;
        tctx.fillStyle = `rgba(${cr},${cg},${cb},1)`;
        tctx.shadowColor = `rgba(${cr},${cg},${cb},0.7)`;
        tctx.shadowBlur = 12 * (devicePixelRatio || 1);
        tctx.font = `700 ${p.size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        tctx.fillText(p.ch, p.x, p.y);
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.982;
        p.vy *= 0.982;
      }
      tctx.shadowBlur = 0;
      tctx.globalAlpha = 1;
    }

    function frame() {
      if (stopped) return;
      const now = performance.now();
      if (now >= nextJump) relayout();
      const dens = 1 + infectionT() * 2.2;
      if (Math.random() < 0.6 * dens) pushTrail();
      if (Math.random() < 0.4 * dens) pushTrail();
      drawTrail();

      const it = infectionT();
      host.style.setProperty('--h2-infect', String(it));
      if (it > 0.5) host.classList.add('is-infecting');
      else host.classList.remove('is-infecting');

      if (video.ended) {
        host.classList.add('is-fading');
        // let trail die out after clip ends
        if (trail.length < 8) {
          host.classList.remove('is-on', 'is-fading', 'is-infecting');
          if (tctx) tctx.clearRect(0, 0, tw, th);
          stopped = true;
          return;
        }
      }

      raf = requestAnimationFrame(frame);
    }

    host.classList.add('is-on');
    relayout();
    try {
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0;
      video.play().catch(() => {});
    } catch { /* */ }
    raf = requestAnimationFrame(frame);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (trailCanvas) removeEventListener('resize', sizeTrail);
      if (tctx) tctx.clearRect(0, 0, tw, th);
      try { video.pause(); } catch { /* */ }
      host.classList.remove('is-on', 'is-dim', 'is-fading', 'is-infecting');
    };
  }

  function wrapSiteShell() {
    const boot = document.getElementById('bootSequence');
    const shell = document.createElement('div');
    shell.className = 'site-shell';
    [...document.body.childNodes].forEach((n) => {
      if (n === boot) return;
      shell.appendChild(n);
    });
    document.body.appendChild(shell);
  }

  /* Matrix rain — palette from infection blend */
  function startRain(canvas, getPalette) {
    const ctx = canvas.getContext('2d');
    let w, h, cols, fontSize, raf;
    const glyphs = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン<>/$#@%&*BEZHAEV';

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      fontSize = Math.max(12, Math.floor(w / 72));
      cols = Array.from({ length: Math.floor(w / fontSize) }, () => Math.random() * h);
    }
    function frame() {
      const pal = getPalette();
      ctx.fillStyle = 'rgba(0,0,0,0.075)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < cols.length; i++) {
        const ch = glyphs[(Math.random() * glyphs.length) | 0];
        const x = i * fontSize;
        const y = cols[i] * fontSize;
        // staggered infection: columns tip red earlier near center
        ctx.fillStyle = i % 9 === 0 ? pal.rainHot : pal.rain;
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.975) cols[i] = 0;
        else cols[i] += 0.7 + Math.random() * 0.55;
      }
      raf = requestAnimationFrame(frame);
    }
    resize();
    addEventListener('resize', resize, { passive: true });
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }

  /* Equalizer — color is STRICT voice mapping (not infection palette, not random)
   * Voice 1 (first / lower pitch) = red; Voice 2 = fixed green */
  function startEq(canvas, media, getPalette) {
    const ctx = canvas.getContext('2d');
    let analyser = null;
    let data = null;
    let acRef = null;
    let raf = 0;
    let fakeT = 0;
    let lastVoice = 1;
    let stableVoice = 1;
    let stableCount = 0;

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && media) {
        acRef = new AC();
        const src = acRef.createMediaElementSource(media);
        analyser = acRef.createAnalyser();
        // larger FFT → better low-frequency pitch estimate
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.55;
        data = new Uint8Array(analyser.frequencyBinCount);
        src.connect(analyser);
        analyser.connect(acRef.destination);
        acRef.resume?.();
      }
    } catch (e) {
      console.warn('eq analyser', e);
    }

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
    resize();
    addEventListener('resize', resize, { passive: true });

    /** Dominant frequency in speech band → voice id, 0 = silence */
    function voiceFromSpectrum() {
      if (!analyser || !data || !acRef) return 0;
      analyser.getByteFrequencyData(data);
      const sr = acRef.sampleRate || 44100;
      const binHz = sr / analyser.fftSize;
      const i0 = Math.max(1, Math.floor(80 / binHz));
      const i1 = Math.min(data.length - 1, Math.floor(380 / binHz));
      let bestI = i0;
      let bestV = 0;
      let energy = 0;
      for (let i = i0; i <= i1; i++) {
        const v = data[i];
        energy += v;
        if (v > bestV) {
          bestV = v;
          bestI = i;
        }
      }
      // not voiced
      if (bestV < 48 || energy / (i1 - i0 + 1) < 18) return 0;
      const f0 = bestI * binHz;
      // lower fundamental → first voice (red); higher → second (green)
      return f0 < 155 ? 1 : 2;
    }

    function frame() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const bars = 48;
      const cx = w / 2;
      const cy = h * 0.48;
      const maxH = h * 0.22;
      const gap = 4 * dpr;
      const barW = Math.max(3 * dpr, (w * 0.42) / bars - gap);

      // 1) realtime pitch, 2) offline cues as tie-break / silence hold
      const tMedia = media && Number.isFinite(media.currentTime) ? media.currentTime : 0;
      let live = voiceFromSpectrum();
      let cued = speakerAt(tMedia);
      let spk = 0;
      if (live === 1 || live === 2) {
        // require 3 consecutive frames to flip (anti-jitter)
        if (live === stableVoice) stableCount++;
        else {
          stableVoice = live;
          stableCount = 1;
        }
        if (stableCount >= 3) spk = live;
        else spk = lastVoice;
      } else if (cued === 1 || cued === 2) {
        spk = cued;
      } else {
        spk = lastVoice; // hold through silence
      }
      if (spk === 1 || spk === 2) lastVoice = spk;

      // HARD colors — never blend with infection palette
      const eqRgb = lastVoice === 1 ? EQ_VOICE1 : EQ_VOICE2;
      const eqCss = rgbCss(eqRgb);
      const eqSoft = rgbCss(eqRgb, 0.15);
      const eqRing = rgbCss(eqRgb, 0.35);

      let levels;
      if (analyser && data) {
        // reuse spectrum; map mid-band for visual bars
        levels = Array.from({ length: bars }, (_, i) => {
          const idx = Math.floor((i / bars) * (data.length * 0.55));
          return data[idx] / 255;
        });
      } else {
        fakeT += 0.08;
        levels = Array.from({ length: bars }, (_, i) => 0.15 + 0.5 * Math.abs(Math.sin(fakeT + i * 0.35)));
      }

      for (let i = 0; i < bars; i++) {
        const v = levels[i] || 0;
        const bh = Math.max(4 * dpr, v * maxH);
        const x = cx - (bars * (barW + gap)) / 2 + i * (barW + gap);
        const g = ctx.createLinearGradient(0, cy - bh, 0, cy + bh);
        g.addColorStop(0, eqCss);
        g.addColorStop(1, eqSoft);
        ctx.fillStyle = g;
        ctx.fillRect(x, cy - bh, barW, bh * 2);
      }

      ctx.beginPath();
      ctx.arc(cx, cy, maxH * 1.15, 0, Math.PI * 2);
      ctx.strokeStyle = eqRing;
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();

      ctx.fillStyle = eqCss;
      ctx.globalAlpha = 0.7;
      ctx.font = `${11 * dpr}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('BEZHAEV INDUSTRIES · AUDIO BUS', cx, cy + maxH * 1.35);
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
    };
  }

  function inConsoleSafeZone(leftPct, topPct) {
    return leftPct < CONSOLE_SAFE.leftMax && topPct > CONSOLE_SAFE.topMin;
  }

  /* Floating terminals — full screen except bottom-left package console */
  function startTerminals(host, getPalette) {
    host.innerHTML = '';
    const n = Math.min(14, Math.max(8, Math.floor(innerWidth / 140)));
    const terms = [];
    const cols = Math.ceil(Math.sqrt(n * (innerWidth / Math.max(innerHeight, 1))));
    const rows = Math.ceil(n / cols);
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // skip cells that sit in bottom-left console zone
        const cellLeft = (c / cols) * 100;
        const cellTop = (r / rows) * 100;
        if (inConsoleSafeZone(cellLeft + 5, cellTop + 5)) continue;
        cells.push({ r, c });
      }
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = cells[i]; cells[i] = cells[j]; cells[j] = tmp;
    }
    // if too few cells, pad with safe random positions
    while (cells.length < n) {
      cells.push({ r: -1, c: -1 });
    }
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'boot__term';
      el.innerHTML = `<header>term://${i + 1} · bezhaev</header><pre></pre>`;
      host.appendChild(el);
      let left;
      let top;
      const cell = cells[i];
      if (cell.r >= 0) {
        const cellW = 100 / cols;
        const cellH = 100 / rows;
        left = Math.min(92, Math.max(0.5, cell.c * cellW + Math.random() * (cellW * 0.72)));
        top = Math.min(88, Math.max(0.5, cell.r * cellH + Math.random() * (cellH * 0.72)));
      } else {
        left = 50 + Math.random() * 42;
        top = 4 + Math.random() * 50;
      }
      // hard reject console corner
      if (inConsoleSafeZone(left, top)) {
        left = 52 + Math.random() * 40;
        top = 8 + Math.random() * 45;
      }
      el.style.left = left + '%';
      el.style.top = top + '%';
      el.style.animationDelay = (Math.random() * 2) + 's';
      terms.push({
        el,
        pre: el.querySelector('pre'),
        lines: [],
        bias: 0.08 + Math.random() * 0.35
      });
    }

    const iv = setInterval(() => {
      const pal = getPalette();
      const baseT = pal.t || 0;
      terms.forEach((t) => {
        const local = Math.max(0, Math.min(1, (baseT - t.bias * 0.4) / Math.max(0.01, 1 - t.bias * 0.4)));
        const tr = (lerp(GREEN.term[0], RED.term[0], local)) | 0;
        const tg = (lerp(GREEN.term[1], RED.term[1], local)) | 0;
        const tb = (lerp(GREEN.term[2], RED.term[2], local)) | 0;
        t.el.style.setProperty('--t-r', tr);
        t.el.style.setProperty('--t-g', tg);
        t.el.style.setProperty('--t-b', tb);
        if (local > 0.55) {
          t.el.style.background = `rgba(18, 0, 4, ${0.7 + local * 0.2})`;
        }

        if (Math.random() > 0.55) {
          const line = TERM_LINES[(Math.random() * TERM_LINES.length) | 0]
            + (Math.random() > 0.6 ? ' 0x' + Math.random().toString(16).slice(2, 8) : '');
          t.lines.push(line);
          if (t.lines.length > 8) t.lines.shift();
          t.pre.textContent = t.lines.join('\n');
        }
        if (Math.random() > 0.92) {
          t.el.style.opacity = 0.35 + Math.random() * 0.65;
        }
      });
    }, 280);

    return () => {
      clearInterval(iv);
      host.innerHTML = '';
    };
  }

  function spawnWarn(host, text) {
    const w = document.createElement('div');
    w.className = 'boot__warn boot__warn--in';
    w.textContent = text || WARNINGS[(Math.random() * WARNINGS.length) | 0];
    let left = 2 + Math.random() * 72;
    let top = 4 + Math.random() * 82;
    // keep package log readable — no warnings over bottom-left console
    if (inConsoleSafeZone(left, top)) {
      left = 50 + Math.random() * 42;
      top = 6 + Math.random() * 50;
    }
    w.style.left = left + '%';
    w.style.top = top + '%';
    w.style.fontSize = (11 + Math.random() * 12) + 'px';
    w.style.setProperty('--rot', ((Math.random() - 0.5) * 8).toFixed(2) + 'deg');
    host.appendChild(w);
    return w;
  }

  /**
   * Warnings: from 1:15 one-per-hit/second, from 1:20 flood to fill space.
   * Timed to impact peaks in the audio when available.
   */
  function startWarningsProgressive(host, media, t0perf) {
    host.innerHTML = '';
    host.classList.add('is-on');
    let idx = 0;
    let flood = false;
    let lastHitI = 0;
    let lastSpawn = 0;
    let stopped = false;
    let raf = 0;
    const timers = [];

    // fallback one-per-second 75..80 if no hits
    for (let s = 0; s < 5; s++) {
      timers.push(setTimeout(() => {
        if (stopped || flood) return;
        if (host.childElementCount < 5) {
          spawnWarn(host, WARNINGS[idx++ % WARNINGS.length]);
        }
      }, WARN_START_MS + s * 1000));
    }

    function mediaTime() {
      if (media && Number.isFinite(media.currentTime)) return media.currentTime;
      return (performance.now() - t0perf) / 1000;
    }

    function tick() {
      if (stopped) return;
      const t = mediaTime();
      const now = performance.now();

      // single phase 75–80s: spawn on hits (~1/sec cadence)
      if (t >= 75 && t < 80) {
        const hits = HIT_TIMES || [];
        while (lastHitI < hits.length && hits[lastHitI] <= t) {
          const ht = hits[lastHitI++];
          if (ht >= 75 && ht < 80 && now - lastSpawn > 280) {
            spawnWarn(host, WARNINGS[idx++ % WARNINGS.length]);
            lastSpawn = now;
          }
        }
      }

      // flood from 1:20
      if (t >= 80 && !flood) {
        flood = true;
        // burst many
        for (let i = 0; i < 14; i++) {
          timers.push(setTimeout(() => {
            if (stopped) return;
            spawnWarn(host, WARNINGS[idx++ % WARNINGS.length]);
          }, i * 70));
        }
      }
      if (flood && host.childElementCount < 48 && now - lastSpawn > 90) {
        spawnWarn(host, WARNINGS[idx++ % WARNINGS.length]);
        lastSpawn = now;
        // sometimes 2–3 at once on strong hits
        if (Math.random() > 0.55) {
          spawnWarn(host, WARNINGS[idx++ % WARNINGS.length]);
        }
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }

  function spawnGlitch(host, xNorm, yNorm) {
    const el = document.createElement('div');
    el.className = 'boot__glitch';
    el.style.left = (xNorm * 100) + '%';
    el.style.top = (yNorm * 100) + '%';
    el.innerHTML = '<i></i><i></i><i></i><span></span>';
    host.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function startGlitches(host, media, t0perf) {
    host.innerHTML = '';
    const fired = new Set();
    let raf = 0;
    let stopped = false;
    function tick() {
      if (stopped) return;
      const tMs = media && Number.isFinite(media.currentTime)
        ? media.currentTime * 1000
        : performance.now() - t0perf;
      GLITCHES.forEach((g, i) => {
        if (!fired.has(i) && tMs >= g.t) {
          fired.add(i);
          spawnGlitch(host, g.x, g.y);
          // micro aftershocks
          setTimeout(() => spawnGlitch(host, g.x + (Math.random() - 0.5) * 0.06, g.y + (Math.random() - 0.5) * 0.06), 120);
        }
      });
      if (fired.size < GLITCHES.length) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }

  function materializeDigits(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let w = (canvas.width = innerWidth * dpr);
    let h = (canvas.height = innerHeight * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    const particles = [];
    const shell = document.querySelector('.site-shell');
    const els = shell
      ? [...shell.querySelectorAll('.mac-bar,.bay,.module-card,.soft-card,.deck,.bay__copy h1,.bay__copy h2,.scrub')]
      : [];
    const targets = [];
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 10) return;
      const n = Math.min(24, Math.max(6, Math.floor((r.width * r.height) / 14000)));
      for (let i = 0; i < n; i++) {
        targets.push({ x: (r.left + Math.random() * r.width) * dpr, y: (r.top + Math.random() * r.height) * dpr });
      }
    });
    while (targets.length < 60) targets.push({ x: Math.random() * w, y: Math.random() * h });
    targets.forEach((tg, i) => {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        tx: tg.x, ty: tg.y,
        ch: String((i * 3 + 7) % 10),
        delay: Math.random() * 0.3
      });
    });
    const t0 = performance.now();
    const DUR = 6500;
    let raf = 0;
    function frame(now) {
      const u = Math.min(1, (now - t0) / DUR);
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${12 * dpr}px monospace`;
      ctx.textAlign = 'center';
      particles.forEach((p) => {
        const local = Math.max(0, Math.min(1, (u - p.delay) / (1 - p.delay || 1)));
        const e = 1 - Math.pow(1 - local, 2.5);
        p.x += (p.tx - p.x) * (0.05 + e * 0.12);
        p.y += (p.ty - p.y) * (0.05 + e * 0.12);
        if (e < 0.7) {
          ctx.fillStyle = `rgba(255,70,80,${0.3 + e * 0.6})`;
          ctx.fillText(p.ch, p.x, p.y);
        } else {
          const s = (e - 0.7) / 0.3;
          const sz = (3 + s * 5) * dpr;
          ctx.fillStyle = `rgba(245,245,247,${0.2 + s * 0.55})`;
          ctx.strokeStyle = `rgba(255,255,255,${0.25 + s * 0.4})`;
          ctx.lineWidth = dpr;
          ctx.fillRect(p.x - sz, p.y - sz * 0.55, sz * 2, sz * 1.1);
          ctx.strokeRect(p.x - sz, p.y - sz * 0.55, sz * 2, sz * 1.1);
        }
      });
      if (u < 1) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }

  function applyInfectVisual(root, infect) {
    const t = smoothstep(infect);
    root.style.setProperty('--infect', String(t));
    root.style.setProperty('--infect-opacity', String(Math.min(0.85, t * 0.95)));
    root.style.setProperty('--infect-scale', String(0.15 + t * 2.6));
    // soft background shift
    const r = (5 + t * 10) | 0;
    const g = (5 - t * 3) | 0;
    const b = (6 - t * 2) | 0;
    if (t > 0.02) {
      root.style.background = `rgb(${r},${Math.max(0, g)},${Math.max(0, b)})`;
    }
  }

  const SKIP_AUDIO = 'assets/ui/skip-boot.mp3';

  /** Play skip SFX on body so it keeps going after boot DOM is removed */
  function playSkipBootSound() {
    try {
      if (window.__pathSkipAudio) {
        try { window.__pathSkipAudio.pause(); } catch { /* */ }
      }
      const a = new Audio(SKIP_AUDIO);
      a.volume = 0.95;
      a.setAttribute('playsinline', '');
      // keep global ref so GC doesn't kill mid-play after main page mounts
      window.__pathSkipAudio = a;
      document.body.appendChild(a);
      a.style.display = 'none';
      a.play().catch((e) => console.warn('skip audio', e));
      a.addEventListener('ended', () => {
        try { a.remove(); } catch { /* */ }
        if (window.__pathSkipAudio === a) window.__pathSkipAudio = null;
      });
    } catch (e) {
      console.warn(e);
    }
  }

  function markBootDone() {
    try {
      sessionStorage.setItem(BOOT_DONE_KEY, '1');
      localStorage.setItem(COOKIE_KEY, '1');
    } catch { /* */ }
  }

  function clearBootClasses() {
    document.documentElement.classList.remove(
      'is-booting',
      'boot-materializing',
      'boot-revealing',
      'boot-cosmos'
    );
  }

  function forceShowShell(shell) {
    if (!shell) return;
    shell.style.visibility = 'visible';
    shell.style.opacity = '1';
    shell.style.pointerEvents = 'auto';
    shell.style.filter = 'none';
    shell.style.transform = 'none';
    shell.classList.add('is-revealed');
  }

  function runCosmosStars(canvas, ms) {
    if (!canvas) return () => {};
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, raf = 0, stopped = false;
    const stars = [];
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      stars.length = 0;
      const n = Math.floor((innerWidth * innerHeight) / 9000);
      for (let i = 0; i < Math.max(40, Math.min(120, n)); i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: 0.3 + Math.random() * 2.2,
          a: 0.3 + Math.random() * 0.7
        });
      }
    }
    resize();
    function frame() {
      if (stopped) return;
      ctx.fillStyle = 'rgba(2,4,12,0.38)';
      ctx.fillRect(0, 0, w, h);
      for (const s of stars) {
        s.x += s.z * 2.1;
        s.y += s.z * 0.12;
        if (s.x > w + 20) { s.x = -10; s.y = Math.random() * h; }
        ctx.beginPath();
        ctx.fillStyle = 'rgba(200,230,255,' + s.a + ')';
        ctx.arc(s.x, s.y, s.z * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(160,200,255,' + (s.a * 0.35) + ')';
        ctx.lineWidth = s.z * 0.35;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.z * 10, s.y - s.z * 0.4);
        ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    const t = setTimeout(() => { stopped = true; cancelAnimationFrame(raf); }, ms + 400);
    return () => { stopped = true; clearTimeout(t); cancelAnimationFrame(raf); };
  }

  /**
   * Cosmic handoff: boot flies away → stars → site zooms in from deep space.
   * Session flag prevents mobile reloads from re-showing the gate.
   */
  function revealSite(root, video, cleanups) {
    if (!root || root.dataset.finished === '1') return;
    root.dataset.finished = '1';

    (cleanups || []).forEach((fn) => {
      try { fn && fn(); } catch (e) { /* */ }
    });
    try {
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    } catch (e) { /* */ }

    markBootDone();
    try {
      if (root.dataset.skipped === '1') sessionStorage.setItem('sb_path_welcome_played_v1', '1');
    } catch (e) { /* */ }

    const shell = document.querySelector('.site-shell');
    const cosmos = document.createElement('div');
    cosmos.className = 'boot-cosmos';
    cosmos.innerHTML = '<canvas class="boot-cosmos__stars" id="bootCosmosStars" aria-hidden="true"></canvas>';
    document.body.appendChild(cosmos);

    document.documentElement.classList.remove('is-booting', 'boot-materializing', 'boot-revealing');
    document.documentElement.classList.add('boot-cosmos');

    root.classList.add('is-flying-out');
    if (shell) {
      shell.classList.add('is-space-zoom');
      forceShowShell(shell);
      try {
        const track = document.getElementById('track');
        if (track) track.scrollLeft = 0;
      } catch (e) { /* */ }
    }

    const stopStars = runCosmosStars(document.getElementById('bootCosmosStars'), COSMIC_DUR);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      try { stopStars && stopStars(); } catch (e) { /* */ }
      try { root.remove(); } catch (e) { /* */ }
      try { cosmos.remove(); } catch (e) { /* */ }
      clearBootClasses();
      if (shell) {
        shell.classList.remove('is-space-zoom');
        forceShowShell(shell);
      }
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.dispatchEvent(new CustomEvent('path-boot-complete'));
      window.PathJarvis?.mount?.();
      window.PathSophia?.mount?.();
      try { window.PathAPI?.goToIndex?.(0, 'auto'); } catch (e) { /* */ }
    };

    // mobile safety: always land on site
    setTimeout(finish, COSMIC_DUR + 50);
    setTimeout(finish, COSMIC_DUR + 1200);
  }

  function runSequence(root, media) {
    let infect = 0; // 0 green → 1 full red
    const getPalette = () => paletteAt(infect);
    const video = media;
    const ctrl = {
      aborted: false,
      timers: [],
      stops: [],
      timeout(fn, ms) {
        const id = setTimeout(() => {
          if (!ctrl.aborted) fn();
        }, ms);
        ctrl.timers.push(id);
        return id;
      },
      abort() {
        ctrl.aborted = true;
        ctrl.timers.forEach(clearTimeout);
        ctrl.timers = [];
        cancelAnimationFrame(infectRaf);
        ctrl.stops.forEach((fn) => {
          try { fn && fn(); } catch { /* */ }
        });
        ctrl.stops = [];
      }
    };
    // expose for skip button
    root._bootCtrl = ctrl;

    const t0 = performance.now();
    root.classList.remove('is-gate');
    root.classList.add('is-waking', 'is-running');
    $('#bootPhase', root).textContent = 'AWAKENING';

    // After 10s eyelids, mark awake (hide lids layer softly)
    ctrl.timeout(() => {
      root.classList.remove('is-waking');
      root.classList.add('is-awake');
      if (infect < 0.05) $('#bootPhase', root).textContent = 'PATH OS';
    }, WAKE_MS);

    const stopRain = startRain($('#bootRain', root), getPalette);
    const stopEq = startEq($('#bootEq', root), video, getPalette);
    const stopHead = startHeadGhost(video, $('#bootHead', root), $('#bootHeadTrail', root));
    let stopTerms = startTerminals($('#bootTerms', root), getPalette);
    let stopWarns = null;
    let stopGlitch = null;
    let stopHead2 = null;
    ctrl.stops.push(
      () => stopRain && stopRain(),
      () => stopEq && stopEq(),
      () => stopHead && stopHead(),
      () => stopHead2 && stopHead2(),
      () => stopWarns && stopWarns(),
      () => stopGlitch && stopGlitch(),
      () => stopTerms && stopTerms()
    );

    // 0:50 — second character + cyan→red digit infection trail
    ctrl.timeout(() => {
      const v2 = $('#bootVideo2', root);
      const h2 = $('#bootHead2', root);
      const tr2 = $('#bootHead2Trail', root);
      if (!v2 || !h2) return;
      stopHead2 = startSecondaryHead(v2, h2, tr2);
      phaseEl.textContent = 'ENTITY · B';
    }, HEAD2_AT_MS);

    LOG_LINES.forEach((item) => {
      ctrl.timeout(() => {
        const list = $('#bootLines', root);
        if (!list) return;
        const div = document.createElement('div');
        div.className = 'line ' + (item.cls || 'line--ok');
        div.textContent = item.text;
        list.appendChild(div);
        while (list.children.length > 12) list.removeChild(list.firstChild);
      }, item.t);
    });

    const bar = $('#bootBar', root);
    const pctEl = $('#bootPct', root);
    const phaseEl = $('#bootPhase', root);

    // Continuous infection drive + progress bar (100% at 1:30)
    let infectRaf = 0;
    function infectTick(now) {
      if (ctrl.aborted) return;
      const elapsed = now - t0;
      const p = Math.min(1, elapsed / BOOT_END_MS);
      bar.style.width = Math.round(p * 100) + '%';
      pctEl.textContent = Math.round(p * 100) + '%';

      if (elapsed >= RED_AT_MS) {
        const raw = (elapsed - RED_AT_MS) / RED_BLEND_MS;
        infect = Math.max(0, Math.min(1, raw));
        if (!root.classList.contains('is-infecting')) {
          root.classList.add('is-infecting');
          phaseEl.textContent = 'INFECTION';
        }
        applyInfectVisual(root, infect);
        if (infect >= 0.98 && !root.classList.contains('is-red')) {
          root.classList.add('is-red');
          phaseEl.textContent = 'PROTOCOL RED';
          $('#bootTerms', root)?.classList.add('is-red');
        }
      }

      if (elapsed < BOOT_END_MS + 200) infectRaf = requestAnimationFrame(infectTick);
    }
    infectRaf = requestAnimationFrame(infectTick);

    // 1:15 — glitches + warnings (one-by-one → flood at 1:20), hit-synced
    ctrl.timeout(() => {
      if (stopTerms) {
        stopTerms();
        stopTerms = null;
      }
      stopGlitch = startGlitches($('#bootGlitches', root), video, t0);
      stopWarns = startWarningsProgressive($('#bootWarnings', root), video, t0);
      phaseEl.textContent = 'WARNING CASCADE';
    }, WARN_START_MS);

    // Cosmic exit → site zoom (lands by ~1:27–1:30)
    ctrl.timeout(() => {
      if (ctrl.aborted) return;
      cancelAnimationFrame(infectRaf);
      infect = 1;
      applyInfectVisual(root, 1);
      phaseEl.textContent = 'EXIT · COSMOS';
      root.classList.add('is-materializing', 'is-red');
      materializeDigits($('#bootDigits', root));
      // brief digit solidify then fly to space
      ctrl.timeout(() => {
        if (ctrl.aborted) return;
        revealSite(root, video, ctrl.stops);
        ctrl.stops = [];
      }, 900);
    }, MATERIALIZE_AT_MS);

    if (video) video.loop = false;
    return ctrl;
  }

  function enterSiteDirect() {
    clearBootClasses();
    document.querySelectorAll('.boot, .boot-cosmos').forEach((el) => {
      try { el.remove(); } catch (e) { /* */ }
    });
    const shell = document.querySelector('.site-shell');
    if (shell) forceShowShell(shell);
    // if shell was never created, content is already in body
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    window.dispatchEvent(new CustomEvent('path-boot-complete'));
    window.PathJarvis?.mount?.();
    window.PathSophia?.mount?.();
    try { window.PathAPI?.goToIndex?.(0, 'auto'); } catch (e) { /* */ }
  }

  function boot() {
    try {
      if (new URLSearchParams(location.search).get('noboot') === '1') {
        enterSiteDirect();
        return;
      }
      // Mobile often reloads after long media boot — stay on main, not gate
      try {
        if (sessionStorage.getItem(BOOT_DONE_KEY) === '1') {
          enterSiteDirect();
          return;
        }
      } catch (e) { /* */ }

      document.documentElement.classList.add('is-booting');
      loadSpeakerCues(); // warm load for voice-colored EQ
      const root = createBootDOM();
      wrapSiteShell();
      const gate = $('#bootGate', root);
      const btns = [...root.querySelectorAll('[data-boot-go]')];
      const video = $('#bootVideo', root);
      const skipBtn = $('#bootSkip', root);
      if (!btns.length || !gate) {
        document.documentElement.classList.remove('is-booting');
        return;
      }

      let starting = false;
      let seqCtrl = null;

      const skipBoot = () => {
        if (root.dataset.finished === '1') return;
        root.dataset.skipped = '1';
        // sound first — continues after main is visible
        playSkipBootSound();
        try { localStorage.setItem(COOKIE_KEY, '1'); } catch { /* */ }
        if (seqCtrl) seqCtrl.abort();
        else {
          // still on gate — hide gate chrome
          gate.classList.add('is-hidden');
        }
        revealSite(root, video, seqCtrl ? seqCtrl.stops : []);
      };

      skipBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        skipBoot();
      });

      const startBoot = async (clicked) => {
        if (starting || root.dataset.finished === '1') return;
        starting = true;
        btns.forEach((b) => {
          b.disabled = true;
          if (b === clicked) b.textContent = 'Поехали…';
          else b.textContent = '…';
        });
        try { localStorage.setItem(COOKIE_KEY, '1'); } catch { /* */ }
        try {
          if (video) {
            video.muted = false;
            video.volume = 0.92;
            video.currentTime = 0;
            await video.play();
          }
        } catch (e) {
          console.warn(e);
        }
        gate.classList.add('is-hidden');
        seqCtrl = runSequence(root, video);
      };

      btns.forEach((b) => b.addEventListener('click', () => startBoot(b)));
      setTimeout(() => {
        const first = btns[0];
        try { first.focus({ preventScroll: true }); } catch { first.focus(); }
      }, 100);
    } catch (e) {
      console.error(e);
      document.documentElement.classList.remove('is-booting');
    }
  }

  // iOS/Safari bfcache / reload after media: never leave user on dead boot overlay
  window.addEventListener('pageshow', (ev) => {
    try {
      if (sessionStorage.getItem(BOOT_DONE_KEY) === '1') {
        document.querySelectorAll('.boot').forEach((el) => el.remove());
        clearBootClasses();
        const shell = document.querySelector('.site-shell');
        if (shell) forceShowShell(shell);
      }
    } catch (e) { /* */ }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
