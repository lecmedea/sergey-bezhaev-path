/* Shared line icons and scarlet metal type. No third-party runtime. */
(() => {
  const paths = {
    home: '<path d="m3 10 9-7 9 7v11H3zM9 21v-8h6v8"/>',
    profile: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',
    layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
    medical: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    gem: '<path d="m3 8 4-5h10l4 5-9 13zM3 8h18M7 3l5 18 5-18"/>',
    cable: '<path d="M7 3v4m4-4v4M5 7h8v3a4 4 0 0 1-4 4v3a4 4 0 0 0 8 0v-4m-2 0h4"/>',
    recycle: '<path d="m8 5 4-3 4 7M16 4v5h-5m9 4 2 5h-8m5 3-5-3 3-4M8 21H3l4-7M2 13l5 1 2 4"/>',
    code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
    people: '<circle cx="8" cy="8" r="3"/><path d="M2 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 4 5"/>',
    play: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 8 6 4-6 4z"/>',
    steps: '<path d="M3 21v-6h6V9h6V3h6M3 3l18 18"/>',
    menu: '<path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01"/>',
    music: '<path d="M9 18V5l12-2v13M9 8l12-2"/><ellipse cx="5.5" cy="18" rx="3.5" ry="3"/><ellipse cx="17.5" cy="16" rx="3.5" ry="3"/>',
    mic: '<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
    pen: '<path d="m4 15 11-11 5 5L9 20l-6 1zM13 6l5 5"/>',
    sliders: '<path d="M5 3v10m0 4v4M12 3v4m0 4v10M19 3v12m0 4v2M2 13h6m1-6h6m1 8h6"/>',
    document: '<path d="M5 3h10l4 4v14H5zM15 3v5h4M8 12h8m-8 4h8"/>',
    contact: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>'
  };
  const icon = (name) => `<svg class="neon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.spark}</svg>`;
  window.PathIcon = icon;
  const defaults = ['home','profile','layout','medical','gem','layout','cable','medical','recycle','code','spark','people','spark','play','steps','menu','music','document','contact'];
  document.querySelectorAll('.bay').forEach((bay, i) => {
    bay.dataset.icon ||= defaults[i] || 'spark';
    const heading = bay.querySelector('h1,h2');
    if (heading) heading.insertAdjacentHTML('beforebegin', `<span class="section-icon">${icon(bay.dataset.icon)}</span>`);
  });
  document.querySelectorAll('[data-icon]:not(.bay)').forEach(el => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));
  document.querySelectorAll('.mod,.rail-card,.stages-project,.menu-item,.legal-card,.bb-card').forEach(el => {
    if (!el.querySelector(':scope > .neon-icon')) el.insertAdjacentHTML('afterbegin', icon(el.closest('.bay')?.dataset.icon));
  });
  document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading => {
    const project = heading.hasAttribute('data-project-title');
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = []; let node;
    while ((node = walker.nextNode())) nodes.push(node);
    const text = nodes.map(n => n.textContent).join('');
    const match = text.match(project ? /\S/u : /^\s*(?:\S{1,3}\s+)?\S+/u);
    if (!match) return;
    const start = project ? match.index : text.search(/\S/u);
    const end = match.index + match[0].length;
    const range = document.createRange(); let offset = 0;
    for (const n of nodes) {
      if (start >= offset && start < offset + n.length) range.setStart(n, start - offset);
      if (end > offset && end <= offset + n.length) { range.setEnd(n, end - offset); break; }
      offset += n.length;
    }
    const span = document.createElement('span'); span.className = 'scarlet-metal';
    span.append(range.extractContents()); range.insertNode(span);
  });
})();
