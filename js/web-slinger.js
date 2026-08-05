(function () {
  'use strict';

  if (window.__webSlingerMounted) return;
  window.__webSlingerMounted = true;

  const script = document.currentScript;
  const brand = script?.dataset.brand || (script?.src.includes('/js/') ? 'path' : 'grillz');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ns = 'http://www.w3.org/2000/svg';
  const assetRoot = new URL(brand === 'path' ? '../assets/web-slinger/' : 'web-slinger/', script.src);
  const frames = Array.from({ length: 9 }, (_, index) => new URL(`spider-frame-${String(index + 1).padStart(2, '0')}.png`, assetRoot).href);
  const poseSequences = [[0, 1, 2, 5, 8, 6, 3], [7, 6, 3, 0, 2, 8, 1], [8, 2, 5, 1, 6, 0, 3]];
  const pending = new Set();
  const hitElements = new Set();
  let timer = 0;
  let active = false;
  let runId = 0;

  [...new Set(poseSequences.flat())].forEach((index) => { const image = new Image(); image.src = frames[index]; });

  const style = document.createElement('style');
  style.textContent = `
    .web-slinger{--ws-red:${brand === 'path' ? '#ef3b46' : '#d93038'};position:fixed;inset:0;z-index:2147482000;pointer-events:none;contain:layout style}
    .web-slinger__canvas{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
    .web-slinger__line{fill:none;stroke:rgba(255,255,255,.96);stroke-width:2.2;stroke-linecap:round;filter:drop-shadow(0 0 3px rgba(255,255,255,.55));vector-effect:non-scaling-stroke}
    .web-slinger__thread{fill:none;stroke:rgba(255,255,255,.62);stroke-width:1;stroke-linecap:round;vector-effect:non-scaling-stroke}
    .web-slinger__button{position:absolute;left:50%;bottom:max(18px,env(safe-area-inset-bottom));width:58px;height:58px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.32);border-radius:50%;background:radial-gradient(circle at 36% 28%,#ff7278 0 8%,var(--ws-red) 35%,#9f151d 100%);color:#fff;box-shadow:0 10px 28px rgba(0,0,0,.38),0 0 0 1px rgba(0,0,0,.22) inset;transform:translateX(-50%);cursor:pointer;pointer-events:auto;-webkit-tap-highlight-color:transparent;transition:transform 180ms cubic-bezier(.2,.8,.2,1),box-shadow 180ms ease}
    .web-slinger__button:hover{transform:translateX(-50%) translateY(-3px) scale(1.04);box-shadow:0 14px 34px rgba(0,0,0,.42),0 0 20px color-mix(in srgb,var(--ws-red) 42%,transparent)}
    .web-slinger__button:active{transform:translateX(-50%) scale(.94)}
    .web-slinger__button:focus-visible{outline:3px solid #fff;outline-offset:4px}
    .web-slinger__button svg{width:30px;height:30px;overflow:visible}
    .web-slinger__button.is-active{animation:web-slinger-pulse 720ms ease-in-out infinite alternate}
    .web-slinger__button.is-active .web-slinger__web{display:none}
    .web-slinger__button:not(.is-active) .web-slinger__close{display:none}
    .web-slinger__hero{position:absolute;left:0;top:0;width:clamp(190px,22vw,330px);aspect-ratio:1;opacity:0;transform-origin:center;filter:drop-shadow(0 18px 18px rgba(0,0,0,.42));will-change:transform,opacity}
    .web-slinger__hero img{display:block;width:100%;height:100%;object-fit:contain;user-select:none}
    .web-slinger.is-firing .web-slinger__line{animation:web-slinger-draw 380ms cubic-bezier(.16,.78,.25,1) both}
    .web-slinger.is-firing .web-slinger__thread{animation:web-slinger-fade 1350ms ease 180ms both}
    .web-slinger.is-firing .web-slinger__button{animation:web-slinger-tug 560ms cubic-bezier(.22,.75,.24,1) 220ms both}
    .web-slinger.is-firing .web-slinger__hero--1{animation:web-slinger-fly-one 3300ms cubic-bezier(.2,.66,.25,1) 120ms both}
    .web-slinger.is-firing .web-slinger__hero--2{animation:web-slinger-fly-two 3500ms cubic-bezier(.18,.7,.24,1) 310ms both}
    .web-slinger.is-firing .web-slinger__hero--3{animation:web-slinger-fly-three 3350ms cubic-bezier(.2,.68,.24,1) 520ms both}
    .web-slinger-hit{animation:web-slinger-spin 820ms cubic-bezier(.42,0,.2,1) both!important;transform-origin:center center!important;backface-visibility:hidden;will-change:rotate}
    @keyframes web-slinger-draw{from{stroke-dashoffset:var(--ws-length)}to{stroke-dashoffset:0}}
    @keyframes web-slinger-fade{0%,58%{opacity:1}100%{opacity:0}}
    @keyframes web-slinger-tug{0%{transform:translateX(-50%) rotate(0)}38%{transform:translateX(calc(-50% + var(--ws-pull-x))) translateY(var(--ws-pull-y)) rotate(var(--ws-tilt))}100%{transform:translateX(-50%) rotate(0)}}
    @keyframes web-slinger-pulse{to{box-shadow:0 12px 32px rgba(0,0,0,.42),0 0 24px rgba(239,59,70,.55)}}
    @keyframes web-slinger-spin{0%{rotate:0deg}46%{rotate:205deg}100%{rotate:360deg}}
    @keyframes web-slinger-fly-one{0%{opacity:0;transform:translate3d(-38vw,62vh,0) rotate(-28deg) scale(.68)}8%{opacity:1}36%{transform:translate3d(18vw,18vh,0) rotate(18deg) scale(.96)}67%{transform:translate3d(58vw,44vh,0) rotate(395deg) scale(1.05)}91%{opacity:1}100%{opacity:0;transform:translate3d(112vw,8vh,0) rotate(440deg) scale(.72)}}
    @keyframes web-slinger-fly-two{0%{opacity:0;transform:translate3d(112vw,10vh,0) rotate(22deg) scale(.64)}9%{opacity:1}39%{transform:translate3d(58vw,27vh,0) rotate(-28deg) scale(.92)}68%{transform:translate3d(17vw,54vh,0) rotate(-378deg) scale(1.04)}91%{opacity:1}100%{opacity:0;transform:translate3d(-38vw,30vh,0) rotate(-420deg) scale(.7)}}
    @keyframes web-slinger-fly-three{0%{opacity:0;transform:translate3d(16vw,112vh,0) rotate(-70deg) scale(.62)}9%{opacity:1}38%{transform:translate3d(34vw,60vh,0) rotate(25deg) scale(.9)}69%{transform:translate3d(64vw,20vh,0) rotate(385deg) scale(1)}91%{opacity:1}100%{opacity:0;transform:translate3d(86vw,-42vh,0) rotate(460deg) scale(.68)}}
    @media(max-width:640px){.web-slinger__button{width:54px;height:54px;bottom:max(14px,env(safe-area-inset-bottom))}.web-slinger__button svg{width:27px;height:27px}.web-slinger__hero{width:clamp(145px,43vw,210px)}}
    @media(prefers-reduced-motion:reduce){.web-slinger__hero{display:none}.web-slinger-hit{animation:none!important}.web-slinger *{animation-duration:1ms!important;animation-iteration-count:1!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.className = 'web-slinger';
  root.innerHTML = `
    <svg class="web-slinger__canvas" aria-hidden="true"></svg>
    ${[1, 2, 3].map((number) => `<div class="web-slinger__hero web-slinger__hero--${number}" aria-hidden="true"><img alt="" draggable="false"></div>`).join('')}
    <button class="web-slinger__button" type="button" aria-label="Выпустить паутину" title="Выпустить паутину">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <g class="web-slinger__web" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"><path d="M16 3v26M3 16h26M6.8 6.8l18.4 18.4M25.2 6.8 6.8 25.2"/><path d="M16 8.2a7.8 7.8 0 1 1 0 15.6 7.8 7.8 0 0 1 0-15.6Z"/><path d="M16 12.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6Z"/></g>
        <g class="web-slinger__close" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m10 10 12 12M22 10 10 22"/></g>
      </svg>
    </button>`;
  document.body.appendChild(root);

  const canvas = root.querySelector('.web-slinger__canvas');
  const button = root.querySelector('.web-slinger__button');
  const heroImages = [...root.querySelectorAll('.web-slinger__hero img')];
  heroImages.forEach((image, index) => { image.src = frames[poseSequences[index][0]]; });

  function later(callback, delay) {
    const id = window.setTimeout(() => { pending.delete(id); callback(); }, delay);
    pending.add(id);
  }

  function updateButtonOffset() {
    const consent = document.querySelector('.cookie-consent:not([hidden])');
    const offset = consent ? Math.ceil(consent.getBoundingClientRect().height + 34) : 0;
    button.style.marginBottom = offset ? `${offset}px` : '';
  }

  updateButtonOffset();
  document.addEventListener('DOMContentLoaded', updateButtonOffset, { once: true });
  document.addEventListener('click', (event) => {
    if (event.target.closest?.('[data-cookie-choice]')) later(updateButtonOffset, 0);
  });
  window.addEventListener('resize', updateButtonOffset, { passive: true });
  const consent = document.querySelector('.cookie-consent');
  if (consent) new MutationObserver(updateButtonOffset).observe(consent, { attributes: true, attributeFilter: ['hidden'] });

  function clear() {
    runId += 1;
    window.clearTimeout(timer);
    pending.forEach(window.clearTimeout);
    pending.clear();
    hitElements.forEach((element) => element.classList.remove('web-slinger-hit'));
    hitElements.clear();
    active = false;
    root.classList.remove('is-firing');
    button.classList.remove('is-active');
    button.setAttribute('aria-label', 'Выпустить паутину');
    button.title = 'Выпустить паутину';
    canvas.replaceChildren();
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
  }

  function visibleTargets() {
    const isVisible = (element) => {
      if (element.closest('.web-slinger') || element.classList.contains('web-slinger-hit')) return false;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 90 && rect.height > 24 && rect.top < innerHeight - 40 && rect.bottom > 40 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const blocks = [...document.querySelectorAll('.stat,.trend,.card,.hero-card,.service-card,.path-card,.case,.bay__inner')].filter(isVisible);
    const text = [...document.querySelectorAll('h1,h2,h3,p')].filter(isVisible);
    const mixed = [];
    const count = Math.max(blocks.length, text.length);
    for (let index = 0; index < count; index += 1) {
      if (blocks[index]) mixed.push(blocks[index]);
      if (text[index] && !blocks.some((block) => block.contains(text[index]))) mixed.push(text[index]);
    }
    return mixed;
  }

  function spin(element, thisRun) {
    if (runId !== thisRun || !element.isConnected) return;
    element.classList.remove('web-slinger-hit');
    void element.offsetWidth;
    element.classList.add('web-slinger-hit');
    hitElements.add(element);
    later(() => {
      element.classList.remove('web-slinger-hit');
      hitElements.delete(element);
    }, 860);
  }

  function animatePoses(thisRun) {
    heroImages.forEach((image, heroIndex) => {
      const sequence = poseSequences[heroIndex];
      for (let step = 0; step < 14; step += 1) {
        later(() => {
          if (runId === thisRun) image.src = frames[sequence[step % sequence.length]];
        }, 180 + heroIndex * 180 + step * 215);
      }
    });
  }

  function fire() {
    if (active) { clear(); return; }
    active = true;
    const thisRun = ++runId;
    const width = innerWidth;
    const height = innerHeight;
    const startX = width / 2;
    const startY = height - (width <= 640 ? 41 : 47);
    const endX = width * (.2 + Math.random() * .6);
    const endY = -16;
    const length = Math.ceil(Math.hypot(endX - startX, endY - startY) * 1.08);
    const controlX = width * (.34 + Math.random() * .32);
    const controlY = height * .42;
    canvas.setAttribute('viewBox', `0 0 ${width} ${height}`);
    pathNode('web-slinger__line', `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`, length);
    pathNode('web-slinger__thread', `M ${startX - 5} ${startY} Q ${controlX - 14} ${controlY} ${endX - 6} ${endY}`);
    pathNode('web-slinger__thread', `M ${startX + 5} ${startY} Q ${controlX + 14} ${controlY} ${endX + 6} ${endY}`);

    root.style.setProperty('--ws-pull-x', `${Math.max(-18, Math.min(18, (endX - startX) * .025))}px`);
    root.style.setProperty('--ws-pull-y', '-11px');
    root.style.setProperty('--ws-tilt', `${Math.max(-7, Math.min(7, (endX - startX) / width * 9))}deg`);
    button.classList.add('is-active');
    button.setAttribute('aria-label', 'Остановить полёт');
    button.title = 'Остановить полёт';
    root.classList.remove('is-firing');
    void root.offsetWidth;
    root.classList.add('is-firing');

    if (!reducedMotion.matches) {
      animatePoses(thisRun);
      const targets = visibleTargets().sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      const schedule = [760, 1050, 1290, 1540, 1800, 2070, 2350, 2620, 2890];
      const selected = targets.length <= 9 ? targets : targets.filter((_, index) => index % Math.ceil(targets.length / 9) === 0).slice(0, 9);
      selected.forEach((element, index) => later(() => spin(element, thisRun), schedule[index]));
    }

    timer = window.setTimeout(clear, reducedMotion.matches ? 180 : 4200);
  }

  button.addEventListener('click', fire);
  window.addEventListener('pagehide', clear, { once: true });
  window.WebSlinger = { fire, clear };
})();
