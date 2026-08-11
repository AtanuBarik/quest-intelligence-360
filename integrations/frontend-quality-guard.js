(() => {
  'use strict';

  const RELEASE = '20260811b';
  let scheduled = 0;

  const TERM_RULES = [
    [/ChatGPT/gi, 'Insight assistant'],
    [/Gemini/gi, 'Insight assistant'],
    [/\bAI-assisted\b/gi, 'assisted'],
    [/\bAI-powered\b/gi, 'automation-powered'],
    [/\bAI-enabled\b/gi, 'automation-enabled'],
    [/\bAI decision support\b/gi, 'decision support'],
    [/\bAI analytics\b/gi, 'advanced analytics'],
    [/\bAI readiness\b/gi, 'digital readiness'],
    [/\bAI assistant\b/gi, 'insights assistant'],
    [/\bAI summaries?\b/gi, 'automated summaries'],
    [/\bAI\b/gi, 'automation']
  ];

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const norm = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  function scrubTerms(value) {
    let text = String(value ?? '');
    TERM_RULES.forEach(([pattern, replacement]) => { text = text.replace(pattern, replacement); });
    return text;
  }

  function scrubNode(root = document) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest('script,style,noscript,template')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(textNode => {
      const next = scrubTerms(textNode.nodeValue);
      if (next !== textNode.nodeValue) textNode.nodeValue = next;
    });
    const attrSelector = '[title],[aria-label],[placeholder],[alt]';
    const elements = root.querySelectorAll ? root.querySelectorAll(attrSelector) : [];
    elements.forEach(element => {
      ['title','aria-label','placeholder','alt'].forEach(attr => {
        if (!element.hasAttribute(attr)) return;
        const current = element.getAttribute(attr) || '';
        const next = scrubTerms(current);
        if (next !== current) element.setAttribute(attr, next);
      });
    });
  }

  function itemSelector(viewName) {
    if (viewName === 'competitors' || viewName === 'profiles') return '.competitor-card,.cp-card';
    if (viewName === 'alerts') return '.alert-card';
    if (viewName === 'news') return '.news-item';
    if (viewName === 'library') return '.document-row';
    return '';
  }

  function isGenericOption(value) {
    const text = clean(value);
    return !text || /^(all|any|select|choose)\b/i.test(text) || /^last\s+\d+/i.test(text) || /^portfolio view$/i.test(text);
  }

  function selectedTokens(filterBar) {
    return Array.from(filterBar.querySelectorAll('select')).map(select => {
      const option = select.options?.[select.selectedIndex];
      return clean(option?.textContent || select.value);
    }).filter(value => !isGenericOption(value)).map(norm).filter(Boolean);
  }

  function searchTerms(filterBar) {
    return Array.from(filterBar.querySelectorAll('input[type="search"],input:not([type])')).map(input => norm(input.value)).filter(Boolean);
  }

  function ensureEmptyState(view, visible, total) {
    let box = view.querySelector(':scope > .q-filter-empty');
    if (visible || !total) {
      box?.remove();
      return;
    }
    if (!box) {
      box = document.createElement('div');
      box.className = 'q-filter-empty';
      box.textContent = 'No records match the selected filters. Adjust one or more parameters to broaden the view.';
      const bar = view.querySelector('.filter-bar');
      bar?.insertAdjacentElement('afterend', box);
    }
  }

  function applyGenericFilter(view) {
    if (!view || view.matches('.saf,.voef,.pmrf,.sa2-shell') || view.querySelector('[data-filter],#liveSearch,.cp-shell')) return;
    const filterBar = view.querySelector('.filter-bar');
    const selector = itemSelector(view.dataset.view);
    if (!filterBar || !selector) return;
    const items = Array.from(view.querySelectorAll(selector));
    if (!items.length) return;
    const tokens = selectedTokens(filterBar);
    const searches = searchTerms(filterBar);
    let visible = 0;
    items.forEach(item => {
      const hay = norm(item.textContent);
      const matches = tokens.every(token => hay.includes(token)) && searches.every(term => hay.includes(term));
      item.style.display = matches ? '' : 'none';
      item.dataset.qFilterVisible = matches ? 'true' : 'false';
      if (matches) visible += 1;
    });
    ensureEmptyState(view, visible, items.length);
  }

  function resetGenericFilter(view, bar) {
    bar.querySelectorAll('input').forEach(input => { input.value = ''; });
    bar.querySelectorAll('select').forEach(select => { select.selectedIndex = 0; });
    applyGenericFilter(view);
  }

  function bindGenericFilters(root = document) {
    root.querySelectorAll('.view[data-view] .filter-bar').forEach(bar => {
      if (bar.dataset.qFilterGuard === 'true') return;
      const view = bar.closest('.view[data-view]');
      if (!view || view.matches('.saf,.voef,.pmrf,.sa2-shell') || view.querySelector('[data-filter],#liveSearch,.cp-shell')) return;
      if (!itemSelector(view.dataset.view)) return;
      bar.dataset.qFilterGuard = 'true';
      bar.addEventListener('input', () => applyGenericFilter(view));
      bar.addEventListener('change', () => applyGenericFilter(view));
      bar.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;
        const label = clean(button.textContent);
        if (/^reset\b/i.test(label)) {
          event.preventDefault();
          resetGenericFilter(view, bar);
        } else if (/^(apply|filter)\b/i.test(label)) {
          event.preventDefault();
          applyGenericFilter(view);
        }
      });
      applyGenericFilter(view);
    });
  }

  function chartForCanvas(canvas) {
    if (!canvas || !window.Chart?.instances) return null;
    return Object.values(window.Chart.instances).find(chart => chart?.canvas === canvas) || null;
  }

  function cloneDatasets(datasets) {
    return (datasets || []).map(dataset => ({...dataset, data:Array.isArray(dataset.data) ? dataset.data.map(point => typeof point === 'object' && point !== null ? {...point} : point) : dataset.data}));
  }

  function bindChartSelectors(root = document) {
    root.querySelectorAll('.panel select,.chart-wrap').forEach(() => {});
    root.querySelectorAll('.panel select').forEach(select => {
      if (select.dataset.qChartSelector === 'true') return;
      const panel = select.closest('.panel');
      const canvas = panel?.querySelector('canvas');
      if (!canvas) return;
      const labels = Array.from(select.options || []).map(option => clean(option.textContent));
      if (!labels.some(label => /^all\b/i.test(label))) return;
      select.dataset.qChartSelector = 'true';
      const apply = () => {
        const chart = chartForCanvas(canvas);
        if (!chart?.data?.datasets?.length) return;
        if (!chart.__qOriginalDatasets) chart.__qOriginalDatasets = cloneDatasets(chart.data.datasets);
        const selected = clean(select.options?.[select.selectedIndex]?.textContent || select.value);
        const originals = cloneDatasets(chart.__qOriginalDatasets);
        if (/^all\b/i.test(selected)) chart.data.datasets = originals;
        else {
          const selectedNorm = norm(selected);
          const matches = originals.filter(dataset => {
            const label = norm(dataset.label);
            return label && (label.includes(selectedNorm) || selectedNorm.includes(label));
          });
          chart.data.datasets = matches.length ? matches : originals;
        }
        try { chart.update?.('none'); chart.resize?.(); } catch (_) {}
      };
      select.addEventListener('change', () => window.setTimeout(apply, 0));
    });
  }

  function ensureKanban(view) {
    let board = view.querySelector('.q-project-kanban');
    if (board) return board;
    const rows = Array.from(view.querySelectorAll('.task-row:not(.head)'));
    if (!rows.length) return null;
    const buckets = new Map([['On track',[]],['At risk',[]],['Blocked',[]],['Other',[]]]);
    rows.forEach(row => {
      const cells = Array.from(row.children).map(node => clean(node.textContent));
      const status = cells[cells.length - 1] || 'Other';
      const key = /on track/i.test(status) ? 'On track' : /at risk/i.test(status) ? 'At risk' : /blocked/i.test(status) ? 'Blocked' : 'Other';
      buckets.get(key).push({title:cells[0] || 'Work item', project:cells[1] || '', owner:cells[2] || '', due:cells[3] || '', status});
    });
    board = document.createElement('section');
    board.className = 'panel q-project-kanban';
    board.innerHTML = `<div class="panel-head"><div><span class="section-kicker">KANBAN VIEW</span><h3>Milestones by status</h3></div></div><div class="q-kanban-grid">${Array.from(buckets.entries()).map(([name,items]) => `<div class="q-kanban-col"><strong>${name}</strong>${items.length ? items.map(item => `<article><b>${item.title}</b><span>${item.project}</span><small>${[item.owner,item.due].filter(Boolean).join(' · ')}</small></article>`).join('') : '<small>No items</small>'}</div>`).join('')}</div>`;
    const kpis = view.querySelector('.kpi-grid');
    if (kpis) kpis.insertAdjacentElement('afterend', board); else view.prepend(board);
    return board;
  }

  function bindProjectViewSelector(root = document) {
    root.querySelectorAll('.view[data-view="projects"] .page-heading select').forEach(select => {
      if (select.dataset.qProjectView === 'true') return;
      const options = Array.from(select.options || []).map(option => clean(option.textContent));
      if (!options.some(option => /timeline view/i.test(option)) || !options.some(option => /kanban view/i.test(option))) return;
      select.dataset.qProjectView = 'true';
      select.addEventListener('change', () => {
        const view = select.closest('.view[data-view="projects"]');
        if (!view) return;
        const mode = clean(select.options?.[select.selectedIndex]?.textContent || select.value);
        if (/timeline/i.test(mode)) {
          view.querySelector('.gantt')?.closest('.panel')?.scrollIntoView({behavior:'smooth',block:'start'});
        } else if (/kanban/i.test(mode)) {
          ensureKanban(view)?.scrollIntoView({behavior:'smooth',block:'start'});
        } else {
          view.querySelector('.page-heading')?.scrollIntoView({behavior:'smooth',block:'start'});
        }
      });
    });
  }

  function injectStyles() {
    if (document.getElementById('qFrontendQualityStyles')) return;
    const style = document.createElement('style');
    style.id = 'qFrontendQualityStyles';
    style.textContent = `
      .q-filter-empty{margin:0 0 12px;padding:14px 16px;border:1px dashed #c7d5c9;border-radius:10px;background:#fbfdfb;color:#5f6d65;font-size:12px;line-height:1.45}
      .q-project-kanban{margin-bottom:12px}.q-kanban-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.q-kanban-col{min-width:0;padding:10px;border:1px solid #dfe7e0;border-radius:11px;background:#f8faf8}.q-kanban-col>strong{display:block;margin-bottom:8px;color:#034c1f;font-size:12px}.q-kanban-col article{padding:9px;margin-top:7px;border:1px solid #e1e8e2;border-radius:9px;background:#fff}.q-kanban-col article b,.q-kanban-col article span,.q-kanban-col article small{display:block}.q-kanban-col article b{font-size:11px;color:#26362d}.q-kanban-col article span{margin-top:4px;font-size:10px;color:#526158}.q-kanban-col article small{margin-top:5px;font-size:9px;color:#7d8982}
      @media(max-width:980px){.q-kanban-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.q-kanban-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function apply(root = document) {
    injectStyles();
    scrubNode(root);
    bindGenericFilters(root);
    bindChartSelectors(root);
    bindProjectViewSelector(root);
    document.documentElement.dataset.frontendQualityRelease = RELEASE;
  }

  function schedule(delay = 50) {
    window.clearTimeout(scheduled);
    scheduled = window.setTimeout(() => apply(document), delay);
  }

  function boot() {
    apply(document);
    const observer = new MutationObserver(mutations => {
      const added = mutations.some(mutation => mutation.addedNodes && mutation.addedNodes.length);
      const text = mutations.some(mutation => mutation.type === 'characterData');
      if (added || text) schedule(60);
    });
    observer.observe(document.body, {childList:true,subtree:true,characterData:true});
    document.addEventListener('change', event => {
      if (event.target.matches('select,input')) schedule(20);
    }, true);
    window.addEventListener('quest:module-loaded', () => schedule(50));
    window.addEventListener('quest:layout-refresh', () => schedule(50));
    window.addEventListener('resize', () => schedule(100), {passive:true});
    [300,900,1800,3500].forEach(delay => window.setTimeout(() => apply(document), delay));
  }

  window.QuestFrontendQuality = {scrubTerms, apply};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
