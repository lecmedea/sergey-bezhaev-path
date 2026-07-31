/** Falling stars background — throttled, pauses when tab hidden */
(() => {
  'use strict';
  function mount() {
    if (document.getElementById('pathStars')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const c = document.createElement('canvas');
    c.id = 'pathStars';
    c.className = 'path-stars';
    c.setAttribute('aria-hidden', 'true');
    document.body.prepend(c);
    const ctx = c.getContext('2d', { alpha: true });
    let w = 0;
    let h = 0;
    let stars = [];
    let raf = 0;
    let running = true;
    let last = 0;

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = c.width = Math.floor(innerWidth * dpr);
      h = c.height = Math.floor(innerHeight * dpr);
      c.style.width = '100%';
      c.style.height = '100%';
      // Fewer stars = less paint cost (was ~90 + linear gradients/frame)
      const n = Math.floor((innerWidth * innerHeight) / 32000);
      stars = Array.from({ length: Math.max(16, Math.min(42, n)) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.4 + Math.random() * 1.4,
        len: 6 + Math.random() * 18,
        a: 0.22 + Math.random() * 0.45
      }));
    }

    function frame(ts) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      // ~30fps is enough for background ambience
      if (ts - last < 32) return;
      last = ts;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.y += s.z * 2.0;
        s.x += s.z * 0.3;
        if (s.y > h + 40) {
          s.y = -40;
          s.x = Math.random() * w;
        }
        // Solid stroke — createLinearGradient every frame was a major lag source
        ctx.strokeStyle = 'rgba(255,255,255,' + s.a + ')';
        ctx.lineWidth = s.z;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.len * 0.25, s.y - s.len);
        ctx.stroke();
      }
    }

    function start() {
      if (raf) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    resize();
    addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });
    // Pause during heavy boot — resume after path-boot-complete
    if (document.documentElement.classList.contains('is-booting') ||
        document.documentElement.classList.contains('boot-cosmos')) {
      document.addEventListener('path-boot-complete', start, { once: true });
    } else {
      start();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
