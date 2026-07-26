/**
 * Rope link + free drag for assistant FAB + panel.
 * Line always visible when panel open; dragging one springs the other.
 */
(() => {
  'use strict';

  const pairs = [];

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function ensureLine(id, colorClass) {
    let line = document.getElementById(id);
    if (!line) {
      line = document.createElement('div');
      line.id = id;
      line.className = 'assist-link ' + colorClass;
      line.setAttribute('aria-hidden', 'true');
      document.body.appendChild(line);
    }
    return line;
  }

  function place(el, x, y) {
    const w = el.offsetWidth || 68;
    const h = el.offsetHeight || 68;
    x = clamp(x, 4, window.innerWidth - w - 4);
    y = clamp(y, 4, window.innerHeight - h - 4);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.position = 'fixed';
  }

  function getXY(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }

  function drawLine(line, a, b) {
    // a,b = {cx,cy} centers; attach to nearest edges
    const ar = a.el.getBoundingClientRect();
    const br = b.el.getBoundingClientRect();
    const acx = ar.left + ar.width / 2;
    const acy = ar.top + ar.height / 2;
    const bcx = br.left + br.width / 2;
    const bcy = br.top + br.height / 2;

    // points on box borders toward the other
    function borderPoint(r, tx, ty) {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = tx - cx;
      const dy = ty - cy;
      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x: cx, y: cy };
      const sx = dx !== 0 ? (r.width / 2) / Math.abs(dx) : 1e9;
      const sy = dy !== 0 ? (r.height / 2) / Math.abs(dy) : 1e9;
      const s = Math.min(sx, sy);
      return { x: cx + dx * s, y: cy + dy * s };
    }
    const p1 = borderPoint(ar, bcx, bcy);
    const p2 = borderPoint(br, acx, acy);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    line.style.width = Math.max(0, len) + 'px';
    line.style.left = p1.x + 'px';
    line.style.top = p1.y + 'px';
    line.style.transform = 'rotate(' + ang + 'deg)';
    line.classList.add('is-on');
  }

  function makeDraggable(el, onDrag, onEnd) {
    let dragging = false;
    let ox = 0;
    let oy = 0;
    let moved = false;
    const down = (e) => {
      // FABs: drag anywhere on icon. Panels: only header (not close/buttons).
      if (el.classList.contains('jarvis-hud__panel') || el.classList.contains('sophia-hud__panel')) {
        if (!e.target.closest('.assist-drag-handle, .assist-panel__head')) return;
        if (e.target.closest('.assist-panel__close, button, a, input')) return;
      }
      if (e.button != null && e.button !== 0) return;
      dragging = true;
      moved = false;
      el.classList.add('is-dragging');
      const r = el.getBoundingClientRect();
      const pt = e.touches ? e.touches[0] : e;
      ox = pt.clientX - r.left;
      oy = pt.clientY - r.top;
      e.preventDefault();
    };
    const move = (e) => {
      if (!dragging) return;
      const pt = e.touches ? e.touches[0] : e;
      place(el, pt.clientX - ox, pt.clientY - oy);
      moved = true;
      onDrag && onDrag();
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-dragging');
      if (moved) {
        el.dataset.dragged = '1';
        setTimeout(() => {
          el.dataset.dragged = '0';
        }, 40);
        onEnd && onEnd();
      }
    };
    el.addEventListener('mousedown', down);
    el.addEventListener('touchstart', down, { passive: false });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
  }

  function bindPair(opts) {
    const fab = document.getElementById(opts.fabId);
    const panel = document.getElementById(opts.panelId);
    if (!fab || !panel) return null;
    const line = ensureLine(opts.lineId, opts.colorClass);

    // store preferred offset panel relative to fab
    let offX = opts.offX != null ? opts.offX : -300;
    let offY = opts.offY != null ? opts.offY : -40;
    let draggingFab = false;
    let draggingPanel = false;

    // mark panel header as drag handle
    const head = panel.querySelector('.assist-panel__head');
    if (head) head.classList.add('assist-drag-handle');
    panel.classList.add('assist-panel--free');

    function openPlace() {
      const fr = fab.getBoundingClientRect();
      // first open: put panel left of fab if room
      let px = fr.left + offX;
      let py = fr.top + offY;
      if (px < 8) px = fr.right + 16;
      place(panel, px, py);
      const pr = panel.getBoundingClientRect();
      offX = pr.left - fr.left;
      offY = pr.top - fr.top;
    }

    function followFromFab(strength) {
      if (!panel.classList.contains('is-open')) return;
      const fr = fab.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      const tx = fr.left + offX;
      const ty = fr.top + offY;
      const nx = pr.left + (tx - pr.left) * strength;
      const ny = pr.top + (ty - pr.top) * strength;
      place(panel, nx, ny);
    }

    function followFromPanel(strength) {
      const fr = fab.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      const tx = pr.left - offX;
      const ty = pr.top - offY;
      const nx = fr.left + (tx - fr.left) * strength;
      const ny = fr.top + (ty - fr.top) * strength;
      place(fab, nx, ny);
    }

    function updateOffset() {
      const fr = fab.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      offX = pr.left - fr.left;
      offY = pr.top - fr.top;
    }

    function paint() {
      if (!panel.classList.contains('is-open')) {
        line.classList.remove('is-on');
        return;
      }
      drawLine(line, { el: fab }, { el: panel });
    }

    // free drag both
    makeDraggable(fab, () => {
      draggingFab = true;
      if (panel.classList.contains('is-open')) followFromFab(0.35);
      paint();
    }, () => {
      draggingFab = false;
      updateOffset();
      try {
        localStorage.setItem(opts.fabPosKey, JSON.stringify({ x: parseFloat(fab.style.left), y: parseFloat(fab.style.top) }));
      } catch { /* */ }
    });

    makeDraggable(panel, () => {
      draggingPanel = true;
      followFromPanel(0.28);
      paint();
    }, () => {
      draggingPanel = false;
      updateOffset();
      try {
        localStorage.setItem(opts.panelPosKey, JSON.stringify({ x: parseFloat(panel.style.left), y: parseFloat(panel.style.top) }));
      } catch { /* */ }
    });

    // inertia loop while open
    function tick() {
      if (panel.classList.contains('is-open')) {
        if (draggingFab) followFromFab(0.22);
        else if (draggingPanel) followFromPanel(0.18);
        paint();
      } else {
        line.classList.remove('is-on');
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // when opens, place near fab unless saved panel pos
    const mo = new MutationObserver(() => {
      if (panel.classList.contains('is-open')) {
        try {
          const saved = JSON.parse(localStorage.getItem(opts.panelPosKey) || 'null');
          if (saved && typeof saved.x === 'number') place(panel, saved.x, saved.y);
          else openPlace();
        } catch {
          openPlace();
        }
        updateOffset();
        paint();
      } else {
        line.classList.remove('is-on');
      }
    });
    mo.observe(panel, { attributes: true, attributeFilter: ['class'] });

    pairs.push({ fab, panel, line, paint, openPlace });
    return { openPlace, paint };
  }

  function init() {
    bindPair({
      fabId: 'jarvisFab',
      panelId: 'jarvisPanel',
      lineId: 'jarvisLink',
      colorClass: 'assist-link--cyan',
      fabPosKey: 'sb_jarvis_fab_pos',
      panelPosKey: 'sb_jarvis_panel_pos',
      offX: -320,
      offY: -80
    });
    bindPair({
      fabId: 'sophiaFab',
      panelId: 'sophiaPanel',
      lineId: 'sophiaLink',
      colorClass: 'assist-link--pink',
      fabPosKey: 'sb_sophia_fab_pos',
      panelPosKey: 'sb_sophia_panel_pos',
      offX: -320,
      offY: -80
    });
  }

  window.PathAssistDock = { init };
  document.addEventListener('path-boot-complete', () => setTimeout(init, 300));
  if (document.readyState !== 'loading') setTimeout(init, 500);
  else document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
})();
