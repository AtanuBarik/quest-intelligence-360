(() => {
  'use strict';

  const GUARD_ID = 'floLocalRepository';

  function installGuard() {
    const view = document.querySelector('.view[data-view="library"]');
    if (!view) return;
    const existing = view.querySelector(`#${GUARD_ID}`);
    if (existing?.dataset?.qKnowledgeLegacyGuard === '1') return;
    if (existing) existing.remove();
    const guard = document.createElement('span');
    guard.id = GUARD_ID;
    guard.hidden = true;
    guard.setAttribute('aria-hidden', 'true');
    guard.dataset.qKnowledgeLegacyGuard = '1';
    view.appendChild(guard);
  }

  // The legacy live-operations module checks for #floLocalRepository before it
  // builds its older panel. Installing this marker before governance modules load
  // keeps that module from reading every IndexedDB document body on page entry.
  installGuard();
  window.addEventListener('quest:layout-refresh', event => {
    if (event.detail?.group === 'library' || event.detail?.group === 'governance') installGuard();
  });
})();
