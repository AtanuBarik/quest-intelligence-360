(() => {
  'use strict';

  document.addEventListener('click', event => {
    if (!event.target.closest?.('#floHomeRefresh')) return;
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('quest:layout-refresh', {
        detail: { group: 'governance', reason: 'executive-home-refresh-complete' },
      }));
    }, 1500);
  }, true);
})();
