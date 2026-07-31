/**
 * Cursor trail — inspired by https://github.com/Postnov/cursor-trail
 * Path palette: cyan/red neon trail + soft dual cursor.
 */
(() => {
  'use strict';

  // Skip on touch-only devices
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine) return;

  const trailSettings = {
    color: 'rgba(90, 210, 255, 0.85)',
    colorHot: 'rgba(255, 70, 90, 0.9)',
    thickness: 1.25,
    maxSegments: 48,
    minDistance: 3,
    inactivityTimeout: 4200
  };

  // Keep system cursor visible (user requested) — trail is additive only
  document.documentElement.classList.remove('has-cursor-trail');

  const segments = [];
  let lastX = null;
  let lastY = null;
  let first = true;
  let idleTimer = null;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  function clearTrail() {
    if (!segments.length) return;
    segments.forEach((el, i) => {
      setTimeout(() => {
        el.style.opacity = '0';
      }, 40 * i);
    });
    setTimeout(() => {
      segments.forEach((el) => el.remove());
      segments.length = 0;
    }, 40 * segments.length + 280);
  }

  function bumpIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(clearTrail, trailSettings.inactivityTimeout);
  }

  function addSegment(x1, y1, x2, y2) {
    const el = document.createElement('div');
    el.className = 'trail-segment';
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    const t = segments.length / Math.max(1, trailSettings.maxSegments);
    const col = t > 0.55 ? trailSettings.colorHot : trailSettings.color;
    el.style.width = len + 'px';
    el.style.height = trailSettings.thickness + 'px';
    el.style.left = x1 + 'px';
    el.style.top = y1 + 'px';
    el.style.transform = 'rotate(' + ang + 'deg)';
    el.style.transformOrigin = '0 0';
    el.style.background = col;
    el.style.boxShadow = '0 0 8px ' + col;
    el.style.opacity = '1';
    el.style.transition = 'opacity 0.35s ease';
    document.body.appendChild(el);
    segments.push(el);
    if (segments.length > trailSettings.maxSegments) {
      const old = segments.shift();
      old.style.opacity = '0';
      setTimeout(() => old.remove(), 300);
    }
    segments.forEach((seg, i) => {
      seg.style.opacity = String((i + 1) / segments.length);
    });
  }

  document.addEventListener(
    'mousemove',
    (e) => {
      bumpIdle();
      const x = e.clientX;
      const y = e.clientY;
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      ring.style.left = x + 'px';
      ring.style.top = y + 'px';
      if (first) {
        lastX = x;
        lastY = y;
        first = false;
        return;
      }
      if (lastX == null || lastY == null) {
        lastX = x;
        lastY = y;
        return;
      }
      const dist = Math.hypot(x - lastX, y - lastY);
      if (dist > trailSettings.minDistance) {
        addSegment(lastX, lastY, x, y);
        lastX = x;
        lastY = y;
      }
    },
    { passive: true }
  );

  document.addEventListener(
    'mousedown',
    () => {
      dot.classList.add('is-down');
    },
    { passive: true }
  );
  document.addEventListener(
    'mouseup',
    () => {
      dot.classList.remove('is-down');
    },
    { passive: true }
  );

  document.addEventListener(
    'mouseover',
    (e) => {
      if (e.target.closest('a, button, .btn, [role="button"], .jarvis-hud__fab, .sophia-hud__fab, input, textarea')) {
        ring.classList.add('is-hover');
        dot.style.background = 'rgba(255, 90, 110, 0.95)';
      }
    },
    { passive: true }
  );
  document.addEventListener(
    'mouseout',
    (e) => {
      if (e.target.closest('a, button, .btn, [role="button"], .jarvis-hud__fab, .sophia-hud__fab, input, textarea')) {
        ring.classList.remove('is-hover');
        dot.style.background = 'rgba(255, 80, 100, 0.95)';
      }
    },
    { passive: true }
  );

  bumpIdle();
})();
