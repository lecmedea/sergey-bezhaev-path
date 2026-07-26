/**
 * Two separate preview windows per case page:
 * 1) Desktop browser window (web layout, wide viewport)
 * 2) iPhone chassis window (mobile layout)
 * Side by side — not stacked inside one chrome.
 */
(() => {
  'use strict';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function buildPair(frame) {
    if (frame.dataset.dualBuilt === '1') return;
    if (frame.closest('.case-pair')) return;

    const publicUrl = (frame.getAttribute('data-live-src') || '').trim();
    const embed = (
      frame.getAttribute('data-embed-src') ||
      publicUrl ||
      frame.querySelector('iframe')?.getAttribute('src') ||
      ''
    ).trim();
    if (!embed) return;

    const domain =
      frame.querySelector('.case-frame__chrome em')?.textContent?.trim() ||
      (() => {
        try {
          return new URL(publicUrl || embed).hostname;
        } catch {
          return 'site';
        }
      })();
    const fallbackSrc = frame.querySelector('.case-frame__fallback, .case-frame__shot img')?.getAttribute('src') || '';

    frame.dataset.dualBuilt = '1';

    const pair = document.createElement('div');
    pair.className = 'case-pair';
    pair.innerHTML = `
      <div class="case-window case-window--web" data-live-src="${esc(publicUrl)}" data-embed-src="${esc(embed)}">
        <div class="case-frame__chrome">
          <span class="case-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <em>${esc(domain)}</em>
          <span class="case-lock">Web</span>
        </div>
        <div class="case-window__body case-window__body--web">
          ${fallbackSrc ? `<img class="case-frame__fallback" src="${esc(fallbackSrc)}" alt="" loading="lazy" decoding="async">` : ''}
          <div class="case-desktop__viewport">
            <iframe class="case-frame__iframe case-frame__iframe--desk" title="${esc(domain)} · desktop"
              src="${esc(embed)}" loading="lazy" referrerpolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
          </div>
        </div>
      </div>

      <div class="case-window case-window--phone" data-live-src="${esc(publicUrl)}" data-embed-src="${esc(embed)}">
        <div class="case-phone-shell">
          <div class="case-phone__speaker" aria-hidden="true"></div>
          <div class="case-phone__notch" aria-hidden="true"></div>
          <div class="case-phone__screen">
            ${fallbackSrc ? `<img class="case-frame__fallback case-frame__fallback--mob" src="${esc(fallbackSrc)}" alt="" loading="lazy" decoding="async">` : ''}
            <iframe class="case-frame__iframe case-frame__iframe--mob" title="${esc(domain)} · mobile"
              src="${esc(embed)}" loading="lazy" referrerpolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
          </div>
          <div class="case-phone__home" aria-hidden="true"></div>
        </div>
        <div class="case-phone__caption">iPhone · mobile</div>
      </div>
    `;

    frame.replaceWith(pair);

    const desk = pair.querySelector('.case-frame__iframe--desk');
    const mob = pair.querySelector('.case-frame__iframe--mob');
    const deskVP = pair.querySelector('.case-desktop__viewport');
    const mobScreen = pair.querySelector('.case-phone__screen');
    const webWin = pair.querySelector('.case-window--web');
    const phoneWin = pair.querySelector('.case-window--phone');

    function scaleIframes() {
      if (desk && deskVP) {
        const vw = 1440;
        const vh = 900;
        desk.style.width = vw + 'px';
        desk.style.height = vh + 'px';
        const s = deskVP.clientWidth / vw;
        desk.style.transform = 'scale(' + s + ')';
        deskVP.style.height = Math.max(200, vh * s) + 'px';
      }
      if (mob && mobScreen) {
        const mw = 390;
        const mh = 844;
        mob.style.width = mw + 'px';
        mob.style.height = mh + 'px';
        const s2 = mobScreen.clientWidth / mw;
        mob.style.transform = 'scale(' + s2 + ')';
      }
    }

    scaleIframes();
    addEventListener('resize', scaleIframes, { passive: true });
    setTimeout(scaleIframes, 120);
    setTimeout(scaleIframes, 600);

    let loaded = 0;
    const onLoad = (el, win) => {
      el?.addEventListener('load', () => {
        loaded++;
        win?.classList.add('is-live');
        const lock = win?.querySelector('.case-lock');
        if (lock) lock.textContent = 'Web · live';
      });
    };
    onLoad(desk, webWin);
    onLoad(mob, phoneWin);

    setTimeout(() => {
      if (loaded === 0) {
        webWin?.classList.add('is-blocked');
        phoneWin?.classList.add('is-blocked');
      }
    }, 8000);
  }

  function init() {
    document
      .querySelectorAll('.case-frame[data-live-src], .case-frame[data-embed-src]')
      .forEach(buildPair);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
