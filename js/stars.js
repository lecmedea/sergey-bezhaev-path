/** Falling stars background on all Path pages */
(() => {
  'use strict';
  function mount() {
    if (document.getElementById('pathStars')) return;
    const c = document.createElement('canvas');
    c.id = 'pathStars';
    c.className = 'path-stars';
    c.setAttribute('aria-hidden', 'true');
    document.body.prepend(c);
    const ctx = c.getContext('2d');
    let w = 0;
    let h = 0;
    let stars = [];
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = c.width = innerWidth * dpr;
      h = c.height = innerHeight * dpr;
      c.style.width = '100%';
      c.style.height = '100%';
      const n = Math.floor((innerWidth * innerHeight) / 18000);
      stars = Array.from({ length: Math.max(28, Math.min(90, n)) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.4 + Math.random() * 1.6,
        len: 8 + Math.random() * 28,
        a: 0.25 + Math.random() * 0.55
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y += s.z * 2.2;
        s.x += s.z * 0.35;
        if (s.y > h + 40) {
          s.y = -40;
          s.x = Math.random() * w;
        }
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.len * 0.3, s.y - s.len);
        g.addColorStop(0, `rgba(255,255,255,${s.a})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = s.z;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.len * 0.25, s.y - s.len);
        ctx.stroke();
      }
      requestAnimationFrame(frame);
    }
    resize();
    addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
