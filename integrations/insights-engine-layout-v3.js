(() => {
  'use strict';

  const RELEASE = '20260809q';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let observer = null;
  let timer = 0;
  let applying = false;

  const EVIDENCE = ['Final reports','PMR transcripts','Survey data','Research instruments','Presentation outputs','Competitive Intelligence','Newly uploaded files'];
  const REPOSITORIES = ['Microsoft SharePoint','OneDrive','Google Drive','NotebookLM export'];
  const PROJECTS = [
    'Redefining the Health System Experience',
    'Digital Customer Journey & Solutions Roadmap',
    'Data Ecosystem Needs',
    'Data Ecosystem Needs — Extended Study',
    'Lab Stewardship & Analytics Competitive Positioning',
    'US Consumer Testing Market — Company Profiles',
    'Clinical Laboratory Competitive Intelligence — Always On'
  ];
  const OUTPUTS = [
    'Executive synthesis','Evidence table','PowerPoint-ready storyline','Research brief',
    'Include verbatim transcript evidence','Show confidence, contradictions and coverage gaps','Recommend charts and slide exhibit'
  ];

  function clean(value = '') { return String(value).replace(/\s+/g, ' ').trim(); }
  function visible(node) {
    if (!node || !node.isConnected) return false;
    const style = getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function insightsView() {
    return $$('.view[data-view],main,[role="main"]')
      .find(node => visible(node) && /Quest Knowledge\s*&\s*Insights Engine|Quest Enterprise Insights Engine|Insights Copilot/i.test(node.textContent || '')) || null;
  }

  function countMatches(text, terms) {
    const haystack = clean(text).toLowerCase();
    return terms.reduce((count, term) => count + (haystack.includes(term.toLowerCase()) ? 1 : 0), 0);
  }

  function findSourceBlock(view, terms, minMatches) {
    const candidates = $$('section,aside,article,form,ul,div', view)
      .filter(node => !node.closest('#qieWorkspaceV3'))
      .map(node => {
        const text = clean(node.textContent);
        const matches = countMatches(text, terms);
        const interactive = node.querySelectorAll('input,button,[role="button"],[role="checkbox"],[role="radio"],[role="switch"]').length;
        return { node, text, matches, interactive };
      })
      .filter(item => item.matches >= minMatches && item.interactive > 0 && item.text.length < 18000)
      .sort((a, b) => (b.matches - a.matches) || (a.text.length - b.text.length));
    return candidates[0]?.node || null;
  }

  function findQaPanel(view) {
    return $$('section,article,div,.panel,.card,.q-ui-card,.flo-panel,[class*="panel"],[class*="card"]', view)
      .filter(node => !node.closest('#qieWorkspaceV3'))
      .filter(node => /Quest Enterprise Insights Engine|Ask a new business question across Quest|Generate answer/i.test(node.textContent || ''))
      .filter(node => node.querySelector('textarea,input[type="text"],[contenteditable="true"]'))
      .filter(node => clean(node.textContent).length < 9000)
      .sort((a, b) => clean(a.textContent).length - clean(b.textContent).length)[0] || null;
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

  function cardForTerm(root, term) {
    const target = term.toLowerCase();
    return $$('label,article,li,div,[class*="card"],[class*="option"],[class*="tile"]', root)
      .filter(node => clean(node.textContent).toLowerCase().includes(target))
      .filter(node => node.querySelector('input,button,[role="button"],[role="checkbox"],[role="radio"],[role="switch"]') || node.matches('label'))
      .filter(node => clean(node.textContent).length < 1200)
      .sort((a, b) => clean(a.textContent).length - clean(b.textContent).length)[0] || null;
  }

  function collectCards(root, terms) {
    const cards = [];
    terms.forEach(term => {
      const card = cardForTerm(root, term);
      if (card && !cards.some(existing => existing === card || existing.contains(card) || card.contains(existing))) cards.push(card);
    });
    if (!cards.length) {
      $$('input[type="checkbox"],input[type="radio"]', root).forEach(input => {
        const card = input.closest('label,[class*="card"],[class*="option"],[class*="tile"]') || input.parentElement;
        if (card && !cards.includes(card)) cards.push(card);
      });
    }
    return cards;
  }

  function findAction(source, label) {
    const target = label.toLowerCase();
    return $$('button,[role="button"],a', source).find(node => clean(node.textContent).toLowerCase() === target) || null;
  }

  function makeHeader(title, description, icon, actions, source) {
    const header = document.createElement('div');
    header.className = 'qie-header';
    const copy = document.createElement('div');
    copy.className = 'qie-header-copy';
    copy.innerHTML = `<div class="qie-title"><span class="qie-icon">${icon}</span><span>${title}</span></div><div class="qie-desc">${description}</div>`;
    header.appendChild(copy);
    if (actions?.length) {
      const controls = document.createElement('div');
      controls.className = 'qie-header-actions';
      actions.forEach(label => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', () => findAction(source, label)?.click());
        controls.appendChild(button);
      });
      header.appendChild(controls);
    }
    return header;
  }

  function makePanel(id, title, description, icon, actions, source, cards, gridClass) {
    const panel = document.createElement('section');
    panel.id = id;
    panel.className = 'qie-panel';
    panel.appendChild(makeHeader(title, description, icon, actions, source));
    const body = document.createElement('div');
    body.className = `qie-body ${gridClass || ''}`;
    cards.forEach(card => {
      card.classList.add('qie-option-card');
      body.appendChild(card);
    });
    panel.appendChild(body);
    return panel;
  }

  function hideLegacyPanel(view, pattern) {
    const heading = $$('h1,h2,h3,h4,h5,h6,strong,.title,.panel-title,.section-title', view)
      .find(node => pattern.test(clean(node.textContent)) && !node.closest('#qieWorkspaceV3'));
    if (!heading) return;
    let current = heading;
    for (let depth = 0; current && current !== view && depth < 7; depth += 1, current = current.parentElement) {
      if (current.matches?.('section,aside,article,.panel,.card,.q-ui-card,.flo-panel,[class*="panel"],[class*="card"]')) {
        current.style.display = 'none';
        return;
      }
    }
    heading.style.display = 'none';
  }

  function hideEmptyChain(node, stop) {
    let current = node;
    for (let depth = 0; current && current !== stop && depth < 6; depth += 1, current = current.parentElement) {
      if (current.closest?.('#qieWorkspaceV3')) break;
      const text = clean(current.textContent);
      const live = current.querySelector('input,button,textarea,[contenteditable="true"],canvas,svg,img');
      if (!text && !live) current.style.display = 'none';
    }
  }

  function injectStyles() {
    let style = $('#qieWorkspaceV3Styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qieWorkspaceV3Styles';
      document.head.appendChild(style);
    }
    style.textContent = `
      #qieWorkspaceV3{
        --green:#034c1f;--mid:#35792a;--lime:#c6d52f;--blue:#00587c;--line:#d8e3d9;--soft:#f7faf6;
        display:grid!important;grid-template-columns:minmax(305px,340px) minmax(0,1fr)!important;
        grid-template-areas:"evidence evidence" "repos repos" "sidebar main"!important;
        gap:16px!important;width:100%!important;max-width:none!important;min-width:0!important;
        margin:14px 0 28px!important;grid-column:1/-1!important;flex:0 0 100%!important;position:relative!important;
      }
      #qieWorkspaceV3 *{box-sizing:border-box}
      #qieEvidenceV3{grid-area:evidence}
      #qieRepositoriesV3{grid-area:repos}
      #qieSidebarV3{grid-area:sidebar;display:grid;gap:16px;align-content:start;min-width:0}
      #qieMainV3{grid-area:main;min-width:0}
      #qieWorkspaceV3 .qie-panel,
      #qieMainV3{
        width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;
        border:1px solid var(--line)!important;border-radius:14px!important;background:#fff!important;
        box-shadow:0 7px 22px rgba(3,76,31,.055)!important;overflow:hidden!important;position:relative!important;
      }
      #qieEvidenceV3{border-top:3px solid var(--lime)!important}
      #qieRepositoriesV3{border-top:3px solid var(--blue)!important}
      #qieProjectsV3{border-top:3px solid var(--mid)!important}
      #qieOutputV3{border-top:3px solid var(--green)!important}
      #qieMainV3{border-top:3px solid var(--green)!important;min-height:690px!important;overflow:visible!important}
      #qieMainV3 > *{width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;position:static!important;transform:none!important}
      #qieMainV3 textarea{width:100%!important;min-height:88px!important;font-size:13px!important}

      #qieWorkspaceV3 .qie-header{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:16px!important;padding:14px 16px 12px!important;border-bottom:1px solid #e2e9e1!important;background:linear-gradient(180deg,#fff,#fbfdfb)!important}
      #qieWorkspaceV3 .qie-header-copy{min-width:0!important}
      #qieWorkspaceV3 .qie-title{display:flex!important;align-items:center!important;gap:9px!important;color:var(--green)!important;font-size:16px!important;font-weight:750!important;line-height:1.2!important}
      #qieWorkspaceV3 .qie-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:28px!important;height:28px!important;border-radius:8px!important;background:#edf5e9!important;color:var(--green)!important;font-size:15px!important;flex:0 0 28px!important}
      #qieWorkspaceV3 .qie-desc{margin:5px 0 0 37px!important;color:#5d6d78!important;font-size:12px!important;line-height:1.35!important}
      #qieWorkspaceV3 .qie-header-actions{display:flex!important;gap:8px!important;flex:0 0 auto!important}
      #qieWorkspaceV3 .qie-header-actions button{border:0!important;background:transparent!important;color:var(--green)!important;font-size:12px!important;font-weight:700!important;padding:6px 8px!important;cursor:pointer!important}

      #qieWorkspaceV3 .qie-body{padding:16px!important;min-width:0!important;position:static!important;transform:none!important}
      #qieWorkspaceV3 .qie-evidence-grid{display:grid!important;grid-template-columns:repeat(4,minmax(155px,1fr))!important;gap:10px!important}
      #qieWorkspaceV3 .qie-repo-grid{display:grid!important;grid-template-columns:repeat(4,minmax(190px,1fr))!important;gap:12px!important}
      #qieWorkspaceV3 .qie-project-grid,#qieWorkspaceV3 .qie-output-grid{display:grid!important;grid-template-columns:1fr!important;gap:9px!important}
      #qieWorkspaceV3 .qie-option-card{
        width:100%!important;max-width:none!important;min-width:0!important;height:auto!important;min-height:0!important;
        margin:0!important;padding:12px!important;position:static!important;inset:auto!important;transform:none!important;float:none!important;
        border:1px solid #d9e5d6!important;border-radius:10px!important;background:#f9fcf7!important;box-shadow:none!important;
        overflow:visible!important;white-space:normal!important;line-height:1.35!important;
      }
      #qieWorkspaceV3 .qie-option-card:has(input:checked){border-color:#91b781!important;background:#edf6e8!important}
      #qieWorkspaceV3 .qie-option-card :is(p,span,small,label,button,strong){font-size:12px!important;line-height:1.35!important;white-space:normal!important}
      #qieWorkspaceV3 .qie-option-card button{min-height:32px!important;border-radius:7px!important}
      #qieProjectsV3 .qie-body{max-height:620px!important;overflow:auto!important}
      #qieOutputV3 .qie-body{overflow:visible!important}

      @media(max-width:1250px){
        #qieWorkspaceV3 .qie-evidence-grid,#qieWorkspaceV3 .qie-repo-grid{grid-template-columns:repeat(2,minmax(165px,1fr))!important}
      }
      @media(max-width:960px){
        #qieWorkspaceV3{grid-template-columns:1fr!important;grid-template-areas:"evidence" "repos" "sidebar" "main"!important}
        #qieProjectsV3 .qie-body{max-height:none!important}
      }
      @media(max-width:620px){
        #qieWorkspaceV3 .qie-evidence-grid,#qieWorkspaceV3 .qie-repo-grid{grid-template-columns:1fr!important}
      }
    `;
  }

  function build(view) {
    const evidenceSource = findSourceBlock(view, EVIDENCE, 4);
    const repoSource = findSourceBlock(view, REPOSITORIES, 3);
    const projectSource = findSourceBlock(view, PROJECTS, 4);
    const outputSource = findSourceBlock(view, OUTPUTS, 4);
    const qa = findQaPanel(view);
    if (!evidenceSource || !repoSource || !projectSource || !outputSource || !qa) return false;

    const evidenceCards = collectCards(evidenceSource, EVIDENCE);
    const repoCards = collectCards(repoSource, REPOSITORIES);
    const projectCards = collectCards(projectSource, PROJECTS);
    const outputCards = collectCards(outputSource, OUTPUTS);
    if (evidenceCards.length < 4 || repoCards.length < 3 || projectCards.length < 4 || outputCards.length < 4) return false;

    const sourceNodes = [evidenceSource, repoSource, projectSource, outputSource, qa];
    const ancestor = commonAncestor(sourceNodes) || view;
    const firstTop = sourceNodes.map(node => topUnder(ancestor, node)).filter(Boolean).sort((a, b) => {
      if (a === b) return 0;
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    })[0] || null;

    let shell = $('#qieWorkspaceV3', view);
    if (!shell) {
      shell = document.createElement('section');
      shell.id = 'qieWorkspaceV3';
      shell.setAttribute('aria-label', 'Quest Enterprise Insights Engine workspace');
      shell.innerHTML = '<div id="qieEvidenceSlotV3"></div><div id="qieRepositoriesSlotV3"></div><div id="qieSidebarV3"></div><div id="qieMainV3"></div>';
      ancestor.insertBefore(shell, firstTop);
    }

    const evidencePanel = makePanel('qieEvidenceV3','Select evidence types','Limit retrieval to the exact files required for the question.','▦',['All','Clear'],evidenceSource,evidenceCards,'qie-evidence-grid');
    const repoPanel = makePanel('qieRepositoriesV3','Connected repositories','Toggle enterprise data sources into the governed knowledge layer.','⇄',['Manage all'],repoSource,repoCards,'qie-repo-grid');
    const projectPanel = makePanel('qieProjectsV3','Select project scope','All projects are selected by default. Choose one or more for a focused answer.','◫',['All','Clear'],projectSource,projectCards,'qie-project-grid');
    const outputPanel = makePanel('qieOutputV3','Output configuration','Choose an answer format aligned to the business use case.','✓',[],outputSource,outputCards,'qie-output-grid');

    $('#qieEvidenceSlotV3', shell).replaceChildren(evidencePanel);
    $('#qieRepositoriesSlotV3', shell).replaceChildren(repoPanel);
    $('#qieSidebarV3', shell).replaceChildren(projectPanel, outputPanel);
    const main = $('#qieMainV3', shell);
    if (qa.parentElement !== main) main.replaceChildren(qa);

    [evidenceSource,repoSource,projectSource,outputSource].forEach(source => {
      if (!source.closest('#qieWorkspaceV3')) source.style.display = 'none';
      hideEmptyChain(source.parentElement, ancestor);
    });

    hideLegacyPanel(view, /^\s*\d*\.?\s*Select evidence types\s*$/i);
    hideLegacyPanel(view, /^\s*Connected repositories\s*$/i);
    hideLegacyPanel(view, /^\s*\d*\.?\s*Select project scope\s*$/i);
    hideLegacyPanel(view, /^\s*\d*\.?\s*Output configuration\s*$/i);
    hideLegacyPanel(view, /^\s*Current retrieval scope\s*$/i);
    hideLegacyPanel(view, /^\s*Recent ingestion\s*$/i);

    document.documentElement.dataset.insightsLayout = RELEASE;
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    return true;
  }

  function needsRepair(view) {
    const shell = $('#qieWorkspaceV3', view);
    if (!shell) return true;
    return !$('#qieEvidenceV3', shell) || !$('#qieRepositoriesV3', shell) || !$('#qieProjectsV3', shell) || !$('#qieOutputV3', shell) || !$('#qieMainV3 textarea', shell);
  }

  function apply() {
    if (applying) return;
    const view = insightsView();
    if (!view || !needsRepair(view)) return;
    applying = true;
    observer?.disconnect();
    try { injectStyles(); build(view); }
    finally { applying = false; watch(view); }
  }

  function schedule(delay = 0) { clearTimeout(timer); timer = setTimeout(apply, delay); }

  function watch(view) {
    observer?.disconnect();
    observer = new MutationObserver(mutations => {
      const relevant = mutations.some(mutation => !mutation.target.closest?.('#qieWorkspaceV3'));
      if (relevant && needsRepair(view)) schedule(140);
    });
    observer.observe(view, { childList:true, subtree:true });
  }

  function boot() {
    injectStyles();
    schedule(100);
    [450,1000,1800,3000].forEach(delay => setTimeout(() => schedule(0), delay));
    window.addEventListener('quest:layout-refresh', () => schedule(160));
    window.addEventListener('hashchange', () => schedule(180));
    document.addEventListener('click', event => {
      const nav = event.target.closest?.('.nav-item');
      if (nav && /Insights Engine|Insights Copilot/i.test(nav.textContent || '')) schedule(260);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
