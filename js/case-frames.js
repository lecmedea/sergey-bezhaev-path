/**
 * Locked live project browsers (iframe).
 * Uses data-embed-src when production domain blocks framing (X-Frame-Options).
 */
(() => {
  'use strict';

  function initFrame(frame) {
    const iframe = frame.querySelector('.case-frame__iframe');
    if (!iframe) return;

    const publicUrl = (frame.getAttribute('data-live-src') || '').trim();
    const embedUrl = (frame.getAttribute('data-embed-src') || publicUrl || iframe.getAttribute('src') || '').trim();
    if (embedUrl && iframe.getAttribute('src') !== embedUrl) {
      iframe.setAttribute('src', embedUrl);
    }

    let loaded = false;
    const lock = frame.querySelector('.case-lock');

    const timer = setTimeout(() => {
      if (!loaded) {
        frame.classList.add('is-blocked');
        if (lock) lock.textContent = 'preview';
      }
    }, 6000);

    iframe.addEventListener('load', () => {
      loaded = true;
      clearTimeout(timer);
      try {
        const href = iframe.contentWindow.location.href;
        if (!href || href === 'about:blank') {
          frame.classList.add('is-blocked');
          if (lock) lock.textContent = 'preview';
        } else {
          frame.classList.remove('is-blocked');
          if (lock) lock.textContent = 'live';
        }
      } catch {
        // cross-origin success
        frame.classList.remove('is-blocked');
        if (lock) lock.textContent = 'live';
      }
    });
  }

  function init() {
    document.querySelectorAll('.case-frame[data-live-src], .case-frame[data-embed-src]').forEach(initFrame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
