/**
 * Dock assistant panels next to FABs with colored connector lines.
 */
(() => {
  'use strict';

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

  function dock(fab, panel, line, prefer) {
    if (!fab || !panel || !panel.classList.contains('is-open')) {
      if (line) line.classList.remove('is-on');
      return;
    }
    const fr = fab.getBoundingClientRect();
    const pw = Math.min(360, window.innerWidth - 24);
    const ph = Math.min(window.innerHeight * 0.52, 460);
    const gap = 14;
    const fabCx = fr.left + fr.width / 2;
    const fabCy = fr.top + fr.height / 2;

    // Prefer left of FAB if room, else right, else above
    let left = fr.left - pw - gap;
    let top = fr.top + fr.height / 2 - ph / 2;
    let side = 'left';
    if (prefer === 'right' || left < 8) {
      left = fr.right + gap;
      side = 'right';
      if (left + pw > window.innerWidth - 8) {
        left = Math.max(8, Math.min(window.innerWidth - pw - 8, fr.left + fr.width / 2 - pw / 2));
        top = fr.top - ph - gap;
        side = 'top';
        if (top < 8) {
          top = fr.bottom + gap;
          side = 'bottom';
        }
      }
    }
    top = Math.max(8, Math.min(window.innerHeight - ph - 8, top));
    left = Math.max(8, Math.min(window.innerWidth - pw - 8, left));

    panel.style.width = pw + 'px';
    panel.style.maxHeight = ph + 'px';
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.position = 'fixed';

    const pr = panel.getBoundingClientRect();
    const pCx = pr.left + pr.width / 2;
    const pCy = pr.top + pr.height / 2;

    // Line from fab center to nearest panel edge midpoint
    let x1 = fabCx;
    let y1 = fabCy;
    let x2 = pCx;
    let y2 = pCy;
    if (side === 'left') {
      x2 = pr.right;
      y2 = Math.max(pr.top + 12, Math.min(pr.bottom - 12, fabCy));
      x1 = fr.left;
    } else if (side === 'right') {
      x2 = pr.left;
      y2 = Math.max(pr.top + 12, Math.min(pr.bottom - 12, fabCy));
      x1 = fr.right;
    } else if (side === 'top') {
      x2 = Math.max(pr.left + 12, Math.min(pr.right - 12, fabCx));
      y2 = pr.bottom;
      y1 = fr.top;
    } else {
      x2 = Math.max(pr.left + 12, Math.min(pr.right - 12, fabCx));
      y2 = pr.top;
      y1 = fr.bottom;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    line.style.width = len + 'px';
    line.style.left = x1 + 'px';
    line.style.top = y1 + 'px';
    line.style.transform = `rotate(${ang}deg)`;
    line.classList.add('is-on');
  }

  function bindPair(fabId, panelId, lineId, colorClass, prefer) {
    const fab = document.getElementById(fabId);
    const panel = document.getElementById(panelId);
    if (!fab || !panel) return;
    const line = ensureLine(lineId, colorClass);
    const tick = () => dock(fab, panel, line, prefer);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(tick) : null;
    if (ro) {
      ro.observe(fab);
      ro.observe(panel);
    }
    window.addEventListener('resize', tick, { passive: true });
    window.addEventListener('scroll', tick, { passive: true });
    // observe class changes
    const mo = new MutationObserver(tick);
    mo.observe(panel, { attributes: true, attributeFilter: ['class', 'style'] });
    mo.observe(fab, { attributes: true, attributeFilter: ['style', 'class'] });
    setInterval(tick, 200);
    tick();
  }

  function init() {
    bindPair('jarvisFab', 'jarvisPanel', 'jarvisLink', 'assist-link--cyan', 'left');
    bindPair('sophiaFab', 'sophiaPanel', 'sophiaLink', 'assist-link--pink', 'left');
  }

  window.PathAssistDock = { init, dock };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  else setTimeout(init, 100);
  document.addEventListener('path-boot-complete', () => setTimeout(init, 200));
})();
