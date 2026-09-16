(() => {
  'use strict';

  const RELEASE = '20260916ux1';
  const LANDING_KEY = 'quest360-executive-landing-' + RELEASE;
  const SECTION_NAMES = ['WORKSPACE', 'PRIMARY MARKET RESEARCH', 'COMPETITIVE INTELLIGENCE'];
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const visible = node => !!(node && (node.offsetWidth || node.offsetHeight || node.getClientRects().length) && getComputedStyle(node).visibility !== 'hidden' && getComputedStyle(node).display !== 'none');

  function leafWithText(text) {
    return [...document.querySelectorAll('body *')].find(node => node.children.length === 0 && clean(node.textContent).toUpperCase() === text);
  }

  function sectionLabelCount(node) {
    if (!node) return 0;
    return SECTION_NAMES.filter(name => [...node.querySelectorAll('*')].some(child => child.children.length === 0 && clean(child.textContent).toUpperCase() === name)).length;
  }

  function findSectionBlock(name) {
    const label = leafWithText(name);
    if (!label) return null;
    let node = label.parentElement;
    let best = null;
    for (let depth = 0; node && node !== document.body && depth < 7; depth += 1, node = node.parentElement) {
      const labels = sectionLabelCount(node);
      const navCount = node.querySelectorAll('.nav-item').length;
      if (labels === 1 && navCount > 0) best = node;
      if (labels > 1) break;
    }
    return best || label.parentElement;
  }

  function reorderSections() {
    const workspace = findSectionBlock('WORKSPACE');
    const pmr = findSectionBlock('PRIMARY MARKET RESEARCH');
    const competitive = findSectionBlock('COMPETITIVE INTELLIGENCE');
    if (!workspace || !pmr || !competitive) return false;
    if (workspace === pmr || workspace === competitive || pmr === competitive) return false;
    if (workspace.parentElement !== pmr.parentElement || workspace.parentElement !== competitive.parentElement) return false;

    const parent = workspace.parentElement;
    parent.insertBefore(pmr, workspace.nextSibling);
    parent.insertBefore(competitive, pmr.nextSibling);
    return true;
  }

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

    reorderSections();
    document.documentElement.dataset.criticalFrontendRelease = RELEASE;
    document.documentElement.dataset.questDesignBaseline = '20260916';
  }

  function loginIsVisible() {
    const password = [...document.querySelectorAll('input[type="password"]')].find(visible);
    if (password) return true;
    return [...document.querySelectorAll('button,h1,h2,h3,[class*="title"]')].some(node => visible(node) && /^(sign in|log in|login)$/i.test(clean(node.textContent)));
  }

  function findExecutiveNav() {
    return [...document.querySelectorAll('.nav-item,[data-view]')].find(node => /^executive hub$/i.test(clean(node.textContent))) ||
      [...document.querySelectorAll('.nav-item')].find(node => /executive\s*hub/i.test(clean(node.getAttribute('aria-label') || node.getAttribute('title') || '')));
  }

  function applyExecutiveLanding() {
    if (loginIsVisible()) {
      try { sessionStorage.removeItem(LANDING_KEY); } catch (_) {}
      return;
    }
    if (!document.querySelector('.nav-item')) return;
    try { if (sessionStorage.getItem(LANDING_KEY) === '1') return; } catch (_) {}

    const executive = findExecutiveNav();
    if (!executive || !visible(executive)) return;
    try { sessionStorage.setItem(LANDING_KEY, '1'); } catch (_) {}
    executive.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    (window.requestAnimationFrame || setTimeout)(() => {
      queued = false;
      normalizeNavigation();
      applyExecutiveLanding();
    });
  }

  function boot() {
    schedule();
    window.addEventListener('quest:module-loaded', schedule);
    window.addEventListener('quest:layout-refresh', schedule);
    const observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => mutation.addedNodes && mutation.addedNodes.length)) schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    [250, 700, 1400, 2600].forEach(delay => setTimeout(schedule, delay));
  }

  window.QuestCriticalNavigation = { normalizeNavigation, reorderSections, applyExecutiveLanding, release: RELEASE };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
