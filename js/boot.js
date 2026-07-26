/**
 * PATH OS cinematic boot
 * - Wake blink (cinema eyelids)
 * - Digital face that “speaks” (no mouth required) + audio analysis
 * - Audio plays to the end (no loop kill)
 * - At t=30s: digits assemble into UI and solidify (Ive materialize)
 * - 4th wall dialogue lines
 */
(() => {
  'use strict';

  const MATERIALIZE_AT_MS = 30000;
  const STORAGE_COOKIE = 'sb_path_cookies_v2';

  const LINES = [
    { t: 2800, text: 'You opened this page. I noticed.', cls: 'line--break' },
    { t: 4200, text: 'PATH OS · neural interface online', cls: 'line--sys' },
    { t: 5600, text: 'Hello. I am not a template. I am a workshop.', cls: 'line--break' },
    { t: 7200, text: 'Synthesizing face mesh · operator: Sergey Bezhaev', cls: 'line--ok' },
    { t: 8800, text: 'This site is a 4th wall. We are already through it.', cls: 'line--break' },
    { t: 10400, text: 'Loading skill lattice: AI · digital · product', cls: 'line--ok' },
    { t: 12000, text: 'JARVIS protocol: assist, never replace the human', cls: 'line--sys' },
    { t: 13600, text: 'You are not “visiting”. You are in the machine with me.', cls: 'line--break' },
    { t: 15200, text: 'Modules: Azimut · Grillz · Elena · Path', cls: 'line--ok' },
    { t: 16800, text: 'Ultron reminder: power without ethics is noise', cls: 'line--warn' },
    { t: 18400, text: 'Forging UI atoms from pure digits…', cls: 'line--sys' },
    { t: 20000, text: 'If you feel watched — good. That means you are awake.', cls: 'line--break' },
    { t: 21600, text: 'Calibrating orbit deck · horizontal time', cls: 'line--ok' },
    { t: 23200, text: 'Reality mesh integrity: rising', cls: 'line--ok' },
    { t: 24800, text: 'Solidifying interface · Jonathan Ive density…', cls: 'line--sys' },
    { t: 26800, text: 'Welcome to the Path. Touch nothing random. Or do.', cls: 'line--break' },
    { t: 28800, text: 'Materialize.', cls: 'line--ok' }
  ];

  const $ = (s, r = document) => r.querySelector(s);

  function createBootDOM() {
    const root = document.createElement('div');
    root.className = 'boot is-asleep';
    root.id = 'bootSequence';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Цифровой запуск Path OS');
    root.innerHTML = `
      <div class="boot__eyelids" aria-hidden="true">
        <div class="boot__lid boot__lid--top"></div>
        <div class="boot__lid boot__lid--bot"></div>
      </div>
      <div class="boot__hud" aria-hidden="true">
        <div class="boot__arc boot__arc--c"></div>
        <div class="boot__arc boot__arc--a"></div>
        <div class="boot__arc boot__arc--b"></div>
      </div>
      <div class="boot__face-wrap">
        <canvas class="boot__face" id="bootFace" width="640" height="640" aria-label="Цифровое лицо системы"></canvas>
      </div>
      <div class="boot__scan" aria-hidden="true"></div>
      <div class="boot__vignette" aria-hidden="true"></div>
      <div class="boot__subtitle" id="bootSub">Stark-class digital entity · PATH OS</div>
      <canvas class="boot__digits" id="bootDigits" aria-hidden="true"></canvas>

      <div class="boot__gate" id="bootGate">
        <div class="boot__gate-tag">Cookies · Audio · 4th wall</div>
        <h1>Проснись. Система ждёт тебя.</h1>
        <p>
          Сайт использует cookies для настроек интерфейса. Продолжая, вы соглашаетесь.
        </p>
        <p>
          Дальше — цифровой запуск с голосом дорожки. <strong>Без «Включить звук» загрузка не начнётся.</strong>
          Это часть опыта: звук ломает четвёртую стену.
        </p>
        <div class="boot__gate-actions">
          <button type="button" class="boot__btn" id="bootEnableSound">
            Включить звук · войти в систему
          </button>
        </div>
      </div>

      <div class="boot__console" id="bootConsole">
        <div class="boot__status-list" id="bootLines" aria-live="polite"></div>
        <div class="boot__bar"><div class="boot__bar-fill" id="bootBar"></div></div>
        <div class="boot__meta">
          <span id="bootPhase">GATE LOCKED</span>
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

  /* ── Digital talking face (no mouth required) ── */
  function createFace(canvas, audio) {
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let t0 = performance.now();
    let analyser = null;
    let data = null;
    let audioLevel = 0;

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && audio) {
        const ac = new AC();
        const src = ac.createMediaElementSource(audio);
        analyser = ac.createAnalyser();
        analyser.fftSize = 256;
        data = new Uint8Array(analyser.frequencyBinCount);
        src.connect(analyser);
        analyser.connect(ac.destination);
        // resume after gesture
        ac.resume?.();
      }
    } catch (e) {
      console.warn('audio analyser', e);
    }

    function level() {
      if (!analyser || !data) return 0.15 + 0.1 * Math.sin(performance.now() / 180);
      analyser.getByteFrequencyData(data);
      let s = 0;
      for (let i = 2; i < 40; i += 1) s += data[i];
      return Math.min(1, s / (38 * 180));
    }

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2 - 10;
      const now = performance.now();
      const t = (now - t0) / 1000;
      audioLevel += (level() - audioLevel) * 0.18;

      ctx.clearRect(0, 0, w, h);

      // ambient digits field around face (not rain columns)
      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(80,200,255,0.12)';
      for (let i = 0; i < 48; i += 1) {
        const a = (i / 48) * Math.PI * 2 + t * 0.15;
        const r = 210 + Math.sin(t * 1.2 + i) * 28 + audioLevel * 40;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.92;
        ctx.fillText(String((i * 7 + (t * 10) | 0) % 10), x, y);
      }

      // face silhouette — geometric, Ive-clean
      const talk = audioLevel;
      const headBob = Math.sin(t * 2.1) * 3 + talk * 6;
      const headTilt = Math.sin(t * 0.7) * 0.04 + talk * 0.05;
      const brow = talk * 8;
      const cheek = talk * 10;

      ctx.save();
      ctx.translate(cx, cy + headBob);
      ctx.rotate(headTilt);

      // head outline
      ctx.beginPath();
      ctx.ellipse(0, 8, 118, 148, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(120, 220, 255, ${0.35 + talk * 0.35})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // face mesh grid (digital skin)
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.12)';
      ctx.lineWidth = 0.8;
      for (let y = -120; y <= 120; y += 16) {
        ctx.beginPath();
        for (let x = -100; x <= 100; x += 8) {
          const yy = y + Math.sin(x * 0.04 + t + talk * 2) * (2 + talk * 3);
          const xx = x * (1 - Math.abs(y) / 400);
          if (x === -100) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }

      // eyes
      const eyeOpen = 0.55 + talk * 0.35 + Math.sin(t * 3) * 0.05;
      // occasional blink
      const blink = (Math.sin(t * 0.35) > 0.92) ? 0.08 : 1;
      const eh = 14 * eyeOpen * blink;

      function eye(ex) {
        ctx.beginPath();
        ctx.ellipse(ex, -28, 22, eh, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 255, 255, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(160, 240, 255, 0.7)';
        ctx.stroke();
        // iris reacts to “speech”
        ctx.beginPath();
        ctx.arc(ex + talk * 3, -28, 6 + talk * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 220, 255, ${0.55 + talk * 0.4})`;
        ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
        ctx.shadowBlur = 12 + talk * 20;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      eye(-40);
      eye(40);

      // brows (speech emphasis)
      ctx.beginPath();
      ctx.moveTo(-62, -52 - brow);
      ctx.quadraticCurveTo(-40, -58 - brow * 0.5, -18, -50 - brow * 0.3);
      ctx.moveTo(62, -52 - brow);
      ctx.quadraticCurveTo(40, -58 - brow * 0.5, 18, -50 - brow * 0.3);
      ctx.strokeStyle = 'rgba(200, 240, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // nose bridge
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(-6, 28 + talk * 2);
      ctx.lineTo(6, 28 + talk * 2);
      ctx.strokeStyle = 'rgba(140, 200, 230, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // cheek planes (talk micro-motion)
      ctx.beginPath();
      ctx.ellipse(-72, 20 + cheek * 0.3, 18, 28 + talk * 4, -0.2, 0, Math.PI * 2);
      ctx.ellipse(72, 20 + cheek * 0.3, 18, 28 + talk * 4, 0.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100, 180, 220, 0.2)';
      ctx.stroke();

      // jaw plane motion (no open mouth — sealed geometry that shifts)
      const jawY = 78 + talk * 14;
      ctx.beginPath();
      ctx.moveTo(-48, 58);
      ctx.quadraticCurveTo(0, jawY + 8, 48, 58);
      ctx.strokeStyle = `rgba(160, 230, 255, ${0.35 + talk * 0.4})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // speech waveform under chin
      ctx.beginPath();
      for (let i = 0; i < 48; i += 1) {
        const x = -70 + i * 3;
        const y = jawY + 22 + Math.sin(i * 0.45 + t * 8) * (4 + talk * 18);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(0, 255, 200, ${0.25 + talk * 0.55})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.restore();

      // label
      ctx.fillStyle = 'rgba(140, 210, 255, 0.55)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ENTITY · PATH / STARK-CLASS', cx, h - 36);

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }

  /* ── Digits assemble into page elements ── */
  function materializeDigits(canvas, onProgress) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const particles = [];
    const targets = [];

    function resize() {
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
    resize();

    // sample target points from visible UI boxes
    const shell = document.querySelector('.site-shell');
    const els = shell
      ? [...shell.querySelectorAll('.mac-bar, .bay, .module-card, .soft-card, .deck, .bay__copy h1, .bay__copy h2, .hero-visual, .scrub')]
      : [];
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      const n = Math.min(28, Math.max(8, Math.floor((r.width * r.height) / 12000)));
      for (let i = 0; i < n; i += 1) {
        targets.push({
          x: (r.left + Math.random() * r.width) * dpr,
          y: (r.top + Math.random() * r.height) * dpr
        });
      }
    });
    // fallback grid if few elements
    if (targets.length < 40) {
      for (let i = 0; i < 80; i += 1) {
        targets.push({ x: Math.random() * w, y: Math.random() * h });
      }
    }

    targets.forEach((tg, i) => {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        tx: tg.x,
        ty: tg.y,
        ch: String((i * 3 + 7) % 10),
        delay: Math.random() * 0.35,
        solid: 0
      });
    });

    const t0 = performance.now();
    const DURATION = 5500;
    let raf = 0;

    function frame(now) {
      const u = Math.min(1, (now - t0) / DURATION);
      const ease = 1 - Math.pow(1 - u, 3);
      onProgress?.(u);

      ctx.clearRect(0, 0, w, h);
      ctx.font = `${13 * dpr}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      particles.forEach((p) => {
        const local = Math.max(0, Math.min(1, (u - p.delay) / (1 - p.delay)));
        const e = 1 - Math.pow(1 - local, 2.4);
        p.x += (p.tx - p.x) * (0.04 + e * 0.12);
        p.y += (p.ty - p.y) * (0.04 + e * 0.12);
        p.solid = e;

        // digit → solid “matter”
        if (e < 0.72) {
          ctx.fillStyle = `rgba(120, 220, 255, ${0.25 + e * 0.6})`;
          ctx.fillText(p.ch, p.x, p.y);
        } else {
          const s = (e - 0.72) / 0.28;
          // Ive solid: soft fill block with hairline
          const sz = 3 + s * 5;
          ctx.fillStyle = `rgba(245, 245, 247, ${0.15 + s * 0.55})`;
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + s * 0.35})`;
          ctx.lineWidth = 1 * dpr;
          ctx.beginPath();
          const rr = 1.5 * dpr;
          // rounded rect
          const x = p.x - sz;
          const y = p.y - sz * 0.6;
          const ww = sz * 2;
          const hh = sz * 1.2;
          ctx.moveTo(x + rr, y);
          ctx.arcTo(x + ww, y, x + ww, y + hh, rr);
          ctx.arcTo(x + ww, y + hh, x, y + hh, rr);
          ctx.arcTo(x, y + hh, x, y, rr);
          ctx.arcTo(x, y, x + ww, y, rr);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      });

      // global Ive sheen
      ctx.fillStyle = `rgba(255,255,255,${0.02 * ease})`;
      ctx.fillRect(0, 0, w, h);

      if (u < 1) raf = requestAnimationFrame(frame);
      else {
        ctx.clearRect(0, 0, w, h);
      }
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }

  function runSequence(root, audio) {
    const linesEl = $('#bootLines', root);
    const bar = $('#bootBar', root);
    const pctEl = $('#bootPct', root);
    const phaseEl = $('#bootPhase', root);
    const sub = $('#bootSub', root);
    const t0 = performance.now();

    root.classList.remove('is-asleep');
    root.classList.add('is-waking', 'is-running');
    phaseEl.textContent = 'AWAKENING';
    setTimeout(() => sub.classList.add('is-on'), 2200);

    const stopFace = createFace($('#bootFace', root), audio);

    LINES.forEach((item) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = `line ${item.cls || 'line--ok'}`;
        div.textContent = item.text;
        linesEl.appendChild(div);
        while (linesEl.children.length > 11) linesEl.removeChild(linesEl.firstChild);
      }, item.t);
    });

    const progressTimer = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / MATERIALIZE_AT_MS);
      bar.style.width = Math.round(p * 100) + '%';
      pctEl.textContent = Math.round(p * 100) + '%';
      if (p >= 1) clearInterval(progressTimer);
    }, 80);

    // Audio: play fully to end — never force pause at 30s
    audio.loop = false;
    audio.addEventListener('ended', () => {
      phaseEl.textContent = 'AUDIO COMPLETE';
    });

    // At 30s: materialize UI from digits
    setTimeout(() => {
      phaseEl.textContent = 'MATERIALIZE';
      root.classList.add('is-materializing');
      document.documentElement.classList.remove('is-booting');
      document.documentElement.classList.add('boot-materializing', 'boot-revealing');

      const dig = $('#bootDigits', root);
      materializeDigits(dig, (u) => {
        if (u > 0.55) phaseEl.textContent = 'SOLIDIFY';
      });

      // After solidify animation, remove overlay (audio may still play)
      setTimeout(() => {
        root.classList.add('is-done');
        document.documentElement.classList.remove('boot-materializing');
        setTimeout(() => {
          stopFace && stopFace();
          root.remove();
          document.documentElement.classList.remove('boot-revealing');
          window.dispatchEvent(new CustomEvent('path-boot-complete'));
          // Mount persistent JARVIS HUD
          if (window.PathJarvis) window.PathJarvis.mount();
        }, 2800);
      }, 5600);
    }, MATERIALIZE_AT_MS);
  }

  function boot() {
    const params = new URLSearchParams(location.search);
    if (params.get('noboot') === '1') {
      if (window.PathJarvis) window.PathJarvis.mount();
      return;
    }

    document.documentElement.classList.add('is-booting');
    const root = createBootDOM();
    wrapSiteShell();

    const gate = $('#bootGate', root);
    const btn = $('#bootEnableSound', root);
    const audio = $('#bootAudio', root);

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Просыпаемся…';
      try {
        localStorage.setItem(STORAGE_COOKIE, 'accepted');
      } catch { /* */ }

      try {
        audio.volume = 0.9;
        audio.currentTime = 0;
        await audio.play();
      } catch (err) {
        console.warn('audio', err);
      }

      gate.classList.add('is-hidden');
      runSequence(root, audio);
    });

    setTimeout(() => btn.focus(), 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
