/**
 * Rope (SVG) + free drag for assistant FAB + panel.
 * Robust: polls until FABs exist; always draws line when panel open.
 */
(() => {
  'use strict';

  const bound = new Set();

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function ensureSvg() {
    let svg = document.getElementById('assistRopes');
    if (svg) return svg;
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'assistRopes';
    svg.setAttribute('class', 'assist-ropes');
    svg.setAttribute('aria-hidden', 'true');
    document.body.appendChild(svg);
    return svg;
  }

  function ensureLine(id, color) {
    const svg = ensureSvg();
    let line = document.getElementById(id);
    if (!line) {
      line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.id = id;
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '2.5');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('class', 'assist-rope-line');
      // glow via filter
      line.style.filter = `drop-shadow(0 0 4px ${color})`;
      svg.appendChild(line);
    }
    return line;
  }

  function place(el, x, y) {
    const w = el.offsetWidth || 72;
    const h = el.offsetHeight || 72;
    x = clamp(x, 4, window.innerWidth - w - 4);
    y = clamp(y, 4, window.innerHeight - h - 4);
    el.style.position = 'fixed';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.margin = '0';
  }

  function borderPoint(r, tx, ty) {
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = tx - cx;
    let dy = ty - cy;
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x: cx, y: cy };
    const sx = dx !== 0 ? r.width / 2 / Math.abs(dx) : 1e9;
    const sy = dy !== 0 ? r.height / 2 / Math.abs(dy) : 1e9;
    const s = Math.min(sx, sy);
    return { x: cx + dx * s, y: cy + dy * s };
  }

  function paintLine(line, fab, panel) {
    if (!panel.classList.contains('is-open')) {
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', '0');
      line.setAttribute('y2', '0');
      line.style.opacity = '0';
      return;
    }
    // force layout
    if (panel.offsetWidth < 2) return;
    const ar = fab.getBoundingClientRect();
    const br = panel.getBoundingClientRect();
    const acx = ar.left + ar.width / 2;
    const acy = ar.top + ar.height / 2;
    const bcx = br.left + br.width / 2;
    const bcy = br.top + br.height / 2;
    const p1 = borderPoint(ar, bcx, bcy);
    const p2 = borderPoint(br, acx, acy);
    line.setAttribute('x1', String(p1.x));
    line.setAttribute('y1', String(p1.y));
    line.setAttribute('x2', String(p2.x));
    line.setAttribute('y2', String(p2.y));
    line.style.opacity = '1';
  }

  function makeDraggable(el, isPanel, onMove, onEnd) {
    let dragging = false;
    let ox = 0;
    let oy = 0;
    let moved = false;
    let startX = 0;
    let startY = 0;

    const down = (e) => {
      if (isPanel) {
        if (!e.target.closest('.assist-panel__head, .assist-drag-handle')) return;
        if (e.target.closest('.assist-panel__close, a, input, textarea, select')) return;
        // allow drag from header text, not from action buttons inside head only close
        if (e.target.closest('button') && !e.target.closest('.assist-drag-handle')) return;
      }
      if (e.button != null && e.button !== 0) return;
      const pt = e.touches ? e.touches[0] : e;
      startX = pt.clientX;
      startY = pt.clientY;
      dragging = true;
      moved = false;
      el.classList.add('is-dragging');
      const r = el.getBoundingClientRect();
      ox = pt.clientX - r.left;
      oy = pt.clientY - r.top;
      // don't preventDefault on fab yet — need click for open
      if (isPanel) e.preventDefault();
    };

    const move = (e) => {
      if (!dragging) return;
      const pt = e.touches ? e.touches[0] : e;
      if (!moved) {
        const dist = Math.hypot(pt.clientX - startX, pt.clientY - startY);
        if (dist < 5) return;
        moved = true;
        e.preventDefault();
      }
      place(el, pt.clientX - ox, pt.clientY - oy);
      onMove && onMove();
    };

    const up = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-dragging');
      if (moved) {
        el.dataset.dragged = '1';
        setTimeout(() => {
          el.dataset.dragged = '0';
        }, 80);
        onEnd && onEnd();
      }
    };

    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function bindPair(opts) {
    if (bound.has(opts.fabId)) return true;
    const fab = document.getElementById(opts.fabId);
    const panel = document.getElementById(opts.panelId);
    if (!fab || !panel) return false;

    bound.add(opts.fabId);
    const line = ensureLine(opts.lineId, opts.color);

    let offX = opts.offX != null ? opts.offX : -320;
    let offY = opts.offY != null ? opts.offY : -60;
    let draggingFab = false;
    let draggingPanel = false;

    // ensure fab is position:fixed and has left/top for drag math
    const fr0 = fab.getBoundingClientRect();
    if (!fab.style.left) {
      place(fab, fr0.left, fr0.top);
    }
    // restore saved fab pos
    try {
      const saved = JSON.parse(localStorage.getItem(opts.fabPosKey) || 'null');
      if (saved && typeof saved.x === 'number') place(fab, saved.x, saved.y);
    } catch { /* */ }

    const head = panel.querySelector('.assist-panel__head');
    if (head) head.classList.add('assist-drag-handle');
    panel.classList.add('assist-panel--free');

    function openPlace() {
      const fr = fab.getBoundingClientRect();
      let px = fr.left + offX;
      let py = fr.top + offY;
      if (px < 8) px = fr.right + 18;
      if (py < 8) py = 16;
      // panel may be display:none — temporarily measure
      const wasOpen = panel.classList.contains('is-open');
      if (!wasOpen) panel.classList.add('is-open');
      place(panel, px, py);
      if (!wasOpen) panel.classList.remove('is-open');
      requestAnimationFrame(() => {
        if (panel.classList.contains('is-open')) {
          place(panel, px, py);
          const pr = panel.getBoundingClientRect();
          const f2 = fab.getBoundingClientRect();
          offX = pr.left - f2.left;
          offY = pr.top - f2.top;
          paintLine(line, fab, panel);
        }
      });
    }

    function followFromFab(k) {
      if (!panel.classList.contains('is-open')) return;
      const fr = fab.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      place(panel, pr.left + (fr.left + offX - pr.left) * k, pr.top + (fr.top + offY - pr.top) * k);
    }

    function followFromPanel(k) {
      const fr = fab.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      place(fab, fr.left + (pr.left - offX - fr.left) * k, fr.top + (pr.top - offY - fr.top) * k);
    }

    function updateOffset() {
      const fr = fab.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      offX = pr.left - fr.left;
      offY = pr.top - fr.top;
    }

    makeDraggable(
      fab,
      false,
      () => {
        draggingFab = true;
        if (panel.classList.contains('is-open')) followFromFab(0.4);
        paintLine(line, fab, panel);
      },
      () => {
        draggingFab = false;
        updateOffset();
        try {
          localStorage.setItem(
            opts.fabPosKey,
            JSON.stringify({ x: parseFloat(fab.style.left), y: parseFloat(fab.style.top) })
          );
        } catch { /* */ }
      }
    );

    makeDraggable(
      panel,
      true,
      () => {
        draggingPanel = true;
        followFromPanel(0.32);
        paintLine(line, fab, panel);
      },
      () => {
        draggingPanel = false;
        updateOffset();
        try {
          localStorage.setItem(
            opts.panelPosKey,
            JSON.stringify({ x: parseFloat(panel.style.left), y: parseFloat(panel.style.top) })
          );
        } catch { /* */ }
      }
    );

    function tick() {
      if (draggingFab && panel.classList.contains('is-open')) followFromFab(0.25);
      if (draggingPanel) followFromPanel(0.2);
      paintLine(line, fab, panel);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

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
        paintLine(line, fab, panel);
      } else {
        line.style.opacity = '0';
      }
    });
    mo.observe(panel, { attributes: true, attributeFilter: ['class'] });

    return true;
  }

  function tryBindAll() {
    const a = bindPair({
      fabId: 'jarvisFab',
      panelId: 'jarvisPanel',
      lineId: 'jarvisRope',
      color: '#5ad4ff',
      fabPosKey: 'sb_jarvis_fab_pos',
      panelPosKey: 'sb_jarvis_panel_pos',
      offX: -340,
      offY: -40
    });
    const b = bindPair({
      fabId: 'sophiaFab',
      panelId: 'sophiaPanel',
      lineId: 'sophiaRope',
      color: '#ff8ae8',
      fabPosKey: 'sb_sophia_fab_pos',
      panelPosKey: 'sb_sophia_panel_pos',
      offX: -340,
      offY: -40
    });
    return a && b;
  }

  function init() {
    if (tryBindAll()) return;
    let n = 0;
    const iv = setInterval(() => {
      n++;
      if (tryBindAll() || n > 80) clearInterval(iv);
    }, 250);
  }

  window.PathAssistDock = { init, rebind: () => { bound.clear(); init(); } };
  document.addEventListener('path-boot-complete', () => setTimeout(init, 100));
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 400));
  // if scripts load after DOM ready
  if (document.readyState !== 'loading') setTimeout(init, 400);
})();
