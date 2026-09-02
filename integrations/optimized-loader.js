(() => {
  'use strict';

  const RELEASE = '20260902nav1';
  const loaded = new Map();
  const groupLoads = new Map();

  const GROUPS = {
    alerts: [
      'integrations/alerts-chatgpt-summaries.js',
      'integrations/laboratory-news-monitor.js',
      'integrations/alerts-resilience-fix.js',
      'integrations/alerts-signals-final.js'
    ],
    competitor: [
      'integrations/competitor-intelligence-profiles/loader.js',
      'integrations/competitor-daily-refresh.js',
      'integrations/competitor-profiles-final.js'
    ],
    strategic: [
      'integrations/strategic-news-social-hubs.js',
      'integrations/strategic-analysis-hub.js',
      'integrations/strategic-source-watch-status.js'
    ],
    insights: [
      'integrations/enterprise-insights-engine/loader.js',
      'integrations/insights-engine-layout-v3.js',
      'integrations/insights-engine-evidence-placement-final.js'
    ],
    library: ['integrations/knowledge-repository-lite.js'],
    pmr: ['integrations/pmr-repository-dashboard-final.js'],
    experts: ['integrations/voice-experts-dashboard-final.js'],
    survey: ['integrations/survey-analytics-dashboard-final.js'],
    governance: ['integrations/no-cost-live-operations.js','integrations/live-governance-panels.js'],
    microsoft: ['integrations/local-file-extraction.js','integrations/microsoft-local-bridge.js','integrations/microsoft-security-guard.js','integrations/approved-insights-panel.js']
  };

  const CORE = [
    'integrations/chart-lite.js',
    'integrations/chart-alignment-system.js',
    'integrations/frontend-quality-guard.js',
    'integrations/role-access-governance.js',
    'integrations/quest-brand-system.js',
    'integrations/frontend-performance-layout.js',
    'integrations/frontend-readability-overrides.js',
    'integrations/local-data-fetch-bridge.js',
    'integrations/executive-status-seed.js',
    'integrations/executive-hub-final.js',
    'integrations/executive-insight-split-layout.js',
    'integrations/knowledge-repository-lite.js',
    'integrations/knowledge-legacy-guard.js',
    'integrations/public-demo-evidence.js',
    'integrations/executive-typography-benchmark-cleanup.js',
    'integrations/pmr-repository-dashboard-final.js',
    'integrations/voice-experts-dashboard-final.js',
    'integrations/survey-analytics-dashboard-final.js'
  ];

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

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

  function removeRetiredNavigation() {
    let retiredView = '';
    [...document.querySelectorAll('.nav-item')].forEach(node => {
      if (/^competitive landscape$/i.test(clean(node.textContent))) {
        retiredView = node.dataset?.view || retiredView;
        node.remove();
      }
    });
    [...document.querySelectorAll('.view[data-view]')].forEach(view => {
      const heading = [...view.querySelectorAll('h1,h2,h3,[class*="title"]')].map(node => clean(node.textContent)).join(' | ');
      if ((retiredView && view.dataset.view === retiredView) || view.dataset.view === 'landscape' || /competitive landscape/i.test(heading)) view.remove();
    });
    [...document.querySelectorAll('[data-view-jump="landscape"]')].forEach(node => node.remove());
  }

  function loadScript(path) {
    if (loaded.has(path)) return loaded.get(path);
    const existing = [...document.scripts].find(script => (script.src || '').includes(path));
    if (existing) {
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
    if (!GROUPS[name]?.length) return;
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
        window.dispatchEvent(new CustomEvent('quest:layout-refresh', { detail: { group: name, reason: 'module-loaded' } }));
        setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
      }
    })();

    groupLoads.set(name, promise);
    return promise;
  }

  async function bootCore() {
    progress(true);
    try {
      removeRetiredNavigation();
      for (const path of CORE) await loadScript(path);
    } catch (error) {
      console.error('Quest core load failed:', error);
    } finally {
      progress(false, true);
    }
  }

  function bindRequests() {
    window.addEventListener('quest:request-module-group', event => {
      const group = event.detail?.group;
      if (group) loadGroup(group);
    });
  }

  async function boot() {
    removeRetiredNavigation();
    bindRequests();
    bootCore();
    document.documentElement.dataset.questRelease = RELEASE;
    document.documentElement.dataset.questDesignBaseline = '20260830';
    document.documentElement.classList.add('quest-ready');
  }

  window.QuestModuleLoader = {
    loadScript,
    loadGroup,
    groups: Object.keys(GROUPS),
    release: RELEASE
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
