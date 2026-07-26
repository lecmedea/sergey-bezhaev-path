/**
 * PATH OS boot — exactly 92s (1:32)
 * Slow eyelids 10s → matrix rain + center EQ + terminals
 * Infection: green → red over ~12s (not a hard cut)
 * then WARNING wall (Bezhaev Industries only)
 * Gate: cookies + enable sound (required)
 */
(() => {
  'use strict';

  const BOOT_MS = 92000; // 1:32 exact
  const WAKE_MS = 10000; // slow eyelids
  const RED_AT_MS = 68000; // infection starts ~1:08
  const RED_BLEND_MS = 12000; // ~12s smooth infection
  const WARN_AT_MS = 82000; // warnings after infection mostly settled
  const COOKIE_KEY = 'sb_path_cookies_v3';

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

  function createBootDOM() {
    const root = document.createElement('div');
    root.className = 'boot is-gate';
    root.id = 'bootSequence';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.innerHTML = `
      <canvas class="boot__rain" id="bootRain" aria-hidden="true"></canvas>
      <div class="boot__infect" id="bootInfect" aria-hidden="true"></div>
      <canvas class="boot__eq" id="bootEq" aria-hidden="true"></canvas>
      <div class="boot__terms" id="bootTerms" aria-hidden="true"></div>
      <div class="boot__warnings" id="bootWarnings" aria-hidden="true"></div>
      <div class="boot__scan" aria-hidden="true"></div>
      <div class="boot__vignette" aria-hidden="true"></div>
      <div class="boot__eyelids" aria-hidden="true">
        <div class="boot__lid boot__lid--top"></div>
        <div class="boot__lid boot__lid--bot"></div>
      </div>
      <canvas class="boot__digits" id="bootDigits" aria-hidden="true"></canvas>

      <div class="boot__gate" id="bootGate">
        <div class="boot__gate-tag">BEZHAEV INDUSTRIES · Cookies · Audio</div>
        <h1>Проснись. Система ждёт.</h1>
        <p>Сайт использует cookies для настроек интерфейса. Продолжая, вы соглашаетесь на их использование.</p>
        <p>Цифровой запуск идёт <strong>под звук</strong>. Без кнопки «Включить звук» загрузка <strong>не начнётся</strong> — так ломается четвёртая стена.</p>
        <div class="boot__gate-actions">
          <button type="button" class="boot__btn" id="bootEnableSound">Включить звук · войти в систему</button>
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
      <audio id="bootAudio" preload="auto" playsinline src="assets/audio/boot.mp3"></audio>
    `;
    document.body.prepend(root);
    return root;
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

  /* Center equalizer from audio */
  function startEq(canvas, audio, getPalette) {
    const ctx = canvas.getContext('2d');
    let analyser = null;
    let data = null;
    let raf = 0;
    let fakeT = 0;

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && audio) {
        const ac = new AC();
        const src = ac.createMediaElementSource(audio);
        analyser = ac.createAnalyser();
        analyser.fftSize = 128;
        data = new Uint8Array(analyser.frequencyBinCount);
        src.connect(analyser);
        analyser.connect(ac.destination);
        ac.resume?.();
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

    function frame() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const pal = getPalette();
      const bars = 48;
      const cx = w / 2;
      const cy = h * 0.48;
      const maxH = h * 0.22;
      const gap = 4 * dpr;
      const barW = Math.max(3 * dpr, (w * 0.42) / bars - gap);

      let levels;
      if (analyser && data) {
        analyser.getByteFrequencyData(data);
        levels = Array.from({ length: bars }, (_, i) => {
          const idx = Math.floor((i / bars) * (data.length * 0.7));
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
        g.addColorStop(0, pal.eq);
        g.addColorStop(1, 'rgba(255,255,255,0.15)');
        ctx.fillStyle = g;
        ctx.fillRect(x, cy - bh, barW, bh * 2);
      }

      ctx.beginPath();
      ctx.arc(cx, cy, maxH * 1.15, 0, Math.PI * 2);
      ctx.strokeStyle = pal.eq + '55';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();

      ctx.fillStyle = pal.eq;
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

  function startWarnings(host) {
    host.innerHTML = '';
    host.classList.add('is-on');
    const count = 18;
    for (let i = 0; i < count; i++) {
      const w = document.createElement('div');
      w.className = 'boot__warn';
      w.textContent = WARNINGS[i % WARNINGS.length];
      w.style.left = (3 + Math.random() * 70) + '%';
      w.style.top = (5 + Math.random() * 80) + '%';
      w.style.animationDelay = (Math.random() * 0.8) + 's';
      w.style.fontSize = (12 + Math.random() * 10) + 'px';
      host.appendChild(w);
    }
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

  function runSequence(root, audio) {
    let infect = 0; // 0 green → 1 full red
    const getPalette = () => paletteAt(infect);

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
    const stopEq = startEq($('#bootEq', root), audio, getPalette);
    let stopTerms = startTerminals($('#bootTerms', root), getPalette);

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

    // Warnings after infection mostly done
    setTimeout(() => {
      if (stopTerms) {
        stopTerms();
        stopTerms = null;
      }
      startWarnings($('#bootWarnings', root));
      phaseEl.textContent = 'WARNING CASCADE';
    }, WARN_AT_MS);

    // End of boot at exactly 1:32
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
          if (stopTerms) stopTerms();
          root.remove();
          document.documentElement.classList.remove('boot-materializing', 'boot-revealing');
          window.dispatchEvent(new CustomEvent('path-boot-complete'));
          window.PathJarvis?.mount?.();
        }, 3200);
      }, 7000);
    }, BOOT_MS);

    audio.loop = false;
  }

  function boot() {
    try {
      if (new URLSearchParams(location.search).get('noboot') === '1') {
        window.PathJarvis?.mount?.();
        return;
      }
      document.documentElement.classList.add('is-booting');
      const root = createBootDOM();
      wrapSiteShell();
      const gate = $('#bootGate', root);
      const btn = $('#bootEnableSound', root);
      const audio = $('#bootAudio', root);
      if (!btn || !gate) {
        document.documentElement.classList.remove('is-booting');
        return;
      }
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Запуск…';
        try { localStorage.setItem(COOKIE_KEY, '1'); } catch { /* */ }
        try {
          audio.volume = 0.92;
          audio.currentTime = 0;
          await audio.play();
        } catch (e) {
          console.warn(e);
        }
        gate.classList.add('is-hidden');
        runSequence(root, audio);
      });
      setTimeout(() => { try { btn.focus({ preventScroll: true }); } catch { btn.focus(); } }, 100);
    } catch (e) {
      console.error(e);
      document.documentElement.classList.remove('is-booting');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
