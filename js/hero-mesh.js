/**
 * Hero mesh portrait: red digits + letters from "Sergey Bezhaev"
 * spawn from the face and dissolve into air.
 */
(() => {
  'use strict';

  const GLYPHS = 'SergeyBezhaev0123456789';

  function mount() {
    const root = document.getElementById('heroMesh');
    const canvas = document.getElementById('heroMeshFx');
    const img = root?.querySelector('.hero-mesh__img');
    if (!root || !canvas || !img) return;

    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles = [];
    let gi = 0;
    let raf = 0;

    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      const r = root.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(n) {
      // spawn from face ellipse (center mass of image)
      const cx = w * 0.5;
      const cy = h * 0.42;
      const rx = w * 0.28;
      const ry = h * 0.32;
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.sqrt(Math.random());
        const sx = cx + Math.cos(ang) * rx * rad * 0.85;
        const sy = cy + Math.sin(ang) * ry * rad * 0.95;
        // outward velocity from center
        const dx = sx - cx;
        const dy = sy - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const sp = 0.35 + Math.random() * 1.45;
        gi = (gi + 1) % GLYPHS.length;
        particles.push({
          x: sx,
          y: sy,
          vx: (dx / dist) * sp + (Math.random() - 0.5) * 0.4,
          vy: (dy / dist) * sp - 0.15 - Math.random() * 0.6,
          life: 1,
          decay: 0.006 + Math.random() * 0.012,
          size: 10 + Math.random() * 16,
          ch: GLYPHS[gi],
          spin: (Math.random() - 0.5) * 0.08
        });
      }
      if (particles.length > 220) particles.splice(0, particles.length - 220);
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      // continuous emit
      if (Math.random() < 0.85) spawn(2 + (Math.random() * 3) | 0);
      if (Math.random() < 0.35) spawn(4);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.012; // drift up slightly
        p.vx *= 0.995;
        const a = p.life * 0.9;
        // red neon
        const r = 255;
        const g = 40 + (1 - p.life) * 40;
        const b = 55 + (1 - p.life) * 30;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin * (1 - p.life) * 12);
        ctx.globalAlpha = a;
        ctx.fillStyle = `rgba(${r},${g | 0},${b | 0},1)`;
        ctx.shadowColor = `rgba(255,40,60,${0.55 * a})`;
        ctx.shadowBlur = 12;
        ctx.font = `600 ${p.size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.fillText(p.ch, 0, 0);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      size();
      cancelAnimationFrame(raf);
      particles = [];
      spawn(24);
      raf = requestAnimationFrame(frame);
    }

    if (img.complete) start();
    else img.addEventListener('load', start, { once: true });
    addEventListener('resize', () => {
      size();
    }, { passive: true });

    // pause when origin bay not visible (perf)
    const bay = document.getElementById('bay-0');
    if (bay && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          const vis = entries.some((e) => e.isIntersecting);
          if (vis) {
            if (!raf) raf = requestAnimationFrame(frame);
          } else {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        },
        { threshold: 0.05 }
      );
      io.observe(bay);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
