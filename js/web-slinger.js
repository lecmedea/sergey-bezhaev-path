(function () {
  'use strict';

  if (window.__webSlingerMounted) return;
  window.__webSlingerMounted = true;

  const RUN_MS = 12000;
  const script = document.currentScript;
  const brand = script?.dataset.brand || 'path';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const assetRoot = new URL('../assets/web-slinger/', script.src);
  const frames = Array.from({ length: 9 }, (_, index) => new URL(`spider-frame-${String(index + 1).padStart(2, '0')}.png`, assetRoot).href);
  const sequences = [[0, 1, 2, 5, 8, 6, 3], [7, 6, 3, 0, 2, 8, 1], [8, 2, 5, 1, 6, 0, 3]];
  const pending = new Set();
  let active = false;
  let runId = 0;
  let audio = null;

  const style = document.createElement('style');
  style.textContent = `
    .web-slinger{--ws-red:${brand === 'path' ? '#ef3b46' : '#d93038'};position:fixed;inset:0;z-index:2147482000;pointer-events:none;contain:layout style paint}
    .web-slinger__canvas{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
    .web-slinger__web{fill:none;stroke:rgba(244,250,255,.92);stroke-width:2;stroke-linecap:round;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 3px rgba(180,225,255,.6));stroke-dasharray:7 4;opacity:0;transform-origin:var(--anchor)}
    .web-slinger__web::after{content:''}
    .web-slinger__drop{fill:#dff7ff;opacity:0;filter:drop-shadow(0 0 3px #fff)}
    .web-slinger__button{position:absolute;left:50%;bottom:max(18px,env(safe-area-inset-bottom));width:58px;height:58px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.32);border-radius:50%;background:radial-gradient(circle at 36% 28%,#ff7278 0 8%,var(--ws-red) 35%,#9f151d 100%);color:#fff;box-shadow:0 10px 28px rgba(0,0,0,.38),0 0 0 1px rgba(0,0,0,.22) inset;transform:translateX(-50%);cursor:pointer;pointer-events:auto;-webkit-tap-highlight-color:transparent;transition:transform 180ms cubic-bezier(.2,.8,.2,1),box-shadow 180ms ease}
    .web-slinger__button:hover,.web-slinger__button:focus-visible{transform:translateX(-50%) translateY(-3px) scale(1.04);box-shadow:0 14px 34px rgba(0,0,0,.42),0 0 20px rgba(239,59,70,.52)}
    .web-slinger__button:active{transform:translateX(-50%) scale(.94)}
    .web-slinger__button:focus-visible{outline:3px solid #fff;outline-offset:4px}
    .web-slinger__button svg{width:30px;height:30px}.web-slinger__button.is-active{animation:ws-pulse 720ms ease-in-out infinite alternate}
    .web-slinger__button.is-active .ws-icon-web,.web-slinger__button:not(.is-active) .ws-icon-stop{display:none}
    .web-slinger__hero{position:absolute;left:0;top:0;width:clamp(150px,18vw,280px);aspect-ratio:1;opacity:0;filter:drop-shadow(0 18px 18px rgba(0,0,0,.42));will-change:transform,opacity}
    .web-slinger__hero img{display:block;width:100%;height:100%;object-fit:contain;user-select:none}
    .web-slinger.is-firing .web-slinger__hero--1{animation:ws-flight-one 12s linear both}
    .web-slinger.is-firing .web-slinger__hero--2{animation:ws-flight-two 12s linear both}
    .web-slinger.is-firing .web-slinger__hero--3{animation:ws-flight-three 12s linear both}
    .web-slinger.is-firing .web-slinger__web{animation:ws-thread 4s ease-in-out var(--delay) both}
    .web-slinger.is-firing .web-slinger__drop{animation:ws-drop 1.8s ease-out var(--drop-delay) both}
    @keyframes ws-pulse{to{box-shadow:0 12px 32px rgba(0,0,0,.42),0 0 24px rgba(239,59,70,.55)}}
    @keyframes ws-thread{0%{opacity:0;stroke-dashoffset:80}10%,58%{opacity:1;stroke-dashoffset:0;transform:rotate(0deg)}66%{opacity:.9;transform:rotate(1.8deg)}76%{opacity:.75;transform:rotate(-2.1deg)}88%{opacity:.45;stroke-dasharray:2 7;transform:rotate(1deg)}100%{opacity:0;stroke-dasharray:1 12;stroke-dashoffset:-38}}
    @keyframes ws-drop{0%,55%{opacity:0;transform:translateY(0) scale(.2)}62%{opacity:.85}100%{opacity:0;transform:translateY(34px) scale(1)}}
    @keyframes ws-flight-one{0%{opacity:0;transform:translate3d(-24vw,68vh,0) rotate(-24deg) scale(.65)}4%{opacity:1}18%{transform:translate3d(22vw,14vh,0) rotate(18deg) scale(.95)}34%{transform:translate3d(73vw,44vh,0) rotate(210deg) scale(1.05)}50%{transform:translate3d(44vw,5vh,0) rotate(350deg) scale(.82)}68%{transform:translate3d(8vw,48vh,0) rotate(535deg) scale(1.02)}84%{transform:translate3d(58vw,22vh,0) rotate(690deg) scale(.9)}96%{opacity:1}100%{opacity:0;transform:translate3d(110vw,4vh,0) rotate(760deg) scale(.7)}}
    @keyframes ws-flight-two{0%{opacity:0;transform:translate3d(105vw,8vh,0) rotate(22deg) scale(.62)}5%{opacity:1}20%{transform:translate3d(58vw,32vh,0) rotate(-155deg) scale(.98)}36%{transform:translate3d(8vw,10vh,0) rotate(-310deg) scale(.8)}52%{transform:translate3d(32vw,58vh,0) rotate(-470deg) scale(1.06)}70%{transform:translate3d(78vw,16vh,0) rotate(-620deg) scale(.86)}86%{transform:translate3d(38vw,38vh,0) rotate(-780deg) scale(1)}96%{opacity:1}100%{opacity:0;transform:translate3d(-28vw,22vh,0) rotate(-850deg) scale(.66)}}
    @keyframes ws-flight-three{0%{opacity:0;transform:translate3d(12vw,108vh,0) rotate(-65deg) scale(.6)}6%{opacity:1}22%{transform:translate3d(36vw,42vh,0) rotate(120deg) scale(.92)}38%{transform:translate3d(72vw,8vh,0) rotate(275deg) scale(.78)}54%{transform:translate3d(62vw,62vh,0) rotate(440deg) scale(1.08)}72%{transform:translate3d(18vw,24vh,0) rotate(590deg) scale(.84)}88%{transform:translate3d(66vw,42vh,0) rotate(745deg) scale(1)}96%{opacity:1}100%{opacity:0;transform:translate3d(88vw,-32vh,0) rotate(830deg) scale(.67)}}
    @media(max-width:640px){.web-slinger__button{width:54px;height:54px}.web-slinger__hero{width:clamp(125px,36vw,190px)}}
    @media(prefers-reduced-motion:reduce){.web-slinger__hero,.web-slinger__canvas{display:none}.web-slinger *{animation-duration:1ms!important;animation-iteration-count:1!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const webs = [
    ['M 7 4 Q 18 15 26 29', 0], ['M 93 3 Q 74 18 63 38', 600], ['M 48 1 Q 54 18 50 31', 1250],
    ['M 96 8 Q 68 28 53 55', 3400], ['M 4 6 Q 25 23 31 48', 4100], ['M 78 2 Q 72 26 70 53', 4850],
    ['M 3 28 Q 20 20 25 43', 7100], ['M 97 24 Q 74 18 67 43', 7750], ['M 45 1 Q 39 25 42 47', 8500]
  ];
  const root = document.createElement('div');
  root.className = 'web-slinger';
  root.innerHTML = `<svg class="web-slinger__canvas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${webs.map(([d, delay], i) => `<path class="web-slinger__web" d="${d}" style="--delay:${delay}ms;--anchor:${d.includes('M 9') ? '100% 0' : '0 0'}"/><circle class="web-slinger__drop" cx="${12 + (i * 11) % 78}" cy="${9 + (i * 17) % 42}" r=".34" style="--drop-delay:${delay + 2750}ms"/>`).join('')}</svg>${[1,2,3].map(n => `<div class="web-slinger__hero web-slinger__hero--${n}" aria-hidden="true"><img alt="" draggable="false"></div>`).join('')}<button class="web-slinger__button" type="button" aria-label="Вызвать Человеков-пауков на 12 секунд" title="Вызвать Человеков-пауков"><svg viewBox="0 0 32 32" aria-hidden="true"><g class="ws-icon-web" fill="none" stroke="currentColor" stroke-width="1.35"><path d="M16 3v26M3 16h26M6.8 6.8l18.4 18.4M25.2 6.8 6.8 25.2"/><circle cx="16" cy="16" r="8"/><circle cx="16" cy="16" r="4"/></g><g class="ws-icon-stop" fill="none" stroke="currentColor" stroke-width="2"><path d="m10 10 12 12M22 10 10 22"/></g></svg></button>`;
  document.body.appendChild(root);
  const button = root.querySelector('button');
  const heroImages = [...root.querySelectorAll('.web-slinger__hero img')];

  function later(fn, delay) { const id = setTimeout(() => { pending.delete(id); fn(); }, delay); pending.add(id); }
  function stopAudio() { if (!audio) return; audio.pause(); audio.currentTime = 0; audio = null; }
  function clear() {
    runId += 1; active = false; pending.forEach(clearTimeout); pending.clear(); stopAudio();
    root.classList.remove('is-firing'); button.classList.remove('is-active');
    button.setAttribute('aria-label', 'Вызвать Человеков-пауков на 12 секунд');
  }
  function fire() {
    if (active) { clear(); return; }
    active = true; const thisRun = ++runId;
    button.classList.add('is-active'); button.setAttribute('aria-label', 'Остановить полёт');
    root.classList.remove('is-firing'); void root.offsetWidth; root.classList.add('is-firing');
    if (!reducedMotion.matches) {
      heroImages.forEach((image, index) => { image.src = frames[sequences[index][0]]; });
      audio = new Audio(new URL('../assets/audio/spider-man-8-bit.mp3', script.src));
      audio.volume = .78; audio.currentTime = 0; audio.play().catch(() => {});
      heroImages.forEach((image, hero) => { for (let step = 0; step < 55; step += 1) later(() => { if (runId === thisRun) image.src = frames[sequences[hero][step % sequences[hero].length]]; }, step * 215 + hero * 70); });
    }
    later(clear, reducedMotion.matches ? 180 : RUN_MS);
  }
  button.addEventListener('click', fire);
  window.addEventListener('pagehide', clear, { once: true });
  window.WebSlinger = { fire, clear };
})();
