/**
 * 30s digital boot — Matrix rain + JARVIS console + Ultron HUD.
 * Gate: cookies + "Enable sound" required before sequence / audio.
 */
(() => {
  'use strict';

  const BOOT_MS = 30000;
  const STORAGE_KEY = 'sb_path_boot_v1';

  const LINES = [
    { t: 400, text: 'PATH OS · kernel bootstrap…', cls: 'line--sys' },
    { t: 1200, text: 'Initializing neural interface…', cls: 'line--ok' },
    { t: 2200, text: 'Loading personality matrix: SERGEY_BEZHAEV', cls: 'line--ok' },
    { t: 3400, text: 'JARVIS-class assistant: ONLINE', cls: 'line--sys' },
    { t: 4600, text: 'Ultron protocol: observation only · no weapons', cls: 'line--warn' },
    { t: 5800, text: 'Decrypting skill lattice · AI / digital / build', cls: 'line--ok' },
    { t: 7200, text: 'Mounting modules: Azimut · Grillz · Elena Shop', cls: 'line--ok' },
    { t: 8600, text: 'Calibrating orbit deck · horizontal path', cls: 'line--sys' },
    { t: 10000, text: 'Matrix layer: digital rain synchronized', cls: 'line--ok' },
    { t: 11400, text: 'Consciousness threshold: 47%… 62%… 81%', cls: 'line--sys' },
    { t: 13000, text: 'WARNING: user presence detected in the code', cls: 'line--warn' },
    { t: 14600, text: 'Forging synthetic cognition…', cls: 'line--ok' },
    { t: 16200, text: 'Linking vision systems · path cameras', cls: 'line--ok' },
    { t: 17800, text: 'Ethics core: human-first · no dark patterns', cls: 'line--sys' },
    { t: 19400, text: 'Deploying UI chrome · Lego modules snap', cls: 'line--ok' },
    { t: 21000, text: 'Reality mesh: STABLE', cls: 'line--ok' },
    { t: 22600, text: 'Handing control to operator…', cls: 'line--sys' },
    { t: 24200, text: 'Welcome to the Path.', cls: 'line--ok' },
    { t: 25800, text: 'Systems nominal. Opening workspace.', cls: 'line--ok' }
  ];

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function createBootDOM() {
    const root = document.createElement('div');
    root.className = 'boot';
    root.id = 'bootSequence';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Цифровой запуск Path OS');
    root.innerHTML = `
      <canvas class="boot__rain" id="bootRain" aria-hidden="true"></canvas>
      <div class="boot__hud" aria-hidden="true">
        <div class="boot__ring boot__ring--3"></div>
        <div class="boot__ring boot__ring--2"></div>
        <div class="boot__ring boot__ring--1"></div>
        <div class="boot__core"></div>
      </div>
      <div class="boot__scan" aria-hidden="true"></div>
      <div class="boot__vignette" aria-hidden="true"></div>
      <div class="boot__flash" id="bootFlash" aria-hidden="true"></div>

      <div class="boot__title" id="bootTitle">
        <h2>PATH OS</h2>
        <p>Creating intelligence · digital flight</p>
      </div>

      <div class="boot__gate" id="bootGate">
        <div class="boot__gate-tag">Security · Cookies · Audio</div>
        <h1>Цифровой запуск</h1>
        <p>
          Этот сайт использует cookies для настроек интерфейса и локальных предпочтений.
          Продолжая, вы соглашаетесь на их использование.
        </p>
        <p>
          Для полного опыта Path OS требуется звук. Без включения звука загрузка
          <strong>не начнётся</strong> — так задумано.
        </p>
        <div class="boot__gate-actions">
          <button type="button" class="boot__btn" id="bootEnableSound">
            Включить звук · запустить систему
          </button>
          <button type="button" class="boot__btn boot__btn--ghost" id="bootCookiesOnly" hidden>
            Только cookies (без запуска)
          </button>
        </div>
      </div>

      <div class="boot__console" id="bootConsole">
        <div class="boot__status-list" id="bootLines" aria-live="polite"></div>
        <div class="boot__bar" aria-hidden="true"><div class="boot__bar-fill" id="bootBar"></div></div>
        <div class="boot__meta">
          <span id="bootPhase">STANDBY</span>
          <span id="bootPct">0%</span>
        </div>
      </div>

      <audio id="bootAudio" preload="auto" loop playsinline src="assets/audio/boot.mp3"></audio>
    `;
    document.body.prepend(root);
    return root;
  }

  /* Matrix rain */
  function startRain(canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let cols = [];
    let fontSize = 14;
    let raf = 0;
    const glyphs = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEF<>/$#@%&*';

    function resize() {
      w = canvas.width = window.innerWidth * Math.min(devicePixelRatio || 1, 2);
      h = canvas.height = window.innerHeight * Math.min(devicePixelRatio || 1, 2);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      fontSize = Math.max(12, Math.floor(w / 80));
      const n = Math.floor(w / fontSize);
      cols = Array.from({ length: n }, () => Math.random() * h);
    }

    function frame() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < cols.length; i += 1) {
        const ch = glyphs[(Math.random() * glyphs.length) | 0];
        const x = i * fontSize;
        const y = cols[i] * fontSize;
        ctx.fillStyle = i % 7 === 0 ? 'rgba(200,255,255,0.95)' : 'rgba(0,255,140,0.75)';
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.975) cols[i] = 0;
        else cols[i] += 0.65 + Math.random() * 0.5;
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }

  function wrapSiteShell() {
    // Everything except boot becomes .site-shell
    const boot = document.getElementById('bootSequence');
    const shell = document.createElement('div');
    shell.className = 'site-shell';
    const nodes = [...document.body.childNodes];
    nodes.forEach((n) => {
      if (n === boot) return;
      shell.appendChild(n);
    });
    document.body.appendChild(shell);
  }

  function runSequence(root, audio) {
    const linesEl = $('#bootLines', root);
    const bar = $('#bootBar', root);
    const pctEl = $('#bootPct', root);
    const phaseEl = $('#bootPhase', root);
    const title = $('#bootTitle', root);
    const flash = $('#bootFlash', root);
    const t0 = performance.now();
    let stopRain = startRain($('#bootRain', root));

    root.classList.add('is-running');
    phaseEl.textContent = 'BOOT SEQUENCE';

    // Status lines
    LINES.forEach((item) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = `line ${item.cls || 'line--ok'}`;
        div.textContent = item.text;
        linesEl.appendChild(div);
        // keep last ~10 visible
        while (linesEl.children.length > 12) {
          linesEl.removeChild(linesEl.firstChild);
        }
      }, item.t);
    });

    // Title mid-sequence
    setTimeout(() => {
      title.classList.add('is-on');
      phaseEl.textContent = 'SYNTHETIC MIND';
    }, 9000);

    // Progress bar tick
    const progressTimer = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / BOOT_MS);
      const pct = Math.round(p * 100);
      bar.style.width = pct + '%';
      pctEl.textContent = pct + '%';
      if (p >= 1) clearInterval(progressTimer);
    }, 100);

    // Flash + reveal near end
    setTimeout(() => {
      flash.classList.add('is-on');
      phaseEl.textContent = 'OPENING PATH';
      document.documentElement.classList.add('boot-revealing');
      document.documentElement.classList.remove('is-booting');
    }, 26500);

    setTimeout(() => {
      if (audio && !audio.paused) {
        // soft fade audio
        const fade = setInterval(() => {
          if (audio.volume > 0.05) audio.volume = Math.max(0, audio.volume - 0.05);
          else {
            clearInterval(fade);
            audio.pause();
          }
        }, 80);
      }
      root.classList.add('is-done');
      try {
        sessionStorage.setItem(STORAGE_KEY, 'done');
      } catch { /* */ }
      setTimeout(() => {
        stopRain && stopRain();
        root.remove();
        document.documentElement.classList.remove('boot-revealing');
        window.dispatchEvent(new CustomEvent('path-boot-complete'));
      }, 1500);
    }, BOOT_MS);
  }

  function boot() {
    // Always show gate once per session (force sound experience)
    // If user already finished this session and reloads mid-session, still re-gate
    // for the intended "must enable sound" product rule:
    // Only skip if ?noboot=1 for debugging
    const params = new URLSearchParams(location.search);
    if (params.get('noboot') === '1') return;

    document.documentElement.classList.add('is-booting');
    const root = createBootDOM();
    wrapSiteShell();

    const gate = $('#bootGate', root);
    const btn = $('#bootEnableSound', root);
    const audio = $('#bootAudio', root);

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Запуск…';
      try {
        localStorage.setItem('sb_path_cookies', 'accepted');
      } catch { /* */ }

      try {
        audio.volume = 0.85;
        audio.currentTime = 0;
        await audio.play();
      } catch (err) {
        // still proceed if play fails after user gesture (rare)
        console.warn('audio play', err);
      }

      gate.classList.add('is-hidden');
      runSequence(root, audio);
    });

    // focus for a11y
    setTimeout(() => btn.focus(), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
