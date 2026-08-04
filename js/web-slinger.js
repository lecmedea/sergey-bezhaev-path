(function () {
  'use strict';

  if (window.__webSlingerMounted) return;
  window.__webSlingerMounted = true;

  const script = document.currentScript;
  const brand = script?.dataset.brand || 'path';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ns = 'http://www.w3.org/2000/svg';
  let timer = 0;
  let active = false;
  let runId = 0;

  const style = document.createElement('style');
  style.textContent = `
    .web-slinger{--ws-red:${brand === 'path' ? '#ef3b46' : '#d93038'};--ws-dark:${brand === 'path' ? '#12080a' : '#170506'};position:fixed;inset:0;z-index:2147482000;pointer-events:none;contain:layout style}
    .web-slinger__canvas{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
    .web-slinger__line{fill:none;stroke:rgba(255,255,255,.96);stroke-width:2.2;stroke-linecap:round;filter:drop-shadow(0 0 3px rgba(255,255,255,.55));vector-effect:non-scaling-stroke}
    .web-slinger__thread{fill:none;stroke:rgba(255,255,255,.64);stroke-width:1;stroke-linecap:round;vector-effect:non-scaling-stroke}
    .web-slinger__button{position:absolute;left:50%;bottom:max(18px,env(safe-area-inset-bottom));width:58px;height:58px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.32);border-radius:50%;background:radial-gradient(circle at 36% 28%,#ff7278 0 8%,var(--ws-red) 35%,#9f151d 100%);color:#fff;box-shadow:0 10px 28px rgba(0,0,0,.38),0 0 0 1px rgba(0,0,0,.22) inset;transform:translateX(-50%);cursor:pointer;pointer-events:auto;-webkit-tap-highlight-color:transparent;transition:transform 180ms cubic-bezier(.2,.8,.2,1),box-shadow 180ms ease,background 180ms ease}
    .web-slinger__button:hover{transform:translateX(-50%) translateY(-3px) scale(1.04);box-shadow:0 14px 34px rgba(0,0,0,.42),0 0 20px color-mix(in srgb,var(--ws-red) 42%,transparent)}
    .web-slinger__button:active{transform:translateX(-50%) scale(.94)}
    .web-slinger__button:focus-visible{outline:3px solid #fff;outline-offset:4px}
    .web-slinger__button svg{width:30px;height:30px;overflow:visible}
    .web-slinger__button.is-active{background:linear-gradient(145deg,#ff5b63,#cc2029);animation:web-slinger-pulse 720ms ease-in-out infinite alternate}
    .web-slinger__button.is-active .web-slinger__web{display:none}
    .web-slinger__button:not(.is-active) .web-slinger__close{display:none}
    .web-slinger__hero{position:absolute;left:0;top:0;width:76px;height:112px;color:var(--ws-red);filter:drop-shadow(0 10px 12px rgba(0,0,0,.48));opacity:0;transform-origin:50% 8%;will-change:transform,opacity}
    .web-slinger__hero-eye{fill:#fff;stroke:#151515;stroke-width:1.2}
    .web-slinger__hero-web{fill:none;stroke:rgba(255,255,255,.8);stroke-width:.8}
    .web-slinger.is-firing .web-slinger__line{animation:web-slinger-draw 360ms cubic-bezier(.16,.78,.25,1) both}
    .web-slinger.is-firing .web-slinger__thread{animation:web-slinger-fade 950ms ease 250ms both}
    .web-slinger.is-firing .web-slinger__button{animation:web-slinger-tug 520ms cubic-bezier(.22,.75,.24,1) 260ms both}
    .web-slinger.is-firing .web-slinger__hero{animation:web-slinger-fly 1250ms cubic-bezier(.2,.72,.25,1) 150ms both}
    body.web-slinger-shaking>:not(.web-slinger):not(script):not(style){animation:web-slinger-shake 70ms steps(2,end) 8 alternate;will-change:transform}
    @keyframes web-slinger-draw{from{stroke-dashoffset:var(--ws-length)}to{stroke-dashoffset:0}}
    @keyframes web-slinger-fade{0%,55%{opacity:1}100%{opacity:0}}
    @keyframes web-slinger-tug{0%{transform:translateX(-50%) rotate(0)}38%{transform:translateX(calc(-50% + var(--ws-pull-x))) translateY(var(--ws-pull-y)) rotate(var(--ws-tilt))}100%{transform:translateX(-50%) rotate(0)}}
    @keyframes web-slinger-pulse{to{box-shadow:0 12px 32px rgba(0,0,0,.42),0 0 24px rgba(239,59,70,.55)}}
    @keyframes web-slinger-fly{0%{opacity:0;transform:translate3d(var(--ws-hero-start-x),var(--ws-hero-start-y),0) rotate(var(--ws-hero-start-r)) scale(.72)}12%{opacity:1}52%{transform:translate3d(var(--ws-hero-mid-x),var(--ws-hero-mid-y),0) rotate(var(--ws-hero-mid-r)) scale(1)}88%{opacity:1}100%{opacity:0;transform:translate3d(var(--ws-hero-end-x),var(--ws-hero-end-y),0) rotate(var(--ws-hero-end-r)) scale(.78)}}
    @keyframes web-slinger-shake{0%{transform:translate3d(-2px,1px,0) rotate(-.08deg)}33%{transform:translate3d(2px,-1px,0) rotate(.08deg)}66%{transform:translate3d(-1px,-2px,0)}100%{transform:translate3d(1px,2px,0)}}
    @media(max-width:640px){.web-slinger__button{width:54px;height:54px;bottom:max(14px,env(safe-area-inset-bottom))}.web-slinger__button svg{width:27px;height:27px}}
    @media(prefers-reduced-motion:reduce){.web-slinger *{animation-duration:1ms!important;animation-iteration-count:1!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.className = 'web-slinger';
  root.dataset.brand = brand;
  root.innerHTML = `
    <svg class="web-slinger__canvas" aria-hidden="true"></svg>
    <svg class="web-slinger__hero" viewBox="0 0 76 112" aria-hidden="true">
      <path fill="currentColor" d="M38 4c-12 0-20 8-20 20 0 9 5 16 12 19l-5 13-14 13 7 8 14-10 1 16-9 24h12l4-18 5 18h12L48 82l-1-16 13 11 7-8-15-14-6-12c7-3 12-10 12-19C58 12 50 4 38 4Z"/>
      <path class="web-slinger__hero-eye" d="m23 22 11 4-9 8c-3-3-4-7-2-12Zm30 0-11 4 9 8c3-3 4-7 2-12Z"/>
      <path class="web-slinger__hero-web" d="M38 5v37M20 18l36 13M20 32l36-14M24 12c8 7 20 7 28 0M19 25c10 7 28 7 38 0M30 43l16 0M29 56l18 0M33 66l14 0"/>
    </svg>
    <button class="web-slinger__button" type="button" aria-label="Выпустить паутину" title="Выпустить паутину">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <g class="web-slinger__web" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 3v26M3 16h26M6.8 6.8l18.4 18.4M25.2 6.8 6.8 25.2"/>
          <path d="M16 8.2c4.3 0 7.8 3.5 7.8 7.8s-3.5 7.8-7.8 7.8S8.2 20.3 8.2 16 11.7 8.2 16 8.2Z"/>
          <path d="M16 12.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6Z"/>
        </g>
        <g class="web-slinger__close" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m10 10 12 12M22 10 10 22"/></g>
      </svg>
    </button>`;
  document.body.appendChild(root);

  const canvas = root.querySelector('.web-slinger__canvas');
  const button = root.querySelector('.web-slinger__button');

  function updateButtonOffset() {
    const consent = document.querySelector('.cookie-consent:not([hidden])');
    const offset = consent ? Math.ceil(consent.getBoundingClientRect().height + 34) : 0;
    button.style.marginBottom = offset ? `${offset}px` : '';
  }

  updateButtonOffset();
  document.addEventListener('DOMContentLoaded', updateButtonOffset, { once: true });
  document.addEventListener('click', (event) => {
    if (event.target.closest?.('[data-cookie-choice]')) window.setTimeout(updateButtonOffset, 0);
  });
  window.addEventListener('resize', updateButtonOffset, { passive: true });
  const consent = document.querySelector('.cookie-consent');
  if (consent) new MutationObserver(updateButtonOffset).observe(consent, { attributes: true, attributeFilter: ['hidden'] });

  function clear() {
    runId += 1;
    window.clearTimeout(timer);
    timer = 0;
    active = false;
    root.classList.remove('is-firing');
    button.classList.remove('is-active');
    button.setAttribute('aria-label', 'Выпустить паутину');
    button.title = 'Выпустить паутину';
    canvas.replaceChildren();
    document.body.classList.remove('web-slinger-shaking');
  }

  function pathNode(className, d, length) {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('class', className);
    path.setAttribute('d', d);
    if (length) {
      path.style.setProperty('--ws-length', length);
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
    }
    canvas.appendChild(path);
    return path;
  }

  function fire() {
    if (active) {
      clear();
      return;
    }

    active = true;
    const thisRun = ++runId;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const startX = width / 2;
    const startY = height - (width <= 640 ? 41 : 47);
    const side = Math.floor(Math.random() * 5);
    let endX;
    let endY;
    if (side === 0) { endX = width * (.08 + Math.random() * .24); endY = -12; }
    else if (side === 1) { endX = width * (.68 + Math.random() * .24); endY = -12; }
    else if (side === 2) { endX = -12; endY = height * (.08 + Math.random() * .36); }
    else if (side === 3) { endX = width + 12; endY = height * (.08 + Math.random() * .36); }
    else { endX = width * (.18 + Math.random() * .64); endY = -12; }

    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.ceil(Math.hypot(dx, dy) * 1.08);
    const bend = Math.max(-90, Math.min(90, dx * .12));
    const controlX = startX + dx * .47 - bend;
    const controlY = startY + dy * .48;
    const d = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;

    canvas.setAttribute('viewBox', `0 0 ${width} ${height}`);
    pathNode('web-slinger__line', d, length);
    for (let i = -1; i <= 1; i += 2) {
      const spread = 9 + Math.random() * 8;
      pathNode('web-slinger__thread', `M ${startX + i * 4} ${startY} Q ${controlX + i * spread} ${controlY} ${endX + i * 5} ${endY}`);
    }

    const pullX = Math.max(-18, Math.min(18, dx * .025));
    const pullY = Math.max(-14, Math.min(-5, dy * .015));
    root.style.setProperty('--ws-pull-x', `${pullX}px`);
    root.style.setProperty('--ws-pull-y', `${pullY}px`);
    root.style.setProperty('--ws-tilt', `${Math.max(-7, Math.min(7, dx / width * 9))}deg`);
    const heroFromLeft = Math.random() > .5;
    const heroY = Math.max(92, Math.min(height * .54, 430));
    root.style.setProperty('--ws-hero-start-x', `${heroFromLeft ? -100 : width + 24}px`);
    root.style.setProperty('--ws-hero-start-y', `${heroY}px`);
    root.style.setProperty('--ws-hero-mid-x', `${width * .5 - 38}px`);
    root.style.setProperty('--ws-hero-mid-y', `${Math.max(36, heroY - Math.min(170, height * .24))}px`);
    root.style.setProperty('--ws-hero-end-x', `${heroFromLeft ? width + 24 : -100}px`);
    root.style.setProperty('--ws-hero-end-y', `${Math.max(70, heroY - 30)}px`);
    root.style.setProperty('--ws-hero-start-r', heroFromLeft ? '-24deg' : '24deg');
    root.style.setProperty('--ws-hero-mid-r', heroFromLeft ? '12deg' : '-12deg');
    root.style.setProperty('--ws-hero-end-r', heroFromLeft ? '28deg' : '-28deg');
    button.classList.add('is-active');
    button.setAttribute('aria-label', 'Остановить паутину');
    button.title = 'Остановить паутину';
    root.classList.remove('is-firing');
    void root.offsetWidth;
    root.classList.add('is-firing');
    if (!reducedMotion.matches) {
      window.setTimeout(() => { if (runId === thisRun) document.body.classList.add('web-slinger-shaking'); }, 430);
      window.setTimeout(() => { if (runId === thisRun) document.body.classList.remove('web-slinger-shaking'); }, 1080);
    }

    timer = window.setTimeout(clear, reducedMotion.matches ? 160 : 1650);
  }

  button.addEventListener('click', fire);
  window.addEventListener('pagehide', clear, { once: true });
  window.WebSlinger = { fire, clear };
})();
