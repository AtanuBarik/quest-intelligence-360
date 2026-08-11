(() => {
  'use strict';

  const RELEASE = '20260811c';
  const ROUTE_ALIASES = new Map([
    ['surveys','survey'],
    ['survey-analytics','survey'],
    ['profile','competitors'],
    ['profiles','competitors'],
    ['competitor-profiles','competitors']
  ]);
  const GROUP_BY_ROUTE = {
    alerts:'alerts', competitors:'competitor', news:'strategic', social:'strategic',
    copilot:'insights', insights:'insights', pmr:'pmr', experts:'experts', survey:'survey',
    library:'library', projects:'governance', methodology:'governance'
  };
  const FILTER_CONTEXT = '.filter-bar,.sa-filter,.voe-filter,.pmrf-filterbar,.live-filter-bar,.heading-actions,.button-row,.toolbar,[data-filter-bar]';
  let lastRoute = '';
  let timer = 0;
  let observer = null;
  let applying = false;

  const clean = value => String(value || '').replace(/\s+/g,' ').trim();
  const norm = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const canonicalRoute = value => {
    const raw = clean(value).replace(/^#(?:view=)?/,'').toLowerCase();
    return ROUTE_ALIASES.get(raw) || raw;
  };

  function navItems() { return Array.from(document.querySelectorAll('.nav-item[data-view]')); }
  function views() { return Array.from(document.querySelectorAll('.view[data-view]')); }

  function normalizeKnownAliases() {
    navItems().forEach(nav => {
      const route = canonicalRoute(nav.dataset.view);
      if (route && route !== nav.dataset.view) nav.dataset.view = route;
      if (/^survey analytics$/i.test(clean(nav.textContent))) nav.dataset.view = 'survey';
    });
    views().forEach(view => {
      const heading = clean(view.querySelector('h1,h2,h3,[class*="title"]')?.textContent);
      const route = canonicalRoute(view.dataset.view);
      if (route && route !== view.dataset.view) view.dataset.view = route;
      if (/^survey analytics$/i.test(heading)) view.dataset.view = 'survey';
    });
  }

  function headingText(view) {
    return clean(view?.querySelector('h1,h2,h3,[class*="title"]')?.textContent);
  }

  function findNav(route) {
    const target = canonicalRoute(route);
    return navItems().find(nav => canonicalRoute(nav.dataset.view) === target) || null;
  }

  function findView(route, nav = null) {
    const target = canonicalRoute(route);
    let view = views().find(node => canonicalRoute(node.dataset.view) === target) || null;
    if (view) return view;

    const label = norm(nav?.textContent || findNav(target)?.textContent || '');
    if (!label) return null;
    view = views().find(node => {
      const heading = norm(headingText(node));
      return heading && (heading === label || heading.includes(label) || label.includes(heading));
    }) || null;
    if (view && target) view.dataset.view = target;
    return view;
  }

  function resizeCharts(view) {
    if (!view || !window.Chart?.instances) return;
    const canvases = new Set(view.querySelectorAll('canvas'));
    Object.values(window.Chart.instances).forEach(chart => {
      if (!chart?.canvas || !canvases.has(chart.canvas)) return;
      try { chart.resize?.(); chart.update?.('none'); } catch (_) {}
    });
  }

  function routeGroup(route) { return GROUP_BY_ROUTE[canonicalRoute(route)] || ''; }

  function activateRoute(route, nav = null, options = {}) {
    const target = canonicalRoute(route);
    if (!target || target === 'landscape') return false;
    normalizeKnownAliases();
    const selectedNav = nav && nav.matches?.('.nav-item') ? nav : findNav(target);
    const view = findView(target, selectedNav);
    if (!view) return false;

    applying = true;
    try {
      navItems().forEach(item => {
        const active = item === selectedNav || (!selectedNav && canonicalRoute(item.dataset.view) === target);
        item.classList.toggle('active', active);
        if (active) item.setAttribute('aria-current','page');
        else if (item.getAttribute('aria-current') === 'page') item.removeAttribute('aria-current');
      });

      views().forEach(item => {
        const active = item === view;
        item.classList.toggle('active', active);
        if (active) {
          item.removeAttribute('hidden');
          item.removeAttribute('aria-hidden');
          item.style.removeProperty('display');
          item.style.removeProperty('visibility');
          item.style.removeProperty('opacity');
        } else if (item.getAttribute('aria-hidden') === 'false') {
          item.removeAttribute('aria-hidden');
        }
      });

      lastRoute = target;
      document.documentElement.dataset.questActiveView = target;
      document.documentElement.dataset.platformStabilityRelease = RELEASE;
    } finally {
      applying = false;
    }

    requestAnimationFrame(() => {
      const style = getComputedStyle(view);
      if (style.display === 'none') view.style.setProperty('display','block','important');
      if (style.visibility === 'hidden') view.style.setProperty('visibility','visible','important');
      resizeCharts(view);
    });

    if (options.notify) {
      const group = routeGroup(target);
      window.dispatchEvent(new CustomEvent('quest:stable-route',{detail:{route:target,group}}));
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('quest:layout-refresh',{detail:{group,reason:'stable-route'}}));
      },40);
    }
    return true;
  }

  function currentRoute() {
    const activeNav = document.querySelector('.nav-item.active[data-view],[aria-current="page"][data-view]');
    const activeView = document.querySelector('.view.active[data-view]');
    return canonicalRoute(activeNav?.dataset?.view || activeView?.dataset?.view || lastRoute || '');
  }

  function reconcile() {
    if (applying) return;
    normalizeKnownAliases();
    stabilizeControls(document);
    const route = currentRoute();
    if (route) activateRoute(route, findNav(route), {notify:false});
    const result = audit();
    document.documentElement.dataset.questNavigationAudit = result.ok ? 'ok' : 'warning';
  }

  function schedule(delay = 40) {
    clearTimeout(timer);
    timer = setTimeout(reconcile,delay);
  }

  function normalizeSelect(select) {
    if (!select || select.tagName !== 'SELECT') return;
    const options = Array.from(select.options || []);
    if (!options.length) return;
    if (select.selectedIndex < 0 || !options.some(option => option.selected)) select.selectedIndex = 0;
    const selected = options[select.selectedIndex];
    if (selected?.disabled) {
      const firstEnabled = options.findIndex(option => !option.disabled);
      if (firstEnabled >= 0) select.selectedIndex = firstEnabled;
    }
    select.dataset.qStableSelect = 'true';
  }

  function stabilizeControls(root = document) {
    if (!root?.querySelectorAll) return;
    root.querySelectorAll('select').forEach(normalizeSelect);
    root.querySelectorAll(`${FILTER_CONTEXT} button:not([type])`).forEach(button => button.setAttribute('type','button'));
    root.querySelectorAll('input[type="search"],input[data-filter]').forEach(input => {
      if (!input.hasAttribute('autocomplete')) input.setAttribute('autocomplete','off');
    });
  }

  function jumpRouteFromNode(node) {
    return canonicalRoute(node?.dataset?.viewJump || node?.getAttribute?.('data-view-jump') || '');
  }

  function handleClick(event) {
    const nav = event.target.closest?.('.nav-item[data-view]');
    if (nav) {
      const route = canonicalRoute(nav.dataset.view);
      if (!route || route === 'landscape') return;
      lastRoute = route;
      [0,30,120,450,1000].forEach((delay,index) => setTimeout(() => activateRoute(route,nav,{notify:index===1}),delay));
      return;
    }
    const jump = event.target.closest?.('[data-view-jump]');
    if (!jump) return;
    const route = jumpRouteFromNode(jump);
    const targetNav = findNav(route);
    if (!route || !targetNav) return;
    lastRoute = route;
    [0,40,180].forEach((delay,index) => setTimeout(() => activateRoute(route,targetNav,{notify:index===1}),delay));
  }

  function handleControlChange(event) {
    const control = event.target;
    if (!control?.matches?.('select,input')) return;
    if (control.tagName === 'SELECT') normalizeSelect(control);
    const view = control.closest?.('.view[data-view]');
    setTimeout(() => {
      if (view?.classList.contains('active')) resizeCharts(view);
      schedule(40);
    },20);
  }

  function audit() {
    normalizeKnownAliases();
    const navs = navItems().filter(nav => canonicalRoute(nav.dataset.view) !== 'landscape');
    const routeCounts = new Map();
    views().forEach(view => {
      const route = canonicalRoute(view.dataset.view);
      if (!route || route === 'landscape') return;
      routeCounts.set(route,(routeCounts.get(route) || 0) + 1);
    });
    const unresolved = navs.map(nav => canonicalRoute(nav.dataset.view)).filter(route => !findView(route,findNav(route)));
    const duplicates = Array.from(routeCounts.entries()).filter(([,count]) => count > 1).map(([route]) => route);
    const invalidSelects = Array.from(document.querySelectorAll('select')).filter(select => select.options.length && select.selectedIndex < 0).length;
    return {
      ok: unresolved.length === 0 && duplicates.length === 0 && invalidSelects === 0,
      navCount: navs.length,
      viewCount: views().length,
      unresolvedRoutes:[...new Set(unresolved)],
      duplicateRoutes:duplicates,
      invalidSelects,
      activeRoute:currentRoute()
    };
  }

  function boot() {
    normalizeKnownAliases();
    stabilizeControls(document);
    lastRoute = currentRoute();
    if (lastRoute) activateRoute(lastRoute,findNav(lastRoute),{notify:false});

    document.addEventListener('click',handleClick,false);
    document.addEventListener('change',handleControlChange,true);
    document.addEventListener('input',event => {
      if (event.target.matches?.('input[data-filter],input[type="search"]')) schedule(50);
    },true);
    window.addEventListener('hashchange',() => schedule(30));
    window.addEventListener('quest:module-loaded',() => schedule(40));
    window.addEventListener('quest:layout-refresh',() => schedule(50));

    observer = new MutationObserver(mutations => {
      if (applying) return;
      if (mutations.some(mutation => mutation.type === 'childList' && (mutation.addedNodes.length || mutation.removedNodes.length))) schedule(50);
    });
    observer.observe(document.body,{childList:true,subtree:true});

    [250,700,1500,3000].forEach(delay => setTimeout(reconcile,delay));
  }

  window.QuestPlatformStability = {activateRoute,reconcile,stabilizeControls,audit,release:RELEASE};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
