(() => {
  'use strict';

  function dispatch(reason) {
    window.dispatchEvent(new CustomEvent('quest:layout-refresh', {
      detail: { group: 'governance', reason },
    }));
  }

  document.addEventListener('click', event => {
    if (!event.target.closest?.('#floHomeRefresh')) return;
    window.setTimeout(() => dispatch('executive-home-refresh-complete'), 1500);
  }, true);

  // The Executive Hub is layered after the base dashboard modules. These
  // delayed layout events ensure the final executive refinements win any
  // asynchronous first-load render without introducing a broad DOM observer.
  window.setTimeout(() => dispatch('executive-refinements-settled'), 1800);
  window.setTimeout(() => dispatch('executive-refinements-final'), 3200);
})();
