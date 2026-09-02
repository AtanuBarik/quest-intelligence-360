(() => {
  'use strict';

  const RELEASE = '20260902nav1';
  const ROUTE_ALIASES = new Map([
    ['surveys','survey'],['survey-analytics','survey'],['profile','competitors'],['profiles','competitors'],['competitor-profiles','competitors']
  ]);
  const GROUP_BY_ROUTE = {
    alerts:'alerts', competitors:'competitor', news:'strategic', social:'strategic', copilot:'insights', insights:'insights',
    pmr:'pmr', experts:'experts', survey:'survey', library:'library', projects:'governance', methodology:'governance'
  };
  const FILTER_CONTEXT = '.filter-bar,.sa-filter,.voe-filter,.pmrf-filterbar,.live-filter-bar,.heading-actions,.button-row,.toolbar,[data-filter-bar]';
  let activeRoute = '';
  let activating = false;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const canonicalRoute = value => {
    const raw = clean(value).replace(/^#(?:view=)?/, '').toLowerCase();
    return ROUTE_ALIASES.get(raw) || raw;
  };
  const navItems = () => [...document.querySelectorAll('.nav-item[data-view]')];
  const views = () => [...document.querySelectorAll('.view[data-view]')];

  function normalizeKnownAliases() {
    navItems().forEach(nav => {
      const route = canonicalRoute(nav.dataset.view);
      if (route && route !== nav.dataset.view) nav.dataset.view = route;
      if (/^survey analytics$/i.test(clean(nav.textContent))) nav.dataset.view = 'survey';
    });
    views().forEach(view => {
      const route = canonicalRoute(view.dataset.view);
      if (route && route !== view.dataset.view) view.dataset.view = route;
      const heading = clean(view.querySelector('h1,h2,h3,[class*="title"]')?.textContent);
      if (/^survey analytics$/i.test(heading)) view.dataset.view = 'survey';
    });
  }

  function findNav(route) {
    const target = canonicalRoute(route);
    return navItems().find(nav => canonicalRoute(nav.dataset.view) === target) || null;
  }

  function findView(route) {
    const target = canonicalRoute(route);
    return views().find(view => canonicalRoute(view.dataset.view) === target) || null;
  }

  function routeGroup(route) {
    return GROUP_BY_ROUTE[canonicalRoute(route)] || '';
  }

  function resizeCharts(view) {
    if (!view) return;
    requestAnimationFrame(() => {
      try {
        const canvases = new Set(view.querySelectorAll('canvas'));
        Object.values(window.Chart?.instances || {}).forEach(chart => {
          if (!chart?.canvas || !canvases.has(chart.canvas)) return;
          try { chart.resize?.(); chart.update?.('none'); } catch (_) {}
        });
      } catch (_) {}
      view.querySelectorAll('svg[viewBox]').forEach(svg => {
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
      });
      window.dispatchEvent(new CustomEvent('quest:charts-resized', { detail: { route: canonicalRoute(view.dataset.view) } }));
    });
  }

  function stabilizeControls(root = document) {
    if (!root?.querySelectorAll) return;
    root.querySelectorAll('select').forEach(select => {
      if (!select.options.length) return;
      if (select.selectedIndex < 0) select.selectedIndex = 0;
      select.dataset.qStableSelect = 'true';
    });
    root.querySelectorAll(`${FILTER_CONTEXT} button:not([type])`).forEach(button => button.setAttribute('type', 'button'));
    root.querySelectorAll('input[type="search"],input[data-filter]').forEach(input => {
      if (!input.hasAttribute('autocomplete')) input.setAttribute('autocomplete', 'off');
    });
  }

  function setActiveRoute(route, options = {}) {
    const target = canonicalRoute(route);
    if (!target || target === 'landscape') return false;
    normalizeKnownAliases();
    const nav = findNav(target);
    const view = findView(target);
    if (!nav || !view) return false;

    activating = true;
    try {
      navItems().forEach(item => {
        const isActive = canonicalRoute(item.dataset.view) === target;
        item.classList.toggle('active', isActive);
        if (isActive) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
      });

      views().forEach(item => {
        const isActive = canonicalRoute(item.dataset.view) === target;
        item.classList.toggle('active', isActive);
        item.style.removeProperty('display');
        item.style.removeProperty('visibility');
        item.style.removeProperty('opacity');
        if (isActive) {
          item.removeAttribute('hidden');
          item.removeAttribute('aria-hidden');
        } else {
          item.setAttribute('aria-hidden', 'true');
        }
      });

      activeRoute = target;
      document.documentElement.dataset.questActiveView = target;
      document.documentElement.dataset.platformStabilityRelease = RELEASE;
      document.documentElement.dataset.questNavigationAudit = 'ok';
    } finally {
      activating = false;
    }

    resizeCharts(view);
    setTimeout(() => resizeCharts(view), 120);

    if (options.load !== false) {
      const group = routeGroup(target);
      if (group) {
        const loader = window.QuestModuleLoader?.loadGroup;
        if (typeof loader === 'function') {
          Promise.resolve(loader(group)).finally(() => {
            if (activeRoute === target) {
              const current = findView(target);
              if (current) {
                views().forEach(item => {
                  const isActive = canonicalRoute(item.dataset.view) === target;
                  item.classList.toggle('active', isActive);
                  item.style.removeProperty('display');
                  item.style.removeProperty('visibility');
                  item.style.removeProperty('opacity');
                });
                resizeCharts(current);
              }
            }
          });
        } else {
          window.dispatchEvent(new CustomEvent('quest:request-module-group', { detail: { group, route: target } }));
        }
      }
    }

    window.dispatchEvent(new CustomEvent('quest:stable-route', { detail: { route: target, group: routeGroup(target) } }));
    return true;
  }

  function currentRoute() {
    if (activeRoute && findView(activeRoute)) return activeRoute;
    const nav = document.querySelector('.nav-item.active[data-view],[aria-current="page"][data-view]');
    const view = document.querySelector('.view.active[data-view]');
    return canonicalRoute(nav?.dataset?.view || view?.dataset?.view || '');
  }

  function handleNavigation(event) {
    const nav = event.target.closest?.('.nav-item[data-view]');
    const jump = event.target.closest?.('[data-view-jump]');
    if (!nav && !jump) return;
    const target = canonicalRoute(nav?.dataset?.view || jump?.dataset?.viewJump || '');
    if (!target || target === 'landscape') return;

    event.preventDefault();
    event.stopImmediatePropagation();
    setActiveRoute(target, { load: true });
  }

  function handleHashChange() {
    const target = canonicalRoute(location.hash);
    if (target && findNav(target) && findView(target)) setActiveRoute(target, { load: true });
  }

  function audit() {
    normalizeKnownAliases();
    const unresolved = navItems()
      .map(nav => canonicalRoute(nav.dataset.view))
      .filter(route => route && route !== 'landscape' && !findView(route));
    const activeNavs = navItems().filter(nav => nav.classList.contains('active')).length;
    const activeViews = views().filter(view => view.classList.contains('active')).length;
    return {
      ok: !unresolved.length && activeNavs === 1 && activeViews === 1,
      unresolvedRoutes: [...new Set(unresolved)],
      activeNavs,
      activeViews,
      activeRoute: currentRoute()
    };
  }

  function boot() {
    normalizeKnownAliases();
    stabilizeControls(document);
    const initial = currentRoute() || canonicalRoute(navItems()[0]?.dataset?.view || '');
    if (initial) setActiveRoute(initial, { load: false });

    document.addEventListener('click', handleNavigation, true);
    document.addEventListener('change', event => {
      const view = event.target.closest?.('.view[data-view]');
      if (view?.classList.contains('active')) resizeCharts(view);
    }, true);
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('quest:module-loaded', () => {
      if (!activating && activeRoute) setTimeout(() => setActiveRoute(activeRoute, { load: false }), 0);
    });
    window.addEventListener('quest:layout-refresh', () => {
      const view = findView(activeRoute || currentRoute());
      if (view) resizeCharts(view);
    });
    window.addEventListener('resize', () => {
      const view = findView(activeRoute || currentRoute());
      if (view) resizeCharts(view);
    }, { passive: true });

    document.documentElement.dataset.questNavigationController = 'single-authority';
  }

  window.QuestPlatformStability = {
    activateRoute: setActiveRoute,
    reconcile: () => setActiveRoute(currentRoute(), { load: false }),
    stabilizeControls,
    audit,
    resizeCharts,
    release: RELEASE
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
