/**
 * Path gesture control — MediaPipe Hands (browser)
 * Inspired by handsfree / jshg / mediapipe / gesture-canvas patterns.
 *
 * - Presence within ~2m (heuristic via hand bounding-box size)
 * - Wave left/right → previous/next bay
 * - Clap (two hands approach) → home / origin
 *
 * Note: RuView (WiFi CSI) needs ESP32 hardware — browser path uses camera + Hands.
 */
(() => {
  'use strict';

  const STATE = {
    on: false,
    stream: null,
    raf: 0,
    lastSwipe: 0,
    lastClap: 0,
    lastCx: null,
    hands: null,
    video: null,
    canvas: null
  };

  function pathApi() {
    return window.PathAPI || null;
  }

  function go(delta) {
    const api = pathApi();
    if (api && typeof api.goRelative === 'function') api.goRelative(delta);
    else if (delta > 0) document.getElementById('btnNext')?.click();
    else document.getElementById('btnPrev')?.click();
  }

  function goHome() {
    const api = pathApi();
    if (api && typeof api.goHome === 'function') api.goHome();
    else document.getElementById('btnHome')?.click();
  }

  function ensureHud() {
    let hud = document.getElementById('gestureHud');
    if (hud) return hud;
    hud = document.createElement('div');
    hud.id = 'gestureHud';
    hud.className = 'gesture-hud';
    hud.innerHTML = `
      <video id="gestureCam" playsinline muted></video>
      <canvas id="gestureCanvas"></canvas>
      <div class="gesture-hud__meta" id="gestureMeta">GESTURE · OFF</div>
    `;
    document.body.appendChild(hud);
    return hud;
  }

  function setMeta(text) {
    const el = document.getElementById('gestureMeta');
    if (el) el.textContent = text;
  }

  /** Rough near-range: hand box height relative to frame > threshold ≈ within ~2m */
  function isNear(landmarks, vw, vh) {
    if (!landmarks || !landmarks.length) return false;
    let minY = 1;
    let maxY = 0;
    let minX = 1;
    let maxX = 0;
    landmarks.forEach((p) => {
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
    });
    const h = (maxY - minY) * vh;
    const w = (maxX - minX) * vw;
    // large hand silhouette → closer; tuned for laptop cams
    return h > vh * 0.12 || w > vw * 0.1;
  }

  function palmCenter(landmarks) {
    // average of wrist + middle MCP
    const a = landmarks[0];
    const b = landmarks[9];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function processHands(results) {
    const now = performance.now();
    const multi = results.multiHandLandmarks || [];
    const video = STATE.video;
    if (!video) return;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    // draw
    const canvas = STATE.canvas;
    if (canvas && window.drawConnectors && window.HAND_CONNECTIONS) {
      const ctx = canvas.getContext('2d');
      canvas.width = vw;
      canvas.height = vh;
      ctx.clearRect(0, 0, vw, vh);
      ctx.drawImage(video, 0, 0, vw, vh);
      multi.forEach((lm) => {
        window.drawConnectors(ctx, lm, window.HAND_CONNECTIONS, { color: '#30d158', lineWidth: 2 });
        window.drawLandmarks(ctx, lm, { color: '#0a84ff', lineWidth: 1, radius: 2 });
      });
    }

    if (!multi.length) {
      setMeta('GESTURE · no hands');
      STATE.lastCx = null;
      return;
    }

    const near = multi.some((lm) => isNear(lm, vw, vh));
    if (!near) {
      setMeta('GESTURE · too far (>~2m)');
      STATE.lastCx = null;
      return;
    }

    // clap: two hands close
    if (multi.length >= 2 && now - STATE.lastClap > 1200) {
      const c0 = palmCenter(multi[0]);
      const c1 = palmCenter(multi[1]);
      const dx = c0.x - c1.x;
      const dy = c0.y - c1.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.12) {
        STATE.lastClap = now;
        setMeta('GESTURE · CLAP → home');
        goHome();
        STATE.lastCx = null;
        return;
      }
    }

    // swipe with primary hand
    const c = palmCenter(multi[0]);
    if (STATE.lastCx != null && now - STATE.lastSwipe > 700) {
      const dx = c.x - STATE.lastCx;
      // camera mirror: hand to viewer's right → image x decreases on user-facing cam sometimes
      if (dx > 0.12) {
        STATE.lastSwipe = now;
        setMeta('GESTURE · NEXT →');
        go(1);
      } else if (dx < -0.12) {
        STATE.lastSwipe = now;
        setMeta('GESTURE · PREV ←');
        go(-1);
      } else {
        setMeta('GESTURE · near · ready');
      }
    } else {
      setMeta('GESTURE · near · tracking');
    }
    STATE.lastCx = c.x;
  }

  async function loadScripts() {
    const load = (src) =>
      new Promise((resolve, reject) => {
        if ([...document.scripts].some((s) => s.src.includes(src.split('/').pop()))) {
          resolve();
          return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = reject;
        document.head.appendChild(s);
      });
    // MediaPipe Hands + drawing utils (CDN)
    await load('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
    await load('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
    await load('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
    await load('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
  }

  async function start() {
    if (STATE.on) return;
    ensureHud();
    setMeta('GESTURE · loading…');
    try {
      await loadScripts();
    } catch (e) {
      setMeta('GESTURE · CDN load failed');
      console.error(e);
      return;
    }
    const video = document.getElementById('gestureCam');
    const canvas = document.getElementById('gestureCanvas');
    STATE.video = video;
    STATE.canvas = canvas;

    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.55
    });
    hands.onResults(processHands);
    STATE.hands = hands;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });
    STATE.stream = stream;
    video.srcObject = stream;
    await video.play();

    const camera = new window.Camera(video, {
      onFrame: async () => {
        if (STATE.hands) await STATE.hands.send({ image: video });
      },
      width: 640,
      height: 480
    });
    camera.start();
    STATE.camera = camera;
    STATE.on = true;
    document.getElementById('gestureHud')?.classList.add('is-on');
    const btn = document.getElementById('btnGestures');
    if (btn) {
      btn.textContent = window.PathI18n?.t('gestures_off') || 'Выключить жесты';
      btn.dataset.on = '1';
    }
    setMeta('GESTURE · ON · wave / clap');
  }

  function stop() {
    STATE.on = false;
    try {
      STATE.camera?.stop?.();
    } catch { /* */ }
    STATE.stream?.getTracks?.().forEach((t) => t.stop());
    STATE.stream = null;
    document.getElementById('gestureHud')?.classList.remove('is-on');
    const btn = document.getElementById('btnGestures');
    if (btn) {
      btn.textContent = window.PathI18n?.t('gestures_on') || 'Включить управление жестами';
      btn.dataset.on = '0';
    }
    setMeta('GESTURE · OFF');
  }

  function toggle() {
    if (STATE.on) stop();
    else start();
  }

  function bind() {
    // Single delegated handler (Settings panel mounts async)
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'btnGestures') {
        e.preventDefault();
        toggle();
      }
    });
  }

  window.PathGestures = { start, stop, toggle, isOn: () => STATE.on };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
