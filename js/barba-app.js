/**
 * Barba.js + GSAP page transitions (fade).
 * Also exposes PathStoryReveal for boot → main cosmic handoff.
 * https://github.com/barbajs/barba
 */
(() => {
  'use strict';

  const gsap = window.gsap;
  const barba = window.barba;

  /** Stagger-in main UI after cosmic zoom — one continuous story */
  function prepareStoryReveal(shell) {
    if (!gsap || !shell) return [];
    const origin = document.getElementById('bay-0');
    const sels = [
      '.mac-bar',
      '.deck',
      '.site-credit',
      '#bay-0 .eyebrow',
      '#bay-0 h1 .h1-line',
      '#bay-0 h1 .h1-sub',
      '#bay-0 .lead',
      '#bay-0 .trend-row',
      '#bay-0 .hero-cta',
      '#bay-0 .hint-scroll',
      '#bay-0 .hero-mesh',
      '#bay-0 .hero-visual',
      '#bay-0 .hero-visual figcaption'
    ];
    const nodes = [];
    sels.forEach((s) => {
      shell.querySelectorAll(s).forEach((el) => {
        if (!nodes.includes(el)) nodes.push(el);
      });
    });
    // also any remaining direct children of hero-depth
    origin?.querySelectorAll('.hero-depth > *').forEach((el) => {
      if (!nodes.includes(el)) nodes.push(el);
    });
    gsap.set(nodes, {
      opacity: 0,
      y: 36,
      filter: 'blur(14px)',
      scale: 0.97,
      transformOrigin: '50% 60%'
    });
    return nodes;
  }

  function playStoryReveal(nodes, delay) {
    if (!gsap || !nodes || !nodes.length) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      gsap.to(nodes, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        scale: 1,
        duration: 0.9,
        stagger: 0.11,
        ease: 'power3.out',
        delay: delay != null ? delay : 0.75,
        onComplete: resolve
      });
    });
  }

  function initBarba() {
    if (!barba || !gsap) return;
    // Only intercept real multipage navigations (jarvis/, external subpaths)
    try {
      barba.init({
        preventRunning: true,
        transitions: [
          {
            name: 'fade-transition',
            leave(data) {
              return gsap.to(data.current.container, {
                opacity: 0,
                duration: 0.5,
                ease: 'power2.inOut'
              });
            },
            enter(data) {
              return gsap.from(data.next.container, {
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out'
              });
            }
          }
        ]
      });
    } catch (e) {
      console.warn('barba init', e);
    }
  }

  window.PathStoryReveal = { prepareStoryReveal, playStoryReveal };
  window.PathBarba = { init: initBarba };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBarba);
  } else {
    initBarba();
  }
})();
