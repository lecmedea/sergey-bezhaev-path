/** Start the existing assistants as soon as the page is ready. */
(() => {
  'use strict';

  function ready() {
    // Keep the existing event contract for assistants and their dock.
    document.dispatchEvent(new CustomEvent('path-boot-complete', { bubbles: true }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
