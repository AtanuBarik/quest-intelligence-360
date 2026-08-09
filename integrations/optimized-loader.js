(() => {
  'use strict';

  const RELEASE = '20260809n';
  const loaded = new Map();
  const groupLoads = new Map();

  const GROUPS = {
    alerts: ['integrations/laboratory-news-monitor.js','integrations/laboratory-news-sync.js','integrations/strategic-analysis-hub.js','integrations/alerts-resilience-fix.js'],
    competitor: ['integrations/competitor-intelligence-profiles/loader.js','integrations/competitor-daily-refresh.js'],
    strategic: ['integrations/strategic-news-social-hubs.js','integrations/strategic-analysis-hub.js','integrations/strategic-source-watch-status.js'],
    insights: ['integrations/enterprise-insights-engine/loader.js','integrations/insights-engine-layout-final.js'],
    library: ['integrations/knowledge-repository-lite.js'],
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
    if (/competitor profile|competitive landscape/.test(text)) return 'competitor';
    if (/news intelligence|strategic analysis|social|perception/.test(text)) return 'strategic';
    if (/insights engine|insights copilot|ask insights/.test(text)) return 'insights';
    if (/knowledge repository|research repository/.test(text)) return 'library';
    if (/microsoft|sharepoint|local data|local repository|local file/.test(text)) return 'microsoft';
    if (/project tracker|pmr project|methodology|audit|survey analytics|voice of experts/.test(text)) return 'governance';
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
      await loadScript('integrations/chart-lite.js');
      if (window.Chart && typeof window.initCharts === 'function' && !Object.keys(window.Chart.instances || {}).length) {
        try { window.initCharts(); } catch (error) { console.warn('Initial chart creation deferred:', error); }
      }
      await loadScript('integrations/role-access-governance.js');
      await loadScript('integrations/quest-brand-system.js');
      await loadScript('integrations/frontend-performance-layout.js');
      await loadScript('integrations/frontend-readability-overrides.js');
      await loadScript('integrations/local-data-fetch-bridge.js');
      await loadScript('integrations/executive-status-seed.js');
      await loadScript('integrations/executive-hub-final.js');
      await loadScript('integrations/executive-insight-split-layout.js');
      await loadScript('integrations/knowledge-repository-lite.js');
      await loadScript('integrations/knowledge-legacy-guard.js');
      await loadScript('integrations/public-demo-evidence.js');
      await loadScript('integrations/executive-typography-benchmark-cleanup.js');
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
      const group = groupFromElement(event.target);
      if (group) loadGroup(group);
    }, true);
    window.addEventListener('hashchange', () => {
      const group = activeGroup();
      if (group) loadGroup(group);
    });
  }

  async function boot() {
    bindNavigation();
    await bootCore();
    const group = activeGroup();
    if (group) loadGroup(group);
    document.documentElement.dataset.questRelease = RELEASE;
    document.documentElement.classList.add('quest-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();