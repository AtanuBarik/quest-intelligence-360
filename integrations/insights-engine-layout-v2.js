(() => {
  'use strict';

  const RELEASE = '20260809p';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let observer = null;
  let timer = 0;
  let applying = false;

  const SECTIONS = {
    evidence: {
      title: 'Select evidence types',
      description: 'Limit retrieval to the exact files required for the question.',
      icon: '▦',
      terms: ['Final reports', 'PMR transcripts', 'Survey data', 'Research instruments'],
      minMatches: 2,
      actions: ['All', 'Clear']
    },
    repositories: {
      title: 'Connected repositories',
      description: 'Toggle enterprise data sources into the governed knowledge layer.',
      icon: '⇄',
      terms: ['Microsoft SharePoint', 'OneDrive', 'Google Drive', 'NotebookLM export'],
      minMatches: 2,
      actions: ['Manage all']
    },
    scope: {
      title: 'Select project scope',
      description: 'All projects are selected by default. Choose one or more for a focused answer.',
      icon: '◫',
      terms: [
        'Redefining the Health System Experience',
        'Digital Customer Journey & Solutions Roadmap',
        'Data Ecosystem Needs',
        'Data Ecosystem Needs — Extended Study',
        'Lab Stewardship & Analytics Competitive Positioning',
        'US Consumer Testing Market — Company Profiles',
        'Clinical Laboratory Competitive Intelligence — Always On'
      ],
      minMatches: 3,
      actions: ['All', 'Clear']
    },
    output: {
      title: 'Output configuration',
      description: 'Choose an answer format aligned to the business use case.',
      icon: '✓',
      terms: [
        'Executive synthesis',
        'Evidence table',
        'PowerPoint-ready storyline',
        'Research brief',
        'Include verbatim transcript evidence',
        'Show confidence, contradictions and coverage gaps',
        'Recommend charts and slide exhibit'
      ],
      minMatches: 3,
      actions: []
    }
  };

  const PROJECT_META = [
    ['Redefining the Health System Experience', 'Health Systems · Active', '25 files'],
    ['Digital Customer Journey & Solutions Roadmap', 'Health Systems & Physician Groups · Active', '31 files'],
    ['Data Ecosystem Needs — Extended Study', 'Partnerships & Data Ecosystem · Active', '12 files'],
    ['Data Ecosystem Needs', 'Interoperability & Digital Strategy · Active', '13 files'],
    ['Lab Stewardship & Analytics Competitive Positioning', 'Analytics & Stewardship · Active', '17 files'],
    ['US Consumer Testing Market — Company Profiles', 'Consumer Health · Completed', '2 files'],
    ['Clinical Laboratory Competitive Intelligence — Always On', 'MACI / Competitive Intelligence · Always on', '6 files']
  ];

  const OUTPUT_META = [
    ['Executive synthesis', 'Concise answer with implications and evidence'],
    ['Evidence table', 'Project, source, finding, confidence and citation'],
    ['PowerPoint-ready storyline', 'Headlines, support and recommended exhibits'],
    ['Research brief', 'Background, synthesis, gaps and next actions']
  ];

  const REPO_META = [
    ['Microsoft SharePoint', 'Folder-level sync, permissions and incremental indexing'],
    ['OneDrive', 'Personal and shared files with Microsoft Graph'],
    ['Google Drive', 'Import NotebookLM source folders and research files'],
    ['NotebookLM export', 'Import source lists, notes and exported artifacts']
  ];

  function clean(value = '') { return String(value).replace(/\s+/g, ' ').trim(); }
  function visible(node) {
    if (!node || !node.isConnected) return false;
    const style = getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function insightsView() {
    return $$('.view[data-view],main,[role="main"]').find(node =>
      visible(node) && /Quest Knowledge\s*&\s*Insights Engine|Quest Enterprise Insights Engine|Insights Copilot/i.test(node.textContent || '')
    ) || null;
  }

  function matches(text, terms) {
    const lower = clean(text).toLowerCase();
    return terms.reduce((count, term) => count + (lower.includes(term.toLowerCase()) ? 1 : 0), 0);
  }

  function findOptionGroup(view, spec) {
    const candidates = $$('section,aside,article,form,fieldset,ul,div', view)
      .filter(node => !node.closest('#qInsightsLayoutV2'))
      .map(node => {
        const text = clean(node.textContent);
        const matchCount = matches(text, spec.terms);
        const controls = node.querySelectorAll('input[type="checkbox"],input[type="radio"],button,[role="button"],[role="switch"]').length;
        return { node, text, matchCount, controls };
      })
      .filter(item => item.matchCount >= spec.minMatches && item.controls >= Math.min(2, spec.minMatches))
      .filter(item => item.text.length < 12000)
      .sort((a, b) => b.matchCount - a.matchCount || a.text.length - b.text.length);
    return candidates[0]?.node || null;
  }

  function findQaPanel(view) {
    const candidates = $$('section,article,div,.panel,.card,.q-ui-card,.flo-panel', view)
      .filter(node => !node.closest('#qInsightsLayoutV2'))
      .filter(node => /Quest Enterprise Insights Engine|Ask a new business question across Quest|Generate answer/i.test(node.textContent || ''))
      .filter(node => node.querySelector('textarea,input[type="text"],[contenteditable="true"]'))
      .map(node => ({ node, len: clean(node.textContent).length }))
      .filter(item => item.len < 9000)
      .sort((a, b) => a.len - b.len);
    return candidates[0]?.node || null;
  }

  function exactTextNodes(root, text) {
    const target = text.toLowerCase();
    return $$('h1,h2,h3,h4,h5,h6,strong,span,div,p', root).filter(node => clean(node.textContent).toLowerCase() === target);
  }

  function nearestCard(node) {
    return node?.closest('section,aside,article,.panel,.card,.q-ui-card,.flo-panel,[class*="panel"],[class*="card"]') || node?.parentElement || null;
  }

  function findDetachedHeaderCard(view, spec, group) {
    const headings = exactTextNodes(view, spec.title);
    for (const heading of headings) {
      const card = nearestCard(heading);
      if (!card || card.closest('#qInsightsLayoutV2')) continue;
      if (group && (card === group || card.contains(group) || group.contains(card))) continue;
      if (clean(card.textContent).length < 800) return card;
    }
    return null;
  }

  function takeActions(source, labels, target) {
    if (!source || !target || !labels.length) return;
    const wanted = labels.map(label => label.toLowerCase());
    $$('button,a,[role="button"]', source).forEach(control => {
      const text = clean(control.textContent).toLowerCase();
      if (wanted.includes(text)) target.appendChild(control);
    });
  }

  function smallestCard(root, label) {
    const lower = label.toLowerCase();
    return $$('label,article,li,div,[class*="card"],[class*="option"],[class*="tile"]', root)
      .filter(node => clean(node.textContent).toLowerCase().includes(lower))
      .filter(node => clean(node.textContent).length < 700)
      .sort((a, b) => clean(a.textContent).length - clean(b.textContent).length)[0] || null;
  }

  function optionCard(input, root) {
    const direct = input.closest('label,article,li,.option,.tile,.card,[class*="option"],[class*="tile"]');
    if (direct && direct !== root) return direct;
    let best = null;
    let current = input.parentElement;
    for (let depth = 0; current && current !== root && depth < 5; depth += 1, current = current.parentElement) {
      const text = clean(current.textContent);
      if (text && text.length < 650) best = current;
    }
    return best;
  }

  function markInputCards(group, className) {
    const cards = [];
    $$('input[type="checkbox"],input[type="radio"]', group).forEach(input => {
      const card = optionCard(input, group);
      if (card && !cards.includes(card)) cards.push(card);
    });
    cards.forEach(card => card.classList.add(className));
    const parent = cards.length && cards.every(card => card.parentElement === cards[0].parentElement) ? cards[0].parentElement : null;
    if (parent) parent.classList.add(`${className}-grid`);
    return cards;
  }

  function ensureMeta(group, map, className) {
    map.forEach(([name, description, extra]) => {
      const card = smallestCard(group, name);
      if (!card) return;
      card.classList.add(className);
      const text = clean(card.textContent);
      const pieces = [description, extra].filter(Boolean);
      const missing = pieces.filter(piece => !text.toLowerCase().includes(piece.toLowerCase()));
      if (missing.length && !$('.qif-meta-line', card)) {
        const meta = document.createElement('div');
        meta.className = 'qif-meta-line';
        meta.textContent = pieces.join(' · ');
        card.appendChild(meta);
      }
    });
  }

  function markRepositories(group) {
    REPO_META.forEach(([name, description]) => {
      const card = smallestCard(group, name);
      if (!card) return;
      card.classList.add('qif-repo-option');
      if (!clean(card.textContent).toLowerCase().includes(description.toLowerCase()) && !$('.qif-meta-line', card)) {
        const meta = document.createElement('div');
        meta.className = 'qif-meta-line';
        meta.textContent = description;
        card.appendChild(meta);
      }
    });
  }

  function hideEmbeddedLegacyHeading(group, spec, actionTarget) {
    exactTextNodes(group, spec.title).forEach(heading => {
      if (heading.closest('.qif-section-head')) return;
      let block = heading.parentElement;
      for (let depth = 0; block && block !== group && depth < 3; depth += 1, block = block.parentElement) {
        if (clean(block.textContent).length < 800) {
          takeActions(block, spec.actions, actionTarget);
          block.style.display = 'none';
          return;
        }
      }
      heading.style.display = 'none';
    });
  }

  function createSection(key, spec) {
    const section = document.createElement('section');
    section.className = `qif-section qif-${key}`;
    section.dataset.qifSection = key;
    section.innerHTML = `
      <header class="qif-section-head">
        <div class="qif-section-title"><span class="qif-icon">${spec.icon}</span><div><h3>${spec.title}</h3><p>${spec.description}</p></div></div>
        <div class="qif-section-actions"></div>
      </header>
      <div class="qif-section-body"></div>`;
    return section;
  }

  function commonAncestor(nodes) {
    let current = nodes[0];
    while (current && !nodes.every(node => current.contains(node))) current = current.parentElement;
    return current;
  }

  function topUnder(ancestor, node) {
    let current = node;
    while (current?.parentElement && current.parentElement !== ancestor) current = current.parentElement;
    return current;
  }

  function earliest(nodes) {
    let first = nodes[0] || null;
    for (const node of nodes.slice(1)) {
      if (first && (node.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_PRECEDING)) first = node;
    }
    return first;
  }

  function cleanupEmptyParents(candidates, shell) {
    candidates.forEach(node => {
      if (!node || node === shell || node.contains(shell) || !node.isConnected) return;
      const meaningful = clean(node.textContent) || node.querySelector('input,button,textarea,canvas,svg,img');
      if (!meaningful) node.style.display = 'none';
    });
  }

  function injectStyles() {
    let style = $('#qInsightsLayoutV2Styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qInsightsLayoutV2Styles';
      document.head.appendChild(style);
    }
    style.textContent = `
      #qInsightsLayoutV2{
        --qif-green:#034c1f;--qif-mid:#35792a;--qif-lime:#c6d52f;--qif-blue:#00587c;
        --qif-line:#d9e4da;--qif-soft:#f7faf6;--qif-shadow:0 7px 22px rgba(3,76,31,.055);
        display:grid!important;grid-template-columns:minmax(292px,318px) minmax(0,1fr)!important;
        grid-template-areas:"evidence evidence" "repos repos" "left main"!important;
        gap:16px!important;width:100%!important;max-width:none!important;margin:14px 0 24px!important;align-items:start!important;
      }
      #qInsightsLayoutV2 *{box-sizing:border-box}
      #qInsightsEvidenceV2{grid-area:evidence}.qif-repositories{grid-area:repos}#qInsightsLeftV2{grid-area:left;display:grid;gap:16px;align-content:start;min-width:0}#qInsightsMainV2{grid-area:main;min-width:0}
      .qif-section,#qInsightsMainV2>.qif-qa{
        width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;
        border:1px solid var(--qif-line)!important;border-radius:14px!important;background:linear-gradient(180deg,#fff 0%,#fbfdfb 100%)!important;box-shadow:var(--qif-shadow)!important;
      }
      .qif-evidence{border-top:3px solid var(--qif-lime)!important}.qif-repositories{border-top:3px solid var(--qif-blue)!important}.qif-scope{border-top:3px solid var(--qif-mid)!important}.qif-output{border-top:3px solid var(--qif-green)!important}#qInsightsMainV2>.qif-qa{border-top:3px solid var(--qif-green)!important;min-height:690px!important}
      .qif-section-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:12px!important;padding:13px 14px 11px!important;border-bottom:1px solid #e2e9e3!important;background:#fbfdfb!important;border-radius:11px 11px 0 0!important}
      .qif-section-title{display:flex!important;gap:10px!important;min-width:0!important}.qif-section-title h3{margin:0!important;color:var(--qif-green)!important;font-size:15px!important;line-height:1.25!important}.qif-section-title p{margin:4px 0 0!important;color:#647067!important;font-size:12px!important;line-height:1.4!important}.qif-icon{width:27px;height:27px;display:grid;place-items:center;border-radius:8px;background:#edf4e9;color:var(--qif-green);font-weight:800;flex:0 0 auto}.qif-section-actions{display:flex;gap:8px;align-items:center;flex:0 0 auto}.qif-section-actions :is(button,a){font-size:12px!important;font-weight:700!important;color:var(--qif-green)!important}
      .qif-section-body{padding:12px!important;min-width:0!important;overflow:visible!important;max-height:none!important}.qif-section-body>div,.qif-section-body>section,.qif-section-body>article,.qif-section-body>ul,.qif-section-body>form{max-width:none!important;width:100%!important;max-height:none!important;overflow:visible!important;margin:0!important}
      .qif-evidence-option-grid{display:grid!important;grid-template-columns:repeat(4,minmax(155px,1fr))!important;gap:10px!important}.qif-evidence-option{display:flex!important;align-items:center!important;gap:9px!important;min-height:58px!important;padding:11px 12px!important;margin:0!important;border:1px solid #d9e5d6!important;border-radius:10px!important;background:#f9fcf7!important}.qif-evidence-option:has(input:checked){border-color:#9bbd8b!important;background:#edf6e8!important}
      .qif-repositories .qif-section-body{display:grid!important;grid-template-columns:repeat(4,minmax(180px,1fr))!important;gap:10px!important}.qif-repo-option{min-width:0!important;padding:12px!important;border:1px solid #dce6e0!important;border-radius:10px!important;background:linear-gradient(180deg,#fff,#f7faf8)!important}.qif-repo-option button{min-height:32px!important;border-radius:7px!important}
      .qif-project-option-grid,.qif-output-option-grid{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}.qif-project-option,.qif-output-option{display:block!important;min-width:0!important;padding:11px!important;margin:0!important;border:1px solid #d9e5d6!important;border-radius:10px!important;background:#f9fcf7!important}.qif-project-option{min-height:68px!important}.qif-output-option{min-height:58px!important}.qif-project-option:has(input:checked),.qif-output-option:has(input:checked){border-color:#9bbd8b!important;background:#edf6e8!important}.qif-meta-line{margin-top:5px!important;color:#6a756e!important;font-size:11px!important;line-height:1.35!important}
      #qInsightsMainV2>.qif-qa{display:flex!important;flex-direction:column!important;width:100%!important;max-width:none!important;min-width:0!important}#qInsightsMainV2>.qif-qa textarea{min-height:88px!important;width:100%!important;font-size:13px!important}#qInsightsMainV2>.qif-qa :is(.chat,.conversation,.messages,[class*="message"],[class*="answer"],[class*="workspace"],[class*="conversation"]){max-width:none!important;width:100%!important}
      #qInsightsLayoutV2 :is(p,span,small,label,button,input,textarea){font-size:max(12px,1em)!important}
      .qif-detached-heading{display:none!important}
      @media(max-width:1180px){.qif-evidence-option-grid,.qif-repositories .qif-section-body{grid-template-columns:repeat(2,minmax(155px,1fr))!important}}
      @media(max-width:900px){#qInsightsLayoutV2{grid-template-columns:1fr!important;grid-template-areas:"evidence" "repos" "left" "main"!important}}
      @media(max-width:620px){.qif-evidence-option-grid,.qif-repositories .qif-section-body{grid-template-columns:1fr!important}}
    `;
  }

  function decorateSection(section, group, key, spec) {
    const actions = $('.qif-section-actions', section);
    const detached = findDetachedHeaderCard(insightsView(), spec, group);
    if (detached) {
      takeActions(detached, spec.actions, actions);
      detached.classList.add('qif-detached-heading');
      detached.style.display = 'none';
    }
    hideEmbeddedLegacyHeading(group, spec, actions);

    if (key === 'evidence') markInputCards(group, 'qif-evidence-option');
    if (key === 'scope') {
      markInputCards(group, 'qif-project-option');
      ensureMeta(group, PROJECT_META, 'qif-project-option');
    }
    if (key === 'output') {
      markInputCards(group, 'qif-output-option');
      ensureMeta(group, OUTPUT_META, 'qif-output-option');
    }
    if (key === 'repositories') markRepositories(group);

    const body = $('.qif-section-body', section);
    if (group.parentElement !== body) body.appendChild(group);
  }

  function apply() {
    if (applying) return;
    const view = insightsView();
    if (!view) return;

    const groups = {
      evidence: findOptionGroup(view, SECTIONS.evidence),
      repositories: findOptionGroup(view, SECTIONS.repositories),
      scope: findOptionGroup(view, SECTIONS.scope),
      output: findOptionGroup(view, SECTIONS.output)
    };
    const qa = findQaPanel(view);
    if (!groups.evidence || !groups.repositories || !groups.scope || !groups.output || !qa) return;

    applying = true;
    observer?.disconnect();
    try {
      injectStyles();
      const originals = [groups.evidence, groups.repositories, groups.scope, groups.output, qa];
      const ancestor = commonAncestor(originals) || view;
      const oldParents = new Set();
      originals.forEach(node => {
        let current = node.parentElement;
        while (current && current !== ancestor) { oldParents.add(current); current = current.parentElement; }
      });

      let shell = $('#qInsightsLayoutV2', view);
      if (!shell) {
        shell = document.createElement('section');
        shell.id = 'qInsightsLayoutV2';
        shell.setAttribute('aria-label', 'Quest Enterprise Insights Engine workspace');
        shell.innerHTML = '<div id="qInsightsEvidenceV2"></div><div id="qInsightsRepositoriesV2"></div><aside id="qInsightsLeftV2"></aside><main id="qInsightsMainV2"></main>';
        const topNodes = [...new Set(originals.map(node => topUnder(ancestor, node)).filter(Boolean))];
        ancestor.insertBefore(shell, earliest(topNodes));
      }

      const evidenceSlot = $('#qInsightsEvidenceV2', shell);
      const repoSlot = $('#qInsightsRepositoriesV2', shell);
      const left = $('#qInsightsLeftV2', shell);
      const main = $('#qInsightsMainV2', shell);

      const destinations = { evidence: evidenceSlot, repositories: repoSlot, scope: left, output: left };
      Object.entries(groups).forEach(([key, group]) => {
        let section = $(`.qif-section[data-qif-section="${key}"]`, shell);
        if (!section) section = createSection(key, SECTIONS[key]);
        if (section.parentElement !== destinations[key]) destinations[key].appendChild(section);
        decorateSection(section, group, key, SECTIONS[key]);
      });

      qa.classList.add('qif-qa');
      if (qa.parentElement !== main) main.appendChild(qa);

      cleanupEmptyParents(oldParents, shell);
      $('#qInsightsLayoutFinal', view)?.remove();
      document.documentElement.dataset.insightsLayout = RELEASE;
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    } finally {
      applying = false;
      watch(view);
    }
  }

  function needsRepair(view) {
    const shell = $('#qInsightsLayoutV2', view);
    if (!shell) return true;
    return !$('#qInsightsEvidenceV2 .qif-section-body', shell)?.children.length ||
      !$('#qInsightsRepositoriesV2 .qif-section-body', shell)?.children.length ||
      !$('#qInsightsLeftV2 .qif-scope .qif-section-body', shell)?.children.length ||
      !$('#qInsightsLeftV2 .qif-output .qif-section-body', shell)?.children.length ||
      !$('#qInsightsMainV2 .qif-qa', shell);
  }

  function schedule(delay = 0) { clearTimeout(timer); timer = setTimeout(apply, delay); }
  function watch(view) {
    observer?.disconnect();
    observer = new MutationObserver(() => { if (needsRepair(view)) schedule(120); });
    observer.observe(view, { childList:true, subtree:true });
  }

  function boot() {
    injectStyles();
    [80, 450, 1100, 2200, 3600].forEach(delay => setTimeout(() => schedule(0), delay));
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