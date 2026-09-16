(() => {
  'use strict';

  const RELEASE = '20260916ux3';
  const LANDING_KEY = 'quest360-executive-landing-' + RELEASE;
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const visible = node => !!(node && (node.offsetWidth || node.offsetHeight || node.getClientRects().length) && getComputedStyle(node).visibility !== 'hidden' && getComputedStyle(node).display !== 'none');

  function navLabel(name) {
    return [...document.querySelectorAll('.nav-label')].find(node => clean(node.textContent).toUpperCase() === name);
  }

  function collectNavBlock(label) {
    if (!label) return [];
    const block = [label];
    let node = label.nextElementSibling;
    while (node && !node.classList.contains('nav-label')) {
      block.push(node);
      node = node.nextElementSibling;
    }
    return block;
  }

  function nextNavLabel(label) {
    let node = label?.nextElementSibling || null;
    while (node && !node.classList.contains('nav-label')) node = node.nextElementSibling;
    return node;
  }

  function reorderSections() {
    const workspace = navLabel('WORKSPACE');
    const pmr = navLabel('PRIMARY MARKET RESEARCH');
    const competitive = navLabel('COMPETITIVE INTELLIGENCE');
    if (!workspace || !pmr || !competitive) return false;
    if (workspace.parentElement !== pmr.parentElement || workspace.parentElement !== competitive.parentElement) return false;

    // Already in the requested order. Do not move nodes again: repeated DOM moves
    // can continuously retrigger MutationObserver callbacks and make navigation feel frozen.
    if (nextNavLabel(workspace) === pmr && nextNavLabel(pmr) === competitive) return false;

    const pmrBlock = collectNavBlock(pmr);
    const competitiveBlock = collectNavBlock(competitive);
    if (!pmrBlock.length || !competitiveBlock.length) return false;

    const parent = workspace.parentElement;
    const insertBlockAfter = (block, afterNode) => {
      const fragment = document.createDocumentFragment();
      block.forEach(node => fragment.appendChild(node));
      if (afterNode.nextSibling) parent.insertBefore(fragment, afterNode.nextSibling);
      else parent.appendChild(fragment);
      return block[block.length - 1];
    };

    const workspaceBlock = collectNavBlock(workspace);
    let tail = workspaceBlock[workspaceBlock.length - 1] || workspace;
    tail = insertBlockAfter(pmrBlock, tail);
    insertBlockAfter(competitiveBlock, tail);
    return true;
  }

  function normalizeNavigation() {
    let changed = false;
    document.querySelectorAll('.nav-item').forEach(node => {
      if (/^competitive landscape$/i.test(clean(node.textContent))) {
        node.remove();
        changed = true;
        return;
      }
      if (/^survey analytics$/i.test(clean(node.textContent)) && node.dataset.view !== 'survey') {
        node.dataset.view = 'survey';
        changed = true;
      }
    });
    document.querySelectorAll('[data-view-jump="landscape"]').forEach(node => {
      node.remove();
      changed = true;
    });
    document.querySelectorAll('.view[data-view]').forEach(view => {
      const heading = clean(view.querySelector('h1,h2,h3,[class*="title"]')?.textContent);
      if (view.dataset.view === 'landscape' || /competitive landscape/i.test(heading)) {
        view.remove();
        changed = true;
        return;
      }
      if ((view.dataset.view === 'surveys' || /^survey analytics$/i.test(heading)) && view.dataset.view !== 'survey') {
        view.dataset.view = 'survey';
        changed = true;
      }
    });

    const items = [...document.querySelectorAll('.nav-item')];
    const tracker = items.find(node => /^project tracker$/i.test(clean(node.textContent)));
    const evidence = items.find(node => /^evidence library$/i.test(clean(node.textContent)));
    if (tracker && evidence && tracker.parentElement === evidence.parentElement && tracker.nextElementSibling !== evidence) {
      tracker.insertAdjacentElement('afterend', evidence);
      changed = true;
    }

    changed = reorderSections() || changed;
    document.documentElement.dataset.criticalFrontendRelease = RELEASE;
    document.documentElement.dataset.questDesignBaseline = '20260916';
    return changed;
  }

  function loginIsVisible() {
    const password = [...document.querySelectorAll('input[type="password"]')].find(visible);
    if (password) return true;
    return [...document.querySelectorAll('button,h1,h2,h3,[class*="title"]')].some(node => visible(node) && /^(sign in|log in|login)$/i.test(clean(node.textContent)));
  }

  function appIsVisible() {
    return [...document.querySelectorAll('.app-shell,.workspace,.side-nav')].some(visible);
  }

  function findExecutiveNav() {
    return [...document.querySelectorAll('.nav-item')].find(node => /^executive hub$/i.test(clean(node.textContent))) ||
      [...document.querySelectorAll('.nav-item')].find(node => /executive\s*hub/i.test(clean(node.getAttribute('aria-label') || node.getAttribute('title') || '')));
  }

  function applyExecutiveLanding() {
    if (loginIsVisible()) {
      try { sessionStorage.removeItem(LANDING_KEY); } catch (_) {}
      return;
    }
    if (!appIsVisible()) return;
    try { if (sessionStorage.getItem(LANDING_KEY) === '1') return; } catch (_) {}

    const executive = findExecutiveNav();
    if (!executive || !visible(executive)) return;
    try { sessionStorage.setItem(LANDING_KEY, '1'); } catch (_) {}
    executive.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  }

  let queued = false;
  function schedule(delay = 0) {
    if (delay) { setTimeout(() => schedule(), delay); return; }
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
    document.addEventListener('click', event => {
      const target = event.target.closest('button,input[type="submit"],[role="button"]');
      if (target && /sign in|log in|login|enter hub/i.test(clean(target.textContent) + ' ' + clean(target.getAttribute('aria-label') || ''))) {
        [120, 300, 700, 1400].forEach(schedule);
      }
    }, true);

    // Only structural additions/removals need navigation normalization. Observing
    // active/style attribute changes caused a feedback loop during normal page clicks.
    const observer = new MutationObserver(mutations => {
      const structuralChange = mutations.some(mutation =>
        mutation.type === 'childList' && (mutation.addedNodes.length || mutation.removedNodes.length)
      );
      if (structuralChange) schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    [250, 700, 1400, 2600].forEach(schedule);
  }

  window.QuestCriticalNavigation = { normalizeNavigation, reorderSections, applyExecutiveLanding, release: RELEASE };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
