(() => {
  'use strict';

  const RELEASE = '20260809o';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let observer = null;
  let timer = 0;
  let applying = false;

  const PROJECT_MAP = [
    ['Redefining the Health System Experience', 'Health Systems · Active', '25 files'],
    ['Digital Customer Journey & Solutions Roadmap', 'Health Systems & Physician Groups · Active', '31 files'],
    ['Data Ecosystem Needs', 'Interoperability & Digital Strategy · Active', '13 files'],
    ['Data Ecosystem Needs — Extended Study', 'Partnerships & Data Ecosystem · Active', '12 files'],
    ['Lab Stewardship & Analytics Competitive Positioning', 'Analytics & Stewardship · Active', '17 files'],
    ['US Consumer Testing Market — Company Profiles', 'Consumer Health · Completed', '2 files'],
    ['Clinical Laboratory Competitive Intelligence — Always On', 'MACI / Competitive Intelligence · Always on', '6 files']
  ];

  const OUTPUT_MAP = [
    ['Executive synthesis', 'Concise answer with implications and evidence'],
    ['Evidence table', 'Project, source, finding, confidence and citation'],
    ['PowerPoint-ready storyline', 'Headlines, support and recommended exhibits'],
    ['Research brief', 'Background, synthesis, gaps and next actions'],
    ['Include verbatim transcript evidence', ''],
    ['Show confidence, contradictions and coverage gaps', ''],
    ['Recommend charts and slide exhibit', '']
  ];

  const REPO_MAP = [
    ['Microsoft SharePoint', 'Folder-level sync, permissions and incremental indexing'],
    ['OneDrive', 'Personal and shared files with Microsoft Graph'],
    ['Google Drive', 'Import NotebookLM source folders and research files'],
    ['NotebookLM export', 'Import source lists, notes and exported artifacts']
  ];

  function visible(node) {
    if (!node || !node.isConnected) return false;
    const style = getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function cleanText(value = '') {
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function insightsView() {
    const candidates = $$('.view[data-view],main,[role="main"]');
    return candidates.find(node => visible(node) && /Quest Knowledge\s*&\s*Insights Engine|Quest Enterprise Insights Engine|Insights Copilot/i.test(node.textContent || '')) || null;
  }

  function headingNode(view, pattern) {
    const candidates = $$('h1,h2,h3,h4,h5,h6,strong,.title,.panel-title,.section-title', view)
      .filter(node => pattern.test(cleanText(node.textContent)));
    return candidates.sort((a, b) => cleanText(a.textContent).length - cleanText(b.textContent).length)[0] || null;
  }

  function panelFromHeading(view, pattern) {
    const heading = headingNode(view, pattern);
    if (!heading) return null;
    let current = heading;
    for (let depth = 0; current && current !== view && depth < 7; depth += 1, current = current.parentElement) {
      if (current.matches?.('section,aside,article,.panel,.card,.q-ui-card,.flo-panel,[class*="panel"],[class*="card"],[class*="column"]')) {
        const text = cleanText(current.textContent);
        if (text.length > cleanText(heading.textContent).length + 20) return current;
      }
    }
    return heading.parentElement?.parentElement || heading.parentElement;
  }

  function findQaPanel(view) {
    const candidates = $$('section,article,.panel,.card,.q-ui-card,.flo-panel,[class*="panel"],[class*="card"],div', view)
      .filter(node => /Quest Enterprise Insights Engine|Ask a new business question across Quest|Generate answer/i.test(node.textContent || ''))
      .filter(node => node.querySelector('textarea,input[type="text"],[contenteditable="true"]') || /Generate answer/i.test(node.textContent || ''))
      .filter(node => cleanText(node.textContent).length < 7000);
    return candidates.sort((a, b) => cleanText(a.textContent).length - cleanText(b.textContent).length)[0] || null;
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
    const heading = $('h1,h2,h3,h4,h5,h6,.title,.panel-title,.section-title', panel);
    if (heading) heading.textContent = cleanText(heading.textContent).replace(/^\d+\.\s*/, '');
  }

  function optionCard(input, panel) {
    let card = input.closest('label,.option,.tile,.card,article,li,[class*="option"],[class*="tile"]');
    if (card && card !== panel) return card;
    let current = input.parentElement;
    for (let depth = 0; current && current !== panel && depth < 4; depth += 1, current = current.parentElement) {
      const text = cleanText(current.textContent);
      if (text && text.length < 420) card = current;
    }
    return card && card !== panel ? card : null;
  }

  function markInputTiles(panel, className, gridClass) {
    const tiles = [];
    $$('input[type="checkbox"],input[type="radio"]', panel).forEach(input => {
      const tile = optionCard(input, panel);
      if (tile && !tiles.includes(tile)) tiles.push(tile);
    });
    tiles.forEach(tile => tile.classList.add(className));
    if (tiles.length) {
      const parent = tiles.every(tile => tile.parentElement === tiles[0].parentElement) ? tiles[0].parentElement : null;
      if (parent) parent.classList.add(gridClass);
    }
    return tiles;
  }

  function smallestTextCard(panel, text) {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'i');
    const candidates = $$('label,article,li,button,div,[class*="card"],[class*="option"]', panel)
      .filter(node => re.test(cleanText(node.textContent)))
      .filter(node => cleanText(node.textContent).length < 650);
    return candidates.sort((a, b) => cleanText(a.textContent).length - cleanText(b.textContent).length)[0] || null;
  }

  function markProjectTiles(panel) {
    const marked = markInputTiles(panel, 'qif-project-option', 'qif-project-grid');
    PROJECT_MAP.forEach(([name, meta, files]) => {
      const card = smallestTextCard(panel, name);
      if (!card) return;
      card.classList.add('qif-project-option');
      card.dataset.qifProject = name;
      card.dataset.qifMeta = meta;
      card.dataset.qifFiles = files;
    });
    return marked;
  }

  function markOutputTiles(panel) {
    markInputTiles(panel, 'qif-output-option', 'qif-output-grid');
    OUTPUT_MAP.forEach(([name, description]) => {
      const card = smallestTextCard(panel, name);
      if (!card) return;
      card.classList.add('qif-output-option');
      card.dataset.qifOutput = name;
      if (description) card.dataset.qifDescription = description;
    });
  }

  function repositoryCard(button, panel) {
    let current = button.parentElement;
    let best = null;
    for (let depth = 0; current && current !== panel && depth < 5; depth += 1, current = current.parentElement) {
      const text = cleanText(current.textContent);
      if (text.length > 10 && text.length < 520) best = current;
    }
    return best;
  }

  function markRepositoryTiles(panel) {
    const tiles = [];
    $$('button,[role="button"],input[type="checkbox"],[role="switch"]', panel).forEach(control => {
      const card = repositoryCard(control, panel);
      if (card && !tiles.includes(card)) tiles.push(card);
    });
    REPO_MAP.forEach(([name, description]) => {
      const card = smallestTextCard(panel, name);
      if (!card) return;
      card.classList.add('qif-repository-option');
      card.dataset.qifRepo = name;
      card.dataset.qifDescription = description;
      if (!tiles.includes(card)) tiles.push(card);
    });
    tiles.forEach(tile => tile.classList.add('qif-repository-option'));
    if (tiles.length) {
      const parent = tiles.every(tile => tile.parentElement === tiles[0].parentElement) ? tiles[0].parentElement : null;
      if (parent) parent.classList.add('qif-repository-grid');
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
        --qif-green:#034c1f;--qif-mid:#35792a;--qif-lime:#c6d52f;--qif-blue:#00587c;
        --qif-line:#d9e4da;--qif-soft:#f7faf6;--qif-shadow:0 7px 22px rgba(3,76,31,.055);
        display:grid!important;
        grid-template-columns:minmax(292px,318px) minmax(0,1fr)!important;
        grid-template-areas:"evidence evidence" "repos repos" "left main"!important;
        gap:16px!important;width:100%!important;max-width:none!important;margin:14px 0 24px!important;align-items:start!important;
      }
      #qInsightsLayoutFinal *{box-sizing:border-box}
      #qInsightsEvidenceSlot{grid-area:evidence;min-width:0}
      #qInsightsRepositoriesSlot{grid-area:repos;min-width:0}
      #qInsightsLeftSlot{grid-area:left;display:grid;gap:16px;min-width:0;align-content:start}
      #qInsightsMainSlot{grid-area:main;min-width:0}
      #qInsightsEvidenceFinal,#qInsightsRepositoriesFinal,#qInsightsScopeFinal,#qInsightsOutputFinal,#qInsightsQaFinal{
        width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;
        border:1px solid var(--qif-line)!important;border-radius:14px!important;
        background:linear-gradient(180deg,#fff 0%,#fbfdfb 100%)!important;box-shadow:var(--qif-shadow)!important;
      }
      #qInsightsEvidenceFinal{border-top:3px solid var(--qif-lime)!important}
      #qInsightsRepositoriesFinal{border-top:3px solid var(--qif-blue)!important}
      #qInsightsScopeFinal{border-top:3px solid var(--qif-mid)!important}
      #qInsightsOutputFinal{border-top:3px solid var(--qif-green)!important}
      #qInsightsQaFinal{border-top:3px solid var(--qif-green)!important;min-height:690px!important;display:flex!important;flex-direction:column!important}

      #qInsightsEvidenceFinal,#qInsightsRepositoriesFinal,#qInsightsScopeFinal,#qInsightsOutputFinal{overflow:visible!important;max-height:none!important}
      #qInsightsScopeFinal :is(.scroll,.scrollable,[class*="scroll"],[style*="overflow"]),
      #qInsightsEvidenceFinal :is(.scroll,.scrollable,[class*="scroll"],[style*="overflow"]),
      #qInsightsRepositoriesFinal :is(.scroll,.scrollable,[class*="scroll"],[style*="overflow"]),
      #qInsightsOutputFinal :is(.scroll,.scrollable,[class*="scroll"],[style*="overflow"]){max-height:none!important;overflow:visible!important}

      #qInsightsEvidenceFinal .qif-evidence-grid{display:grid!important;grid-template-columns:repeat(4,minmax(155px,1fr))!important;gap:10px!important;width:100%!important;max-height:none!important;overflow:visible!important}
      #qInsightsEvidenceFinal .qif-evidence-option,
      #qInsightsOutputFinal .qif-output-option,
      #qInsightsScopeFinal .qif-project-option{
        min-width:0!important;border:1px solid #d9e5d6!important;border-radius:10px!important;background:#f9fcf7!important;box-shadow:0 3px 9px rgba(3,76,31,.03)!important;
      }
      #qInsightsEvidenceFinal .qif-evidence-option{display:flex!important;align-items:center!important;gap:10px!important;min-height:58px!important;padding:11px 12px!important}
      #qInsightsEvidenceFinal .qif-evidence-option:has(input:checked),#qInsightsOutputFinal .qif-output-option:has(input:checked),#qInsightsScopeFinal .qif-project-option:has(input:checked){border-color:#9bbd8b!important;background:#edf6e8!important}

      #qInsightsRepositoriesFinal .qif-repository-grid{display:grid!important;grid-template-columns:repeat(4,minmax(180px,1fr))!important;gap:10px!important;max-height:none!important;overflow:visible!important}
      #qInsightsRepositoriesFinal .qif-repository-option{min-width:0!important;padding:12px!important;border:1px solid #dce6e0!important;border-radius:10px!important;background:linear-gradient(180deg,#fff,#f7faf8)!important}
      #qInsightsRepositoriesFinal .qif-repository-option button{min-height:32px!important;border-radius:7px!important}

      #qInsightsScopeFinal .qif-project-grid,#qInsightsOutputFinal .qif-output-grid{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;max-height:none!important;overflow:visible!important}
      #qInsightsScopeFinal .qif-project-option,#qInsightsOutputFinal .qif-output-option{display:block!important;padding:11px!important;margin:0!important}
      #qInsightsScopeFinal .qif-project-option{min-height:68px!important}
      #qInsightsOutputFinal .qif-output-option{min-height:58px!important}

      #qInsightsQaFinal textarea{min-height:88px!important;font-size:13px!important;width:100%!important}
      #qInsightsQaFinal :is(.chat,.conversation,.messages,[class*="message"],[class*="answer"],[class*="conversation"],[class*="workspace"]){max-width:none!important;width:100%!important}
      #qInsightsQaFinal [class*="suggest"],#qInsightsQaFinal [class*="prompt"]{max-width:none!important}

      #qInsightsLayoutFinal h2,#qInsightsLayoutFinal h3,#qInsightsLayoutFinal h4{color:var(--qif-green)!important}
      #qInsightsLayoutFinal :is(p,span,small,label,button,input,textarea){font-size:max(12px,1em)!important}
      #qInsightsEvidenceFinal h3::before{content:'▦';margin-right:7px;color:var(--qif-lime)}
      #qInsightsRepositoriesFinal h3::before{content:'⇄';margin-right:7px;color:var(--qif-blue)}
      #qInsightsScopeFinal h3::before{content:'◫';margin-right:7px;color:var(--qif-mid)}
      #qInsightsOutputFinal h3::before{content:'✓';margin-right:7px;color:var(--qif-green)}

      @media(max-width:1180px){
        #qInsightsEvidenceFinal .qif-evidence-grid,#qInsightsRepositoriesFinal .qif-repository-grid{grid-template-columns:repeat(2,minmax(155px,1fr))!important}
      }
      @media(max-width:900px){
        #qInsightsLayoutFinal{grid-template-columns:1fr!important;grid-template-areas:"evidence" "repos" "left" "main"!important}
      }
      @media(max-width:620px){
        #qInsightsEvidenceFinal .qif-evidence-grid,#qInsightsRepositoriesFinal .qif-repository-grid{grid-template-columns:1fr!important}
      }
    `;
  }

  function locate(view) {
    return {
      scope: panelFromHeading(view, /Select project scope/i),
      evidence: panelFromHeading(view, /Select evidence types/i),
      output: panelFromHeading(view, /Output configuration/i),
      repos: panelFromHeading(view, /Connected repositories/i),
      qa: findQaPanel(view)
    };
  }

  function hideEmptyAncestors(ancestor, originalParents) {
    originalParents.forEach(node => {
      if (!node || node === ancestor || node.id === 'qInsightsLayoutFinal' || !node.isConnected) return;
      const meaningful = cleanText(node.textContent) || node.querySelector('input,button,textarea,canvas,svg,img');
      if (!meaningful) node.style.display = 'none';
    });
  }

  function ensureLayout(view, parts) {
    const nodes = [parts.scope, parts.evidence, parts.output, parts.repos, parts.qa].filter(Boolean);
    if (nodes.length < 5) return false;
    let shell = $('#qInsightsLayoutFinal', view);
    const ancestor = commonAncestor(nodes) || view;
    const originalParents = new Set();
    nodes.forEach(node => {
      let current = node.parentElement;
      while (current && current !== ancestor) { originalParents.add(current); current = current.parentElement; }
    });

    if (!shell) {
      const topNodes = [...new Set(nodes.map(node => topUnder(ancestor, node)).filter(Boolean))];
      let first = topNodes[0] || null;
      for (const node of topNodes.slice(1)) {
        if (first && (node.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_PRECEDING)) first = node;
      }
      shell = document.createElement('section');
      shell.id = 'qInsightsLayoutFinal';
      shell.setAttribute('aria-label', 'Quest Enterprise Insights Engine workspace');
      shell.innerHTML = '<div id="qInsightsEvidenceSlot"></div><div id="qInsightsRepositoriesSlot"></div><div id="qInsightsLeftSlot"></div><div id="qInsightsMainSlot"></div>';
      ancestor.insertBefore(shell, first);
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

    stripStepNumber(parts.evidence); stripStepNumber(parts.scope); stripStepNumber(parts.output);
    markInputTiles(parts.evidence, 'qif-evidence-option', 'qif-evidence-grid');
    markRepositoryTiles(parts.repos);
    markProjectTiles(parts.scope);
    markOutputTiles(parts.output);

    if (parts.evidence.parentElement !== evidenceSlot) evidenceSlot.appendChild(parts.evidence);
    if (parts.repos.parentElement !== reposSlot) reposSlot.appendChild(parts.repos);
    if (parts.scope.parentElement !== leftSlot) leftSlot.appendChild(parts.scope);
    if (parts.output.parentElement !== leftSlot) leftSlot.appendChild(parts.output);
    if (parts.qa.parentElement !== mainSlot) mainSlot.appendChild(parts.qa);

    hideEmptyAncestors(ancestor, originalParents);
    document.documentElement.dataset.insightsLayout = RELEASE;
    return true;
  }

  function layoutNeedsRepair(view) {
    const shell = $('#qInsightsLayoutFinal', view);
    if (!shell) return true;
    const parts = locate(view);
    if (!parts.scope || !parts.evidence || !parts.output || !parts.repos || !parts.qa) return false;
    return parts.evidence.parentElement?.id !== 'qInsightsEvidenceSlot' || parts.repos.parentElement?.id !== 'qInsightsRepositoriesSlot' || parts.scope.parentElement?.id !== 'qInsightsLeftSlot' || parts.output.parentElement?.id !== 'qInsightsLeftSlot' || parts.qa.parentElement?.id !== 'qInsightsMainSlot';
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

  function schedule(delay = 0) { clearTimeout(timer); timer = setTimeout(apply, delay); }

  function watch(view) {
    observer?.disconnect();
    observer = new MutationObserver(() => { if (layoutNeedsRepair(view)) schedule(120); });
    observer.observe(view, { childList:true, subtree:true });
  }

  function boot() {
    injectStyles();
    schedule(80);
    [450, 1100, 2200, 3600].forEach(delay => setTimeout(() => schedule(0), delay));
    window.addEventListener('quest:layout-refresh', () => schedule(150));
    window.addEventListener('hashchange', () => schedule(180));
    document.addEventListener('click', event => {
      const nav = event.target.closest?.('.nav-item');
      if (nav && /Insights Engine|Insights Copilot/i.test(nav.textContent || '')) schedule(260);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
