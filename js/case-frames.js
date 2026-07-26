/**
 * Dual live browsers: desktop (wide viewport) + iPhone mobile frame.
 * Uses data-embed-src when production blocks framing.
 */
(() => {
  'use strict';

  function buildDual(frame) {
    if (frame.dataset.dualBuilt === '1') return;
    const shot = frame.querySelector('.case-frame__shot');
    if (!shot) return;
    const publicUrl = frame.getAttribute('data-live-src') || '';
    const embed =
      frame.getAttribute('data-embed-src') ||
      publicUrl ||
      shot.querySelector('iframe')?.getAttribute('src') ||
      '';
    const fallback = shot.querySelector('.case-frame__fallback, img');
    const title = frame.querySelector('em')?.textContent || 'Project';

    frame.dataset.dualBuilt = '1';
    frame.classList.add('case-frame--dual');

    shot.innerHTML = `
      <div class="case-dual">
        <div class="case-desktop">
          <div class="case-desktop__label">Web</div>
          <div class="case-desktop__viewport">
            <iframe class="case-frame__iframe case-frame__iframe--desk" title="${title} desktop"
              src="${embed}" loading="lazy" referrerpolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
          </div>
        </div>
        <div class="case-phone">
          <div class="case-phone__bezel">
            <div class="case-phone__notch" aria-hidden="true"></div>
            <div class="case-phone__screen">
              <iframe class="case-frame__iframe case-frame__iframe--mob" title="${title} mobile"
                src="${embed}" loading="lazy" referrerpolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
            </div>
          </div>
          <div class="case-phone__label">iPhone</div>
        </div>
      </div>
    `;
    if (fallback && fallback.tagName === 'IMG') {
      const img = fallback.cloneNode(true);
      img.className = 'case-frame__fallback';
      shot.appendChild(img);
    }

    // desktop force wide layout via large iframe scaled down
    const desk = shot.querySelector('.case-frame__iframe--desk');
    const mob = shot.querySelector('.case-frame__iframe--mob');
    const deskVP = shot.querySelector('.case-desktop__viewport');
    const mobScreen = shot.querySelector('.case-phone__screen');
    function scaleIframes() {
      if (desk && deskVP) {
        desk.style.width = '1440px';
        desk.style.height = '900px';
        const s = deskVP.clientWidth / 1440;
        desk.style.transform = 'scale(' + s + ')';
        deskVP.style.height = 900 * s + 'px';
      }
      if (mob && mobScreen) {
        mob.style.width = '390px';
        mob.style.height = '844px';
        const s2 = mobScreen.clientWidth / 390;
        mob.style.transform = 'scale(' + s2 + ')';
      }
    }
    scaleIframes();
    addEventListener('resize', scaleIframes, { passive: true });
    setTimeout(scaleIframes, 200);

    let loaded = 0;
    const lock = frame.querySelector('.case-lock');
    const mark = () => {
      loaded++;
      if (loaded >= 1 && lock) lock.textContent = 'live';
    };
    desk?.addEventListener('load', mark);
    mob?.addEventListener('load', mark);
    setTimeout(() => {
      if (loaded === 0) {
        frame.classList.add('is-blocked');
        if (lock) lock.textContent = 'preview';
      }
    }, 7000);
  }

  function init() {
    document.querySelectorAll('.case-frame[data-live-src], .case-frame[data-embed-src]').forEach(buildDual);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
