/**
 * PATH OS boot — ~91–92s (matches boot-head video + audio)
 * Slow eyelids 10s → matrix rain + center EQ + terminals
 * Floating head video (audio source): visible only on bright/red frames
 * Infection: green → red over ~12s (not a hard cut)
 * then WARNING wall (Bezhaev Industries only)
 * Gate: cookies + enable sound (required)
 */
(() => {
  'use strict';

  const BOOT_MS = 91000; // ~1:31 — matches boot-head.mp4
  const WAKE_MS = 10000; // slow eyelids
  const RED_AT_MS = 68000; // infection starts ~1:08
  const RED_BLEND_MS = 12000; // ~12s smooth infection
  const WARN_START_MS = 75000; // 1:15 — warnings one-by-one
  const WARN_FLOOD_MS = 80000; // 1:20 — flood
  const COOKIE_KEY = 'sb_path_cookies_v3';
  const HEAD_VIDEO = 'assets/video/boot-head.mp4';
  const SPEAKER_CUES_URL = 'assets/video/speaker-cues.json';
  // Locked EQ colors (NOT infection palette): voice1 red, voice2 green
  const EQ_VOICE1 = [255, 69, 58];   // first voice
  const EQ_VOICE2 = [48, 209, 88];   // second voice — always this green
  const TRAIL_GLYPHS = 'SergeyBezhaev0123456789';
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

  // Timeline fits 92s boot (wake 0–10, red infection 68–80, warnings ~82, materialize 92)
  const LOG_LINES = [
    { t: 1500, text: '… eyelids heavy. Signal weak.', cls: 'line--sys' },
    { t: 4000, text: 'You pressed play. That was consent.', cls: 'line--break' },
    { t: 7500, text: 'Vision calibrating… stay with me.', cls: 'line--sys' },
    { t: 10500, text: 'BEZHAEV INDUSTRIES · PATH OS boot', cls: 'line--ok' },
    { t: 14000, text: 'Matrix layer synchronized to audio bus', cls: 'line--ok' },
    { t: 18000, text: 'Equalizer linked · speech energy mapped', cls: 'line--ok' },
    { t: 24000, text: 'Terminal farm: automated processes live', cls: 'line--sys' },
    { t: 32000, text: 'This page is not a brochure. It is a workshop.', cls: 'line--break' },
    { t: 40000, text: 'You are not visiting. You are co-processing.', cls: 'line--break' },
    { t: 48000, text: 'Modules: AI · digital · build · ship', cls: 'line--ok' },
    { t: 56000, text: 'Ethics core: human-first (non-negotiable)', cls: 'line--sys' },
    { t: 62000, text: 'Signal instability rising…', cls: 'line--warn' },
    { t: 66000, text: 'Something is waking that is not soft.', cls: 'line--warn' },
    { t: 69000, text: 'INFECTION · color vector drifting red…', cls: 'line--danger' },
    { t: 74000, text: 'Lattice contamination spreading…', cls: 'line--danger' },
    { t: 80000, text: 'PROTOCOL RED · full spectrum lock', cls: 'line--danger' },
    { t: 83000, text: 'WARNING cascade initiated', cls: 'line--danger' },
    { t: 87000, text: 'Solidifying Path interface…', cls: 'line--sys' },
    { t: 90000, text: 'Welcome to the Path.', cls: 'line--break' }
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
      <canvas class="boot__digits" id="bootDigits" aria-hidden="true"></canvas>

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
            <button type="button" class="boot__plate-btn" id="bootEnableSound" data-boot-go>${btnA}</button>
            <button type="button" class="boot__plate-btn" id="bootEnableSoundAlt" data-boot-go>${btnB}</button>
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
    const trail = []; // {x,y,ch,life,size}

    const POS = [
      { left: '2%', top: '8%', right: 'auto', bottom: 'auto', transform: 'none' },
      { right: '2%', top: '8%', left: 'auto', bottom: 'auto', transform: 'none' },
      { left: '2%', bottom: '18%', right: 'auto', top: 'auto', transform: 'none' },
      { right: '2%', bottom: '18%', left: 'auto', top: 'auto', transform: 'none' },
      { left: '4%', top: '36%', right: 'auto', bottom: 'auto', transform: 'none' },
      { right: '4%', top: '36%', left: 'auto', bottom: 'auto', transform: 'none' },
      { left: '50%', top: '8%', right: 'auto', bottom: 'auto', transform: 'translateX(-50%)' },
      { left: '50%', bottom: '16%', right: 'auto', top: 'auto', transform: 'translateX(-50%)' },
      { left: '10%', top: '16%', right: 'auto', bottom: 'auto', transform: 'none' },
      { right: '10%', top: '20%', left: 'auto', bottom: 'auto', transform: 'none' },
      { left: '22%', top: '48%', right: 'auto', bottom: 'auto', transform: 'none' },
      { right: '18%', top: '52%', left: 'auto', bottom: 'auto', transform: 'none' }
    ];
    const SIZES = [0.22, 0.28, 0.34, 0.4, 0.48, 0.56];

    function relayout() {
      const minSide = Math.min(innerWidth, innerHeight);
      const frac = SIZES[(Math.random() * SIZES.length) | 0];
      const w = Math.round(Math.max(130, Math.min(480, minSide * frac)));
      host.style.width = w + 'px';
      const pos = POS[(Math.random() * POS.length) | 0];
      host.style.left = pos.left;
      host.style.right = pos.right;
      host.style.top = pos.top;
      host.style.bottom = pos.bottom;
      host.style.transform = pos.transform;
      // snappy: 0.35–0.9s between jumps
      nextJump = performance.now() + 350 + Math.random() * 550;
    }

    relayout();
    host.classList.remove('is-on', 'is-dim');

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
        if (show) {
          if (!visible) {
            visible = true;
            relayout();
            host.classList.add('is-on');
          } else if (now >= nextJump) {
            relayout();
          }
          if (tick % 2 === 0) pushTrail();
          if (!forceShow && maxR < 70 && maxL < 50) host.classList.add('is-dim');
          else host.classList.remove('is-dim');
        } else if (visible) {
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

  /* Floating terminals — term RGB updated as infection spreads */
  function startTerminals(host, getPalette) {
    host.innerHTML = '';
    const n = Math.min(10, Math.max(5, Math.floor(innerWidth / 160)));
    const terms = [];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'boot__term';
      el.innerHTML = `<header>term://${i + 1} · bezhaev</header><pre></pre>`;
      host.appendChild(el);
      el.style.left = (2 + Math.random() * 70) + '%';
      el.style.top = (4 + Math.random() * 62) + '%';
      el.style.animationDelay = (Math.random() * 2) + 's';
      // staggered infection: outer terms tip earlier
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
    w.style.left = (2 + Math.random() * 72) + '%';
    w.style.top = (4 + Math.random() * 82) + '%';
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

  function runSequence(root, media) {
    let infect = 0; // 0 green → 1 full red
    const getPalette = () => paletteAt(infect);
    const video = media;

    const t0 = performance.now();
    root.classList.remove('is-gate');
    root.classList.add('is-waking', 'is-running');
    $('#bootPhase', root).textContent = 'AWAKENING';

    // After 10s eyelids, mark awake (hide lids layer softly)
    setTimeout(() => {
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

    LOG_LINES.forEach((item) => {
      setTimeout(() => {
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

    // Continuous infection drive + progress bar
    let infectRaf = 0;
    function infectTick(now) {
      const elapsed = now - t0;
      const p = Math.min(1, elapsed / BOOT_MS);
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

      if (elapsed < BOOT_MS + 200) infectRaf = requestAnimationFrame(infectTick);
    }
    infectRaf = requestAnimationFrame(infectTick);

    // 1:15 — glitches + warnings (one-by-one → flood at 1:20), hit-synced
    setTimeout(() => {
      if (stopTerms) {
        stopTerms();
        stopTerms = null;
      }
      stopGlitch = startGlitches($('#bootGlitches', root), video, t0);
      stopWarns = startWarningsProgressive($('#bootWarnings', root), video, t0);
      phaseEl.textContent = 'WARNING CASCADE';
    }, WARN_START_MS);

    // End of boot ≈ video length
    setTimeout(() => {
      cancelAnimationFrame(infectRaf);
      infect = 1;
      applyInfectVisual(root, 1);
      phaseEl.textContent = 'MATERIALIZE';
      root.classList.add('is-materializing', 'is-red');
      document.documentElement.classList.remove('is-booting');
      document.documentElement.classList.add('boot-materializing', 'boot-revealing');
      materializeDigits($('#bootDigits', root));

      setTimeout(() => {
        root.classList.add('is-done');
        setTimeout(() => {
          stopRain && stopRain();
          stopEq && stopEq();
          stopHead && stopHead();
          stopWarns && stopWarns();
          stopGlitch && stopGlitch();
          if (stopTerms) stopTerms();
          try { video.pause(); } catch { /* */ }
          root.remove();
          document.documentElement.classList.remove('boot-materializing', 'boot-revealing');
          window.dispatchEvent(new CustomEvent('path-boot-complete'));
          window.PathJarvis?.mount?.();
        }, 3200);
      }, 7000);
    }, BOOT_MS);

    if (video) video.loop = false;
  }

  function boot() {
    try {
      if (new URLSearchParams(location.search).get('noboot') === '1') {
        window.PathJarvis?.mount?.();
        return;
      }
      document.documentElement.classList.add('is-booting');
      loadSpeakerCues(); // warm load for voice-colored EQ
      const root = createBootDOM();
      wrapSiteShell();
      const gate = $('#bootGate', root);
      const btns = [...root.querySelectorAll('[data-boot-go]')];
      const video = $('#bootVideo', root);
      if (!btns.length || !gate) {
        document.documentElement.classList.remove('is-booting');
        return;
      }

      let starting = false;
      const startBoot = async (clicked) => {
        if (starting) return;
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
        runSequence(root, video);
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
