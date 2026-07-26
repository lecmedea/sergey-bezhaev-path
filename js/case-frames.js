/**
 * Locked live project browsers (iframe).
 * No address bar, sandbox limits; if host blocks embedding → show fallback screenshot.
 */
(() => {
  'use strict';

  function initFrame(frame) {
    const iframe = frame.querySelector('.case-frame__iframe');
    if (!iframe) return;
    const allowed = (frame.getAttribute('data-live-src') || iframe.getAttribute('src') || '').replace(/\/$/, '');
    let loaded = false;

    // Timeout: many sites set X-Frame-Options — fall back to screenshot
    const timer = setTimeout(() => {
      if (!loaded) {
        frame.classList.add('is-blocked');
        const lock = frame.querySelector('.case-lock');
        if (lock) lock.textContent = 'preview';
      }
    }, 4500);

    iframe.addEventListener('load', () => {
      loaded = true;
      clearTimeout(timer);
      // Best-effort: if about:blank after block, treat as blocked
      try {
        const href = iframe.contentWindow.location.href;
        if (!href || href === 'about:blank') {
          frame.classList.add('is-blocked');
        }
      } catch {
        // cross-origin success (opaque) — leave iframe visible
        frame.classList.remove('is-blocked');
      }
    });

    // Prevent parent navigation if iframe tries top navigation (best effort)
    iframe.addEventListener('load', () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        doc.querySelectorAll('a[target="_blank"], a[target="_top"], a[target="_parent"]').forEach((a) => {
          a.setAttribute('target', '_self');
        });
      } catch { /* cross-origin */ }
    });

    // Ensure src stays locked if user somehow changes it (same-origin only)
    const srcWatch = setInterval(() => {
      if (!document.body.contains(iframe)) {
        clearInterval(srcWatch);
        return;
      }
      try {
        const cur = iframe.contentWindow.location.href;
        if (allowed && cur && cur.indexOf(new URL(allowed).hostname) === -1 && cur !== 'about:blank') {
          iframe.src = allowed;
        }
      } catch { /* cross-origin: cannot read — OK */ }
    }, 2000);
  }

  function init() {
    document.querySelectorAll('.case-frame[data-live-src]').forEach(initFrame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
