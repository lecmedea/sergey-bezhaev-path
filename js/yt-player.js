/** Path video stage — YouTube embed player (Grillz-style chrome) */
(() => {
  'use strict';
  function open(id) {
    const stage = document.getElementById('ytStage');
    const frame = document.getElementById('ytStageFrame');
    if (!stage || !frame || !id) return;
    frame.innerHTML =
      '<iframe src="https://www.youtube-nocookie.com/embed/' +
      encodeURIComponent(id) +
      '?autoplay=1&rel=0" title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
    stage.hidden = false;
    stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function close() {
    const stage = document.getElementById('ytStage');
    const frame = document.getElementById('ytStageFrame');
    if (frame) frame.innerHTML = '';
    if (stage) stage.hidden = true;
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-yt-play]');
    if (btn) {
      e.preventDefault();
      open(btn.getAttribute('data-yt-play'));
    }
    if (e.target.id === 'ytStageClose') close();
  });
  window.PathYT = { open, close };
})();
