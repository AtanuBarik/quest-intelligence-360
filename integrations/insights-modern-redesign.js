(() => {
  'use strict';

  const RELEASE = '20260916ux4';
  const SHORT_LABELS = {
    q1: 'Portfolio themes, outcomes & recommendations',
    q2: 'Persona comparison across research evidence'
  };
  const QUESTION_ICONS = { q1: '◆', q2: '◫' };
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  let queued = false;

  function fileIcon(type, label) {
    const labels = { pdf: 'PDF', doc: 'DOCX', xls: 'XLSX', ppt: 'PPTX', csv: 'CSV', file: 'FILE' };
    return `<span class="qim-file-icon qim-${type}" aria-hidden="true"><i></i><b>${label || labels[type] || 'FILE'}</b></span>`;
  }

  function ensureStyles() {
    let style = document.getElementById('qim-modern-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qim-modern-styles';
    }
    style.textContent = `
      :root{--qim-green:#034c1f;--qim-mid:#35792a;--qim-lime:#c6d52f;--qim-blue:#0067a0;--qim-line:#dfe8e1;--qim-soft:#f7faf7;--qim-muted:#6b786f}
      .qim-status-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:4px 0 12px;width:100%;font-family:Arial,Helvetica,sans-serif}
      .qim-status-card{min-width:0;border:1px solid #e2e9e3;border-radius:11px;background:#fff;box-shadow:0 4px 16px rgba(3,76,31,.045);padding:10px 11px;display:grid;grid-template-columns:28px 1fr;gap:9px;align-items:center}
      .qim-status-icon{width:28px;height:28px;border-radius:9px;background:#edf5e9;color:var(--qim-green);display:grid;place-items:center;font-size:15px;font-weight:800}
      .qim-status-card b{display:block;font-size:9px;line-height:1.2;color:#35513f;margin-bottom:3px}.qim-status-card span{display:block;min-width:0;font-size:9px;line-height:1.25;color:#7a887f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3{display:grid!important;grid-template-columns:minmax(215px,245px) minmax(0,1fr)!important;grid-template-areas:"repos main" "evidence main" "sidebar main"!important;gap:12px!important;margin:0 0 28px!important;align-items:start!important;background:transparent!important}
      html[data-qim-layout="${RELEASE}"] #qieRepositoriesV3{grid-area:repos!important}
      html[data-qim-layout="${RELEASE}"] #qieEvidenceV3{grid-area:evidence!important}
      html[data-qim-layout="${RELEASE}"] #qieSidebarV3{grid-area:sidebar!important;display:grid!important;gap:12px!important;align-content:start!important}
      html[data-qim-layout="${RELEASE}"] #qieMainV3{grid-area:main!important;min-height:690px!important;border:1px solid #dfe8e1!important;border-radius:12px!important;box-shadow:0 5px 18px rgba(3,76,31,.05)!important;background:#fff!important;overflow:hidden!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-panel{border:1px solid #e0e8e2!important;border-radius:11px!important;box-shadow:0 3px 12px rgba(3,76,31,.035)!important;background:#fff!important;overflow:hidden!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-header{padding:10px 11px 9px!important;gap:8px!important;background:#fbfdfb!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-title{font-size:11px!important;gap:7px!important}.qie-title .qie-icon{width:23px!important;height:23px!important;flex-basis:23px!important;font-size:12px!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-desc{margin:3px 0 0 30px!important;font-size:9px!important;line-height:1.35!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-header-actions{gap:3px!important}.qie-header-actions button{font-size:9px!important;padding:4px!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-body{padding:9px!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-repo-grid,
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-evidence-grid,
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-project-grid,
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-output-grid{display:grid!important;grid-template-columns:1fr!important;gap:6px!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-option-card{padding:8px!important;border-radius:8px!important;min-height:0!important;background:#fbfdfb!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-option-card :is(p,span,small,label,button,strong){font-size:9.5px!important;line-height:1.3!important}
      html[data-qim-layout="${RELEASE}"] #qieProjectsV3 .qie-body{max-height:265px!important;overflow:auto!important}
      html[data-qim-layout="${RELEASE}"] #qieOutputV3 .qie-body{max-height:250px!important;overflow:auto!important}
      html[data-qim-layout="${RELEASE}"] #qieEvidenceV3 .qie-body{max-height:230px!important;overflow:auto!important}
      html[data-qim-layout="${RELEASE}"] #qieRepositoriesV3 .qie-body{max-height:205px!important;overflow:auto!important}

      .qim-evidence-file{display:flex;align-items:center;gap:7px!important}.qim-evidence-file .qim-file-icon{flex:0 0 auto}
      .qim-file-icon{position:relative;width:24px;height:27px;border-radius:5px;display:inline-grid;place-items:end center;padding-bottom:4px;box-sizing:border-box;color:#fff;font-size:6px;font-weight:900;letter-spacing:.01em;box-shadow:inset 0 0 0 1px rgba(0,0,0,.07)}
      .qim-file-icon i{position:absolute;right:0;top:0;width:8px;height:8px;background:#fff9;clip-path:polygon(0 0,100% 100%,0 100%)}.qim-file-icon b{font-size:5.8px!important;line-height:1!important;color:#fff!important}.qim-pdf{background:#d44545}.qim-doc{background:#3376ba}.qim-xls{background:#238455}.qim-ppt{background:#c7663d}.qim-csv{background:#775bb2}.qim-file{background:#68766e}

      .qim-shell{width:100%;min-height:688px;font-family:Arial,Helvetica,sans-serif;color:#26372d;background:#fff;display:flex;flex-direction:column}
      .qim-engine-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:18px 18px 12px;border-bottom:1px solid #edf1ee;background:linear-gradient(180deg,#fff,#fcfdfc)}
      .qim-engine-brand{display:flex;align-items:flex-start;gap:11px;min-width:0}.qim-orb{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;flex:0 0 36px;background:radial-gradient(circle,#eff7e8 0 36%,#b6d79c 38% 46%,#fff 48% 58%,#35792a 60% 64%,#fff 66%);color:var(--qim-green);font-size:14px;font-weight:900}
      .qim-engine-copy h2{margin:2px 0 4px;color:var(--qim-green);font-size:17px;line-height:1.15}.qim-engine-copy p{margin:0;color:#76837b;font-size:10px;line-height:1.4}
      .qim-online{display:inline-flex;align-items:center;gap:5px;border:1px solid #dce9dd;background:#f4faf4;color:#35792a;border-radius:7px;padding:5px 7px;font-size:8px;font-weight:800}.qim-online:before{content:'';width:6px;height:6px;border-radius:50%;background:#56a64b}
      .qim-demo-area{padding:10px 16px 9px;border-bottom:1px solid #eef2ef}.qim-demo-label{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#7d8a82;margin-bottom:7px}
      #quest-enterprise-insights-override.qei-override{margin:0!important;color:#27352d!important}.qim-shell #quest-enterprise-insights-override .qei-label{display:none!important}
      .qim-shell #quest-enterprise-insights-override .qei-question-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin:0!important}
      .qim-shell #quest-enterprise-insights-override .qei-question{position:relative!important;width:100%!important;min-height:58px!important;border:1px solid #dfe7e0!important;background:#fff!important;border-radius:9px!important;padding:10px 10px 10px 39px!important;color:#2c4435!important;font-size:9.5px!important;font-weight:700!important;line-height:1.3!important;box-shadow:0 2px 8px rgba(3,76,31,.025)!important;transform:none!important}
      .qim-shell #quest-enterprise-insights-override .qei-question:before{content:attr(data-qim-icon);position:absolute;left:10px;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:7px;background:#edf5e9;color:#35792a;display:grid;place-items:center;font-size:12px;font-weight:900}
      .qim-shell #quest-enterprise-insights-override .qei-question:hover,.qim-shell #quest-enterprise-insights-override .qei-question:focus-visible{border-color:#86ab7c!important;background:#f9fcf8!important;box-shadow:0 4px 12px rgba(3,76,31,.07)!important}
      .qim-shell #quest-enterprise-insights-override .qei-question.active{background:#edf6e9!important;border-color:#7aa06f!important;color:#034c1f!important}
      .qim-shell #quest-enterprise-insights-override .qei-question span{display:none!important}
      .qim-answer-stage{margin:0 16px;min-height:330px;border:1px solid #edf1ee;border-radius:9px;background:#fff;display:grid;place-items:center;color:#a1aaa4;font-size:10px;text-align:center;padding:30px}.qim-answer-stage strong{display:block;color:#77847d;font-size:11px;margin-bottom:4px}
      .qim-shell #quest-enterprise-insights-override .qei-response{margin:0 16px!important;border:1px solid #edf1ee!important;border-radius:9px!important;box-shadow:none!important;background:#fff!important;min-height:330px!important;overflow:hidden!important}
      .qim-shell #quest-enterprise-insights-override .qei-response-head{padding:13px 14px!important;background:#fbfdfb!important;border-bottom:1px solid #e8eee9!important}.qim-shell #quest-enterprise-insights-override .qei-response-head h3{font-size:11px!important;line-height:1.35!important}.qim-shell #quest-enterprise-insights-override .qei-eyebrow{font-size:8px!important}.qim-shell #quest-enterprise-insights-override .qei-download{font-size:9px!important;padding:7px 9px!important}
      .qim-shell #quest-enterprise-insights-override .qei-response-body{padding:14px!important;max-height:440px!important;font-size:10.5px!important;line-height:1.48!important}.qim-shell #quest-enterprise-insights-override .qei-response-body table{font-size:9.5px!important}.qim-shell #quest-enterprise-insights-override .qei-response-body th,.qim-shell #quest-enterprise-insights-override .qei-response-body td{padding:7px 8px!important}
      .qim-bottom{margin-top:auto;padding:10px 16px 14px;background:#fff;border-top:1px solid #edf1ee}.qim-composer{border:1px solid #d3ddd5;border-radius:9px;background:#fff;padding:5px 6px 5px 9px;display:flex;align-items:center;gap:7px;box-shadow:0 2px 8px rgba(3,76,31,.025)}.qim-composer:focus-within{border-color:#7fa776;box-shadow:0 0 0 3px rgba(53,121,42,.07)}
      .qim-composer textarea{flex:1;min-height:31px;max-height:88px;resize:none;border:0!important;outline:0!important;background:transparent!important;color:#26372d!important;font:500 10px/1.4 Arial,Helvetica,sans-serif!important;padding:7px 3px!important;box-shadow:none!important}.qim-composer textarea::placeholder{color:#a1aaa4}
      .qim-send{width:31px;height:31px;border:0;border-radius:7px;background:#dbe8dc;color:#034c1f;display:grid;place-items:center;cursor:pointer;font-size:14px}.qim-send:hover{background:#c9ddca}.qim-actions{display:flex;align-items:center;gap:7px;margin-top:8px}.qim-action{height:31px;border:1px solid #dbe4dc;border-radius:7px;background:#fff;color:#35513f;padding:0 10px;font-size:8.5px;font-weight:750;cursor:pointer}.qim-action.primary{background:#034c1f;border-color:#034c1f;color:#fff;padding:0 13px}.qim-action:hover{filter:brightness(.985)}
      .qim-demo-note{margin:8px 16px 0;display:none;padding:8px 10px;border-radius:8px;background:#f8faf8;border:1px solid #e2eae3;color:#68766e;font-size:9.5px;line-height:1.4}.qim-demo-note.show{display:block}.qim-hint{margin-left:auto;color:#8c9891;font-size:8px}

      @media(max-width:1180px){.qim-status-strip{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:920px){html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3{grid-template-columns:1fr!important;grid-template-areas:"repos" "evidence" "sidebar" "main"!important}.qim-status-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.qim-shell #quest-enterprise-insights-override .qei-question-grid{grid-template-columns:1fr!important}}
      @media(max-width:620px){.qim-status-strip{grid-template-columns:1fr}.qim-engine-head{padding:14px}.qim-demo-area,.qim-bottom{padding-left:12px;padding-right:12px}.qim-answer-stage,.qim-shell #quest-enterprise-insights-override .qei-response{margin-left:12px!important;margin-right:12px!important}}
    `;
    document.head.appendChild(style);
  }

  function inputStats(root) {
    if (!root) return { total: 0, checked: 0, labels: [] };
    const inputs = [...root.querySelectorAll('input[type="checkbox"],input[type="radio"]')].filter(input => !input.disabled);
    const checked = inputs.filter(input => input.checked);
    const labelFor = input => clean(input.closest('label,.qie-option-card,[class*="option"],[class*="card"]')?.textContent || input.value || '');
    return { total: inputs.length, checked: checked.length, labels: checked.map(labelFor).filter(Boolean) };
  }

  function summaryText(stats, noun, allLabel) {
    if (!stats.total) return allLabel;
    if (!stats.checked || stats.checked === stats.total) return allLabel || `All ${stats.total} ${noun}`;
    return `${stats.checked} of ${stats.total} ${noun}`;
  }

  function inferUpdatedText(view) {
    const candidates = [...view.querySelectorAll('small,span,p,time')].map(node => clean(node.textContent)).filter(Boolean);
    const match = candidates.find(text => /last updated|updated|reporting date/i.test(text) && text.length < 100);
    return match ? match.replace(/^.*?(last updated|updated|reporting date)\s*:?[ ]*/i, '') || match : 'Live workspace';
  }

  function inferIndexedText(view, evidenceStats) {
    const text = clean(view.textContent);
    const matches = [...text.matchAll(/\b(\d{1,4})\s+(files|documents|artifacts)\b/gi)].map(match => Number(match[1])).filter(Number.isFinite);
    if (matches.length) return `${Math.max(...matches).toLocaleString()} files`;
    return evidenceStats.total ? `${evidenceStats.total} evidence types` : 'Evidence connected';
  }

  function ensureStatusStrip(workspace) {
    if (!workspace?.parentElement) return;
    let strip = document.getElementById('qimStatusStrip');
    if (!strip) {
      strip = document.createElement('section');
      strip.id = 'qimStatusStrip';
      strip.className = 'qim-status-strip';
      strip.setAttribute('aria-label', 'Insights Engine workspace status');
      workspace.parentElement.insertBefore(strip, workspace);
    } else if (strip.nextElementSibling !== workspace) {
      workspace.parentElement.insertBefore(strip, workspace);
    }
    updateStatusStrip(workspace, strip);
  }

  function updateStatusStrip(workspace, strip = document.getElementById('qimStatusStrip')) {
    if (!workspace || !strip) return;
    const project = inputStats(workspace.querySelector('#qieProjectsV3'));
    const evidence = inputStats(workspace.querySelector('#qieEvidenceV3'));
    const repos = inputStats(workspace.querySelector('#qieRepositoriesV3'));
    const output = inputStats(workspace.querySelector('#qieOutputV3'));
    const view = workspace.closest('.view[data-view]') || workspace.parentElement;
    const outputText = output.labels.length ? output.labels.slice(0, 2).join(' + ') : 'Detailed answer';
    const items = [
      ['◎','Selected Scope',summaryText(project,'projects','All available projects')],
      ['▣','Selected Datapoint Types',summaryText(evidence,'types','All evidence types')],
      ['☁','Connected Repositories',summaryText(repos,'repositories','Connected repositories')],
      ['⚙','Output Configuration',outputText],
      ['▣','Last Updated',inferUpdatedText(view)],
      ['◇','Indexed Evidence',inferIndexedText(view,evidence)]
    ];
    strip.innerHTML = items.map(([icon,label,value]) => `<article class="qim-status-card"><span class="qim-status-icon">${icon}</span><div><b>${label}</b><span title="${String(value).replace(/"/g,'&quot;')}">${value}</span></div></article>`).join('');
  }

  function decorateEvidencePanel(workspace) {
    const panel = workspace?.querySelector('#qieEvidenceV3');
    if (!panel) return;
    panel.querySelectorAll('.qie-option-card').forEach(card => {
      if (card.dataset.qimFileDecorated === '1') return;
      const text = clean(card.textContent).toLowerCase();
      let type = 'file', label = 'FILE';
      if (/report|pdf|competitive intelligence/.test(text)) { type = 'pdf'; label = 'PDF'; }
      else if (/presentation|powerpoint|ppt/.test(text)) { type = 'ppt'; label = 'PPTX'; }
      else if (/survey|excel|xls|data/.test(text)) { type = 'xls'; label = 'XLSX'; }
      else if (/transcript|instrument|word|doc/.test(text)) { type = 'doc'; label = 'DOCX'; }
      const badge = document.createElement('span');
      badge.innerHTML = fileIcon(type,label);
      badge.className = 'qim-evidence-file';
      card.insertBefore(badge.firstElementChild, card.firstChild);
      card.dataset.qimFileDecorated = '1';
    });
  }

  function decorateWorkspace() {
    const workspace = document.getElementById('qieWorkspaceV3');
    if (!workspace) return false;
    document.documentElement.dataset.qimLayout = RELEASE;
    ensureStatusStrip(workspace);
    decorateEvidencePanel(workspace);
    workspace.addEventListener('change', () => updateStatusStrip(workspace), { passive: true });
    workspace.dataset.qimReferenceLayout = RELEASE;
    return true;
  }

  function buildModernShell(wrapper) {
    if (!wrapper) return false;
    if (wrapper.closest('.qim-shell')) return true;

    const shell = document.createElement('section');
    shell.className = 'qim-shell';
    shell.dataset.release = RELEASE;
    shell.innerHTML = `
      <div class="qim-engine-head">
        <div class="qim-engine-brand"><span class="qim-orb">✦</span><div class="qim-engine-copy"><h2>Quest Enterprise Insights Engine</h2><p>Ask a new business question across Quest's connected research ecosystem.</p></div></div>
        <span class="qim-online">Online</span>
      </div>
      <div class="qim-demo-area"><div class="qim-demo-label">Configured demo questions</div><div class="qim-wrapper-slot"></div></div>
      <div class="qim-answer-stage"><div><strong>Answer workspace</strong>Select one of the configured questions above or ask it from the composer below.</div></div>
      <div class="qim-demo-note" role="status"></div>
      <div class="qim-bottom">
        <div class="qim-composer"><textarea rows="1" aria-label="Ask Insights Copilot" placeholder="Ask a new business question…"></textarea><button type="button" class="qim-send" aria-label="Generate answer">➜</button></div>
        <div class="qim-actions"><button type="button" class="qim-action primary qim-generate">✦ Generate Answer</button><span class="qim-hint">Mapped responses and existing engine functions remain unchanged.</span></div>
      </div>`;

    wrapper.parentNode.insertBefore(shell, wrapper);
    shell.querySelector('.qim-wrapper-slot').appendChild(wrapper);

    const buttons = [...wrapper.querySelectorAll('.qei-question')];
    buttons.forEach(button => {
      const id = button.dataset.qeiId;
      if (SHORT_LABELS[id]) button.textContent = SHORT_LABELS[id];
      button.dataset.qimIcon = QUESTION_ICONS[id] || '◆';
    });

    const textarea = shell.querySelector('textarea');
    const send = shell.querySelector('.qim-send');
    const generate = shell.querySelector('.qim-generate');
    const note = shell.querySelector('.qim-demo-note');
    const stage = shell.querySelector('.qim-answer-stage');
    const response = wrapper.querySelector('.qei-response');

    const syncStage = () => {
      if (!response) return;
      const hasAnswer = !response.hidden && clean(response.textContent).length > 0;
      stage.style.display = hasAnswer ? 'none' : 'grid';
    };

    const routeQuestion = () => {
      const value = clean(textarea.value).toLowerCase();
      if (!value) return;
      const q1 = value.includes('theme') || value.includes('outcome') || value.includes('recommendation') || value.includes('portfolio');
      const q2 = value.includes('persona') || value.includes('preference') || value.includes('perception') || value.includes('expert') || value.includes('survey');
      const target = q1 && !q2 ? buttons.find(btn => btn.dataset.qeiId === 'q1') : q2 && !q1 ? buttons.find(btn => btn.dataset.qeiId === 'q2') : null;
      if (target) {
        note.classList.remove('show');
        target.click();
        setTimeout(syncStage, 60);
      } else {
        note.textContent = 'This prototype is configured for the two demo questions shown above. Select one of them to view its mapped response.';
        note.classList.add('show');
      }
    };

    send.addEventListener('click', routeQuestion);
    generate.addEventListener('click', routeQuestion);
    textarea.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); routeQuestion(); }
    });
    buttons.forEach(button => button.addEventListener('click', () => {
      note.classList.remove('show');
      textarea.value = '';
      setTimeout(syncStage, 60);
      setTimeout(syncStage, 5200);
      setTimeout(syncStage, 10200);
    }));
    if (response) new MutationObserver(syncStage).observe(response, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden','aria-busy'] });
    syncStage();
    document.documentElement.dataset.questInsightsModernRelease = RELEASE;
    return true;
  }

  function apply() {
    queued = false;
    ensureStyles();
    const wrapper = document.getElementById('quest-enterprise-insights-override');
    if (wrapper) buildModernShell(wrapper);
    decorateWorkspace();
    const style = document.getElementById('qim-modern-styles');
    if (style && style !== document.head.lastElementChild) document.head.appendChild(style);
  }

  function schedule(delay = 0) {
    if (delay) { setTimeout(schedule, delay); return; }
    if (queued) return;
    queued = true;
    (window.requestAnimationFrame || setTimeout)(apply);
  }

  function boot() {
    apply();
    const observer = new MutationObserver(mutations => {
      if (mutations.some(m => m.addedNodes && m.addedNodes.length)) schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', event => {
      const nav = event.target.closest('.nav-item,[data-view]');
      if (nav && /insights/i.test(clean(nav.textContent) + ' ' + clean(nav.dataset?.view))) [0,140,420,900,1600].forEach(schedule);
    }, true);
    window.addEventListener('quest:module-loaded', () => [0,100,350].forEach(schedule));
    window.addEventListener('quest:layout-refresh', () => [0,100,350].forEach(schedule));
    [300,800,1600,3000,5000].forEach(schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
