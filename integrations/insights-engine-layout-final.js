(() => {
  'use strict';

  const RELEASE = '20260809n';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let observer = null;
  let timer = 0;
  let applying = false;

  function visible(node) {
    if (!node || !node.isConnected) return false;
    const style = getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function insightsView() {
    const views = $$('.view[data-view],main,[role="main"]');
    return views.find(node => visible(node) && /Quest Knowledge\s*&\s*Insights Engine|Quest Enterprise Insights Engine|Insights Copilot/i.test(node.textContent || '')) || null;
  }

  function headingNode(view, pattern) {
    return $$('h1,h2,h3,h4,h5,strong,.title,.panel-title,.section-title', view)
      .find(node => pattern.test((node.textContent || '').replace(/\s+/g, ' ').trim())) || null;
  }

  function panelFromHeading(view, pattern) {
    const heading = headingNode(view, pattern);
    if (!heading) return null;
    return heading.closest('section,aside,article,.panel,.card,.q-ui-card,.flo-panel,[class*="panel"],[class*="card"]') || heading.parentElement?.parentElement || heading.parentElement;
  }

  function findQaPanel(view) {
    const candidates = $$('section,article,.panel,.card,.q-ui-card,.flo-panel,[class*="panel"],[class*="card"]', view)
      .filter(node => /Quest Enterprise Insights Engine|Ask a new business question across Quest|Generate answer/i.test(node.textContent || ''))
      .filter(node => node.querySelector('textarea,input[type="text"],[contenteditable="true"]') || /Generate answer/i.test(node.textContent || ''));
    return candidates.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0] || null;
  }

  function commonAncestor(nodes) {
    if (!nodes.length) return null;
    let current = nodes[0];
    while (current && !nodes.every(node => current.contains(node))) current = current.parentElement;
    return current;
  }

  function topUnder(ancestor, node) {
    let current = node;
    while (current?.parentElement && current.parentElement !== ancestor) current = current.parentElement;
    return current;
  }

  function stripStepNumber(panel) {
    const heading = $('h1,h2,h3,h4,h5,.title,.panel-title,.section-title', panel);
    if (heading) heading.textContent = (heading.textContent || '').replace(/^\s*\d+\.\s*/, '').trim();
  }

  function markEvidenceTiles(panel) {
    const inputs = $$('input[type="checkbox"],input[type="radio"]', panel);
    const tiles = [];
    for (const input of inputs) {
      let tile = input.closest('label');
      if (!tile) {
        let current = input.parentElement;
        for (let depth = 0; current && current !== panel && depth < 4; depth += 1, current = current.parentElement) {
          const text = (current.textContent || '').trim();
          if (text && text.length < 300) tile = current;
        }
      }
      if (tile && !tiles.includes(tile)) tiles.push(tile);
    }
    tiles.forEach(tile => tile.classList.add('qif-evidence-option'));
    if (tiles.length) {
      const parent = tiles.every(tile => tile.parentElement === tiles[0].parentElement) ? tiles[0].parentElement : panel;
      parent.classList.add('qif-evidence-grid');
    }
  }

  function markRepositoryTiles(panel) {
    const interactive = $$('input[type="checkbox"],input[type="radio"],button,[role="switch"]', panel);
    const tiles = [];
    for (const item of interactive) {
      let tile = item.closest('label,.repository-card,.repo-card,[class*="repository"],[class*="repo-"]');
      if (!tile) {
        let current = item.parentElement;
        for (let depth = 0; current && current !== panel && depth < 4; depth += 1, current = current.parentElement) {
          const text = (current.textContent || '').trim();
          if (text && text.length > 3 && text.length < 360) tile = current;
        }
      }
      if (tile && !tiles.includes(tile)) tiles.push(tile);
    }
    tiles.forEach(tile => tile.classList.add('qif-repository-option'));
    if (tiles.length) {
      const parent = tiles.every(tile => tile.parentElement === tiles[0].parentElement) ? tiles[0].parentElement : panel;
      parent.classList.add('qif-repository-grid');
    }
  }

  function injectStyles() {
    let style = $('#qInsightsLayoutFinalStyles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qInsightsLayoutFinalStyles';
      document.head.appendChild(style);
    }
    style.textContent = `
      #qInsightsLayoutFinal{
        --qif-green:#034c1f;
        --qif-mid:#35792a;
        --qif-lime:#c6d52f;
        --qif-blue:#00587c;
        --qif-line:#d8e3d9;
        --qif-soft:#f7faf6;
        display:grid!important;
        grid-template-columns:minmax(270px,310px) minmax(0,1fr)!important;
        grid-template-areas:"evidence evidence" "repos repos" "left main"!important;
        gap:16px!important;
        width:100%!important;
        max-width:none!important;
        margin:14px 0 24px!important;
        align-items:start!important;
      }
      #qInsightsLayoutFinal *{box-sizing:border-box}
      #qInsightsEvidenceSlot{grid-area:evidence;min-width:0}
      #qInsightsRepositoriesSlot{grid-area:repos;min-width:0}
      #qInsightsLeftSlot{grid-area:left;display:grid;gap:16px;min-width:0;align-content:start}
      #qInsightsMainSlot{grid-area:main;min-width:0}

      #qInsightsLayoutFinal :is(section,aside,article,.panel,.card,.q-ui-card,.flo-panel,[class*="panel"],[class*="card"]){
        max-width:none!important;
      }
      #qInsightsEvidenceFinal,
      #qInsightsRepositoriesFinal,
      #qInsightsScopeFinal,
      #qInsightsOutputFinal,
      #qInsightsQaFinal{
        width:100%!important;
        max-width:none!important;
        min-width:0!important;
        margin:0!important;
        border:1px solid var(--qif-line)!important;
        border-radius:14px!important;
        background:linear-gradient(180deg,#fff 0%,#fbfdfb 100%)!important;
        box-shadow:0 7px 22px rgba(3,76,31,.055)!important;
      }
      #qInsightsEvidenceFinal{border-top:3px solid var(--qif-lime)!important}
      #qInsightsRepositoriesFinal{border-top:3px solid var(--qif-blue)!important}
      #qInsightsScopeFinal{border-top:3px solid var(--qif-mid)!important}
      #qInsightsOutputFinal{border-top:3px solid var(--qif-green)!important}
      #qInsightsQaFinal{border-top:3px solid var(--qif-green)!important;min-height:650px!important}

      #qInsightsEvidenceFinal,
      #qInsightsRepositoriesFinal{
        overflow:visible!important;
        max-height:none!important;
      }
      #qInsightsEvidenceFinal :is(.scroll,.scrollable,[class*="scroll"],[style*="overflow"]),
      #qInsightsRepositoriesFinal :is(.scroll,.scrollable,[class*="scroll"],[style*="overflow"]){
        max-height:none!important;
      }
      #qInsightsEvidenceFinal .qif-evidence-grid{
        display:grid!important;
        grid-template-columns:repeat(4,minmax(150px,1fr))!important;
        gap:10px!important;
        width:100%!important;
        max-height:none!important;
        overflow:visible!important;
      }
      #qInsightsEvidenceFinal .qif-evidence-option{
        display:flex!important;
        align-items:center!important;
        gap:10px!important;
        min-height:58px!important;
        padding:11px 12px!important;
        border:1px solid #d8e5d4!important;
        border-radius:10px!important;
        background:#f8fbf6!important;
        box-shadow:0 3px 9px rgba(3,76,31,.035)!important;
      }
      #qInsightsEvidenceFinal .qif-evidence-option:has(input:checked){
        border-color:#9ebc8f!important;
        background:#eef6e9!important;
      }
      #qInsightsRepositoriesFinal .qif-repository-grid{
        display:grid!important;
        grid-template-columns:repeat(4,minmax(170px,1fr))!important;
        gap:10px!important;
        max-height:none!important;
        overflow:visible!important;
      }
      #qInsightsRepositoriesFinal .qif-repository-option{
        min-width:0!important;
        border-radius:10px!important;
      }

      #qInsightsLeftSlot #qInsightsScopeFinal{max-height:590px!important;overflow:auto!important}
      #qInsightsLeftSlot #qInsightsOutputFinal{overflow:visible!important}
      #qInsightsQaFinal{
        display:flex!important;
        flex-direction:column!important;
      }
      #qInsightsQaFinal textarea{
        min-height:82px!important;
        font-size:13px!important;
      }
      #qInsightsQaFinal :is(.chat,.conversation,.messages,[class*="message"],[class*="answer"],[class*="conversation"]){
        max-width:none!important;
      }

      #qInsightsLayoutFinal h2,#qInsightsLayoutFinal h3,#qInsightsLayoutFinal h4{color:var(--qif-green)!important}
      #qInsightsLayoutFinal :is(p,span,small,label,button,input,textarea){font-size:max(12px,1em)!important}

      @media(max-width:1180px){
        #qInsightsEvidenceFinal .qif-evidence-grid,
        #qInsightsRepositoriesFinal .qif-repository-grid{grid-template-columns:repeat(2,minmax(150px,1fr))!important}
      }
      @media(max-width:900px){
        #qInsightsLayoutFinal{
          grid-template-columns:1fr!important;
          grid-template-areas:"evidence" "repos" "left" "main"!important;
        }
        #qInsightsLeftSlot #qInsightsScopeFinal{max-height:none!important}
      }
      @media(max-width:620px){
        #qInsightsEvidenceFinal .qif-evidence-grid,
        #qInsightsRepositoriesFinal .qif-repository-grid{grid-template-columns:1fr!important}
      }
    `;
  }

  function locate(view) {
    return {
      scope: panelFromHeading(view, /Select project scope/i),
      evidence: panelFromHeading(view, /Select evidence types/i),
      output: panelFromHeading(view, /Output configuration/i),
      repos: panelFromHeading(view, /Connected repositories/i),
      qa: findQaPanel(view),
    };
  }

  function ensureLayout(view, parts) {
    const nodes = [parts.scope, parts.evidence, parts.output, parts.repos, parts.qa].filter(Boolean);
    if (nodes.length < 5) return false;

    let shell = $('#qInsightsLayoutFinal', view);
    if (!shell) {
      const ancestor = commonAncestor(nodes) || view;
      const topNodes = [...new Set(nodes.map(node => topUnder(ancestor, node)).filter(Boolean))];
      let first = topNodes[0];
      for (const node of topNodes.slice(1)) {
        if (node.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_PRECEDING) first = node;
      }
      shell = document.createElement('section');
      shell.id = 'qInsightsLayoutFinal';
      shell.setAttribute('aria-label', 'Quest Enterprise Insights Engine workspace');
      shell.innerHTML = '<div id="qInsightsEvidenceSlot"></div><div id="qInsightsRepositoriesSlot"></div><div id="qInsightsLeftSlot"></div><div id="qInsightsMainSlot"></div>';
      ancestor.insertBefore(shell, first || null);
    }

    const evidenceSlot = $('#qInsightsEvidenceSlot', shell);
    const reposSlot = $('#qInsightsRepositoriesSlot', shell);
    const leftSlot = $('#qInsightsLeftSlot', shell);
    const mainSlot = $('#qInsightsMainSlot', shell);

    parts.evidence.id = 'qInsightsEvidenceFinal';
    parts.repos.id = 'qInsightsRepositoriesFinal';
    parts.scope.id = 'qInsightsScopeFinal';
    parts.output.id = 'qInsightsOutputFinal';
    parts.qa.id = 'qInsightsQaFinal';

    stripStepNumber(parts.evidence);
    stripStepNumber(parts.scope);
    stripStepNumber(parts.output);
    markEvidenceTiles(parts.evidence);
    markRepositoryTiles(parts.repos);

    if (parts.evidence.parentElement !== evidenceSlot) evidenceSlot.appendChild(parts.evidence);
    if (parts.repos.parentElement !== reposSlot) reposSlot.appendChild(parts.repos);
    if (parts.scope.parentElement !== leftSlot) leftSlot.appendChild(parts.scope);
    if (parts.output.parentElement !== leftSlot) leftSlot.appendChild(parts.output);
    if (parts.qa.parentElement !== mainSlot) mainSlot.appendChild(parts.qa);

    document.documentElement.dataset.insightsLayout = RELEASE;
    return true;
  }

  function layoutNeedsRepair(view) {
    const shell = $('#qInsightsLayoutFinal', view);
    if (!shell) return true;
    const parts = locate(view);
    if (!parts.scope || !parts.evidence || !parts.output || !parts.repos || !parts.qa) return false;
    return parts.evidence.parentElement?.id !== 'qInsightsEvidenceSlot' ||
      parts.repos.parentElement?.id !== 'qInsightsRepositoriesSlot' ||
      parts.scope.parentElement?.id !== 'qInsightsLeftSlot' ||
      parts.output.parentElement?.id !== 'qInsightsLeftSlot' ||
      parts.qa.parentElement?.id !== 'qInsightsMainSlot';
  }

  function apply() {
    if (applying) return;
    const view = insightsView();
    if (!view) return;
    const parts = locate(view);
    if (!parts.scope || !parts.evidence || !parts.output || !parts.repos || !parts.qa) return;
    applying = true;
    observer?.disconnect();
    try {
      injectStyles();
      ensureLayout(view, parts);
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    } finally {
      applying = false;
      watch(view);
    }
  }

  function schedule(delay = 0) {
    clearTimeout(timer);
    timer = setTimeout(apply, delay);
  }

  function watch(view) {
    observer?.disconnect();
    observer = new MutationObserver(() => {
      if (layoutNeedsRepair(view)) schedule(100);
    });
    observer.observe(view, { childList:true, subtree:true });
  }

  function boot() {
    injectStyles();
    schedule(80);
    setTimeout(() => schedule(0), 500);
    setTimeout(() => schedule(0), 1400);
    setTimeout(() => schedule(0), 3000);
    window.addEventListener('quest:layout-refresh', () => schedule(120));
    window.addEventListener('hashchange', () => schedule(160));
    document.addEventListener('click', event => {
      if (event.target.closest?.('.nav-item') && /Insights Engine|Insights Copilot/i.test(event.target.closest('.nav-item')?.textContent || '')) schedule(250);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
