(() => {
  'use strict';

  const RELEASE = '20260902nav1';
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  function normalizeNavigation() {
    document.querySelectorAll('.nav-item').forEach(node => {
      if (/^competitive landscape$/i.test(clean(node.textContent))) node.remove();
      if (/^survey analytics$/i.test(clean(node.textContent))) node.dataset.view = 'survey';
    });
    document.querySelectorAll('[data-view-jump="landscape"]').forEach(node => node.remove());
    document.querySelectorAll('.view[data-view]').forEach(view => {
      const heading = clean(view.querySelector('h1,h2,h3,[class*="title"]')?.textContent);
      if (view.dataset.view === 'landscape' || /competitive landscape/i.test(heading)) {
        view.remove();
        return;
      }
      if (view.dataset.view === 'surveys' || /^survey analytics$/i.test(heading)) view.dataset.view = 'survey';
    });

    const items = [...document.querySelectorAll('.nav-item')];
    const tracker = items.find(node => /^project tracker$/i.test(clean(node.textContent)));
    const evidence = items.find(node => /^evidence library$/i.test(clean(node.textContent)));
    if (tracker && evidence && tracker.parentElement === evidence.parentElement && tracker.nextElementSibling !== evidence) {
      tracker.insertAdjacentElement('afterend', evidence);
    }

    document.documentElement.dataset.criticalFrontendRelease = RELEASE;
    document.documentElement.dataset.questDesignBaseline = '20260830';
  }

  function boot() {
    normalizeNavigation();
    window.addEventListener('quest:module-loaded', normalizeNavigation);
  }

  window.QuestCriticalNavigation = { normalizeNavigation, release: RELEASE };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
