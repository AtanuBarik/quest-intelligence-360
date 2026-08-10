(() => {
  'use strict';

  const RELEASE = '20260810q';
  const loaded = new Map();
  const groupLoads = new Map();
  let retireSweepQueued = false;

  const GROUPS = {
    alerts: ['integrations/laboratory-news-monitor.js','integrations/alerts-resilience-fix.js','integrations/alerts-signals-final.js'],
    competitor: ['integrations/competitor-intelligence-profiles/loader.js','integrations/competitor-daily-refresh.js','integrations/competitor-profiles-final.js'],
    strategic: ['integrations/strategic-news-social-hubs.js','integrations/strategic-analysis-hub.js','integrations/strategic-source-watch-status.js'],
    insights: ['integrations/enterprise-insights-engine/loader.js','integrations/insights-engine-layout-v3.js','integrations/insights-engine-evidence-placement-final.js'],
    library: ['integrations/knowledge-repository-lite.js'],
    pmr: ['integrations/pmr-repository-dashboard-final.js'],
    experts: ['integrations/voice-experts-dashboard-final.js'],
    survey: ['integrations/survey-analytics-dashboard-final.js'],
    governance: ['integrations/no-cost-live-operations.js','integrations/live-governance-panels.js'],
    microsoft: ['integrations/local-file-extraction.js','integrations/microsoft-local-bridge.js','integrations/microsoft-security-guard.js','integrations/approved-insights-panel.js']
  };

  function progress(active, done = false) {
    let node = document.getElementById('qModuleProgress');
    if (!node) {
      node = document.createElement('div');
      node.id = 'qModuleProgress';
      node.className = 'q-module-progress';
      node.innerHTML = '<i></i>';
      document.body.appendChild(node);
    }
    node.classList.toggle('active', Boolean(active));
    node.classList.toggle('done', Boolean(done));
    if (done) window.setTimeout(() => node.remove(), 220);
  }

  function normalizedText(value = '') {
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function removeRetiredNavigation() {
    let retiredView = '';
    Array.from(document.querySelectorAll('.nav-item')).forEach(node => {
      if (/^competitive landscape$/i.test(normalizedText(node.textContent))) {
        retiredView = node.dataset?.view || retiredView;
        node.remove();
      }
    });

    Array.from(document.querySelectorAll('.view[data-view]')).forEach(view => {
      const headingText = Array.from(view.querySelectorAll('h1,h2,h3,[class*="title"]'))
        .map(node => normalizedText(node.textContent))
        .join(' | ');
      if ((retiredView && view.dataset.view === retiredView) || view.dataset.view === 'landscape' || /competitive landscape/i.test(headingText)) view.remove();
    });

    Array.from(document.querySelectorAll('a,button,[aria-label],[title]')).forEach(node => {
      const label = normalizedText(node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent);
      if (/^competitive landscape$/i.test(label)) node.remove();
    });

    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const tracker = navItems.find(node => /^project tracker$/i.test(normalizedText(node.textContent)));
    const evidence = navItems.find(node => /^evidence library$/i.test(normalizedText(node.textContent)));
    if (tracker && evidence && tracker.parentElement === evidence.parentElement && tracker.nextElementSibling !== evidence) {
      tracker.insertAdjacentElement('afterend', evidence);
    }
  }

  function scheduleRetiredSweep() {
    if (retireSweepQueued) return;
    retireSweepQueued = true;
    window.requestAnimationFrame(() => {
      retireSweepQueued = false;
      removeRetiredNavigation();
    });
  }

  function watchForRetiredLandscape() {
    if (!document.body || document.body.dataset.qLandscapeGuard === 'true') return;
    document.body.dataset.qLandscapeGuard = 'true';
    const observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => mutation.addedNodes && mutation.addedNodes.length)) scheduleRetiredSweep();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function loadScript(path) {
    if (loaded.has(path)) return loaded.get(path);
    const existing = Array.from(document.scripts).find(script => (script.src || '').includes(path));
    if (existing) {
      existing.dataset.qLoaded = 'true';
      const promise = Promise.resolve(existing);
      loaded.set(path, promise);
      return promise;
    }
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL(`${path}?v=${RELEASE}`, document.baseURI).href;
      script.async = true;
      script.dataset.qModule = path;
      script.onload = () => {
        script.dataset.qLoaded = 'true';
        removeRetiredNavigation();
        window.dispatchEvent(new CustomEvent('quest:module-loaded', { detail: { path } }));
        resolve(script);
      };
      script.onerror = () => reject(new Error(`Unable to load ${path}`));
      document.body.appendChild(script);
    });
    loaded.set(path, promise);
    return promise;
  }

  async function loadGroup(name) {
    if (!GROUPS[name]) return;
    if (groupLoads.has(name)) return groupLoads.get(name);
    const promise = (async () => {
      progress(true);
      try {
        for (const path of GROUPS[name]) await loadScript(path);
      } catch (error) {
        console.error(`Quest ${name} module load failed:`, error);
      } finally {
        removeRetiredNavigation();
        progress(false, true);
        window.dispatchEvent(new CustomEvent('quest:layout-refresh', { detail: { group: name } }));
      }
    })();
    groupLoads.set(name, promise);
    return promise;
  }

  function groupFromText(value = '') {
    const text = String(value).toLowerCase();
    if (/alert|strategic signal/.test(text)) return 'alerts';
    if (/competitor profile/.test(text)) return 'competitor';
    if (/news intelligence|strategic analysis|social|perception/.test(text)) return 'strategic';
    if (/insights engine|insights copilot|ask insights/.test(text)) return 'insights';
    if (/voice of experts|persona intelligence|expert analysis/.test(text)) return 'experts';
    if (/survey analytics|survey intelligence/.test(text)) return 'survey';
    if (/knowledge repository|research repository|evidence library/.test(text)) return 'library';
    if (/pmr projects|pmr reports|primary market research hub|primary market research knowledge hub/.test(text)) return 'pmr';
    if (/microsoft|sharepoint|local data|local repository|local file/.test(text)) return 'microsoft';
    if (/project tracker|methodology|audit/.test(text)) return 'governance';
    return '';
  }

  function groupFromElement(target) {
    const node = target?.closest?.('.nav-item,[data-view],a,button');
    if (!node) return '';
    return groupFromText(`${node.dataset?.view || ''} ${node.getAttribute('href') || ''} ${node.getAttribute('aria-label') || ''} ${node.textContent || ''}`);
  }

  function activeGroup() {
    const active = document.querySelector('.nav-item.active,[aria-current="page"],[data-view].active');
    const visible = Array.from(document.querySelectorAll('.view[data-view]')).find(node => {
      const style = window.getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    return groupFromText(`${active?.dataset?.view || ''} ${active?.textContent || ''} ${visible?.dataset?.view || ''} ${visible?.textContent?.slice(0,120) || ''}`);
  }

  async function bootCore() {
    progress(true);
    try {
      removeRetiredNavigation();
      await loadScript('integrations/chart-lite.js');
      if (window.Chart && typeof window.initCharts === 'function' && !Object.keys(window.Chart.instances || {}).length) {
        try { window.initCharts(); } catch (error) { console.warn('Initial chart creation deferred:', error); }
      }
      await loadScript('integrations/role-access-governance.js');
      await loadScript('integrations/quest-brand-system.js');
      await loadScript('integrations/frontend-performance-layout.js');
      await loadScript('integrations/frontend-readability-overrides.js');
      await loadScript('integrations/frontend-stability-guard.js');
      await loadScript('integrations/local-data-fetch-bridge.js');
      await loadScript('integrations/executive-status-seed.js');
      await loadScript('integrations/executive-hub-final.js');
      await loadScript('integrations/executive-insight-split-layout.js');
      await loadScript('integrations/knowledge-repository-lite.js');
      await loadScript('integrations/knowledge-legacy-guard.js');
      await loadScript('integrations/public-demo-evidence.js');
      await loadScript('integrations/executive-typography-benchmark-cleanup.js');
      await loadScript('integrations/pmr-repository-dashboard-final.js');
      await loadScript('integrations/voice-experts-dashboard-final.js');
      await loadScript('integrations/survey-analytics-dashboard-final.js');
      removeRetiredNavigation();
    } catch (error) {
      console.error('Quest core load failed:', error);
    } finally {
      progress(false, true);
    }
  }

  function bindNavigation() {
    document.addEventListener('pointerover', event => {
      const group = groupFromElement(event.target);
      if (group && group !== 'library') loadGroup(group);
    }, { passive: true, capture: true });
    document.addEventListener('focusin', event => {
      const group = groupFromElement(event.target);
      if (group) loadGroup(group);
    }, true);
    document.addEventListener('click', event => {
      removeRetiredNavigation();
      const group = groupFromElement(event.target);
      if (group) loadGroup(group);
    }, true);
    window.addEventListener('hashchange', () => {
      removeRetiredNavigation();
      const group = activeGroup();
      if (group) loadGroup(group);
    });
  }

  async function boot() {
    removeRetiredNavigation();
    watchForRetiredLandscape();
    bindNavigation();
    await bootCore();
    removeRetiredNavigation();
    const group = activeGroup();
    if (group) loadGroup(group);
    document.documentElement.dataset.questRelease = RELEASE;
    document.documentElement.classList.add('quest-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();