(() => {
  'use strict';

  const RELEASE = '20260916ux5';
  const LEGACY_QUESTIONS = [
    'Identify recurring unmet needs across projects',
    'Combine transcript and survey evidence',
    'Find contradictions and evidence gaps'
  ];
  const MAPPED_LABELS = {
    q1: 'Portfolio themes, outcomes & recommendations',
    q2: 'Persona comparison across research evidence'
  };
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  let timer = 0;
  let applying = false;

  function visible(node) {
    if (!node || !node.isConnected) return false;
    const style = getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function insightsView() {
    return document.querySelector('.view[data-view="copilot"]') ||
      document.querySelector('.view[data-view="insights"]') ||
      [...document.querySelectorAll('.view[data-view]')].find(view => /Insights Copilot|Quest Enterprise Insights Engine/i.test(clean(view.textContent)));
  }

  function commonAncestor(nodes) {
    const list = nodes.filter(Boolean);
    if (!list.length) return null;
    let node = list[0];
    while (node && !list.every(item => node.contains(item))) node = node.parentElement;
    return node;
  }

  function topUnder(ancestor, node) {
    let current = node;
    while (current?.parentElement && current.parentElement !== ancestor) current = current.parentElement;
    return current;
  }

  function findLegacyChat(view) {
    const textareas = [...view.querySelectorAll('textarea')].filter(node => !node.closest('#quest-enterprise-insights-override'));
    for (const textarea of textareas) {
      let node = textarea.parentElement;
      for (let depth = 0; node && node !== view && depth < 8; depth += 1, node = node.parentElement) {
        const text = clean(node.textContent);
        const matched = LEGACY_QUESTIONS.filter(question => text.includes(question)).length;
        if (matched >= 2 && /Generate answer/i.test(text)) return node;
      }
    }
    return [...view.querySelectorAll('section,article,div')]
      .filter(node => node.querySelector('textarea'))
      .filter(node => LEGACY_QUESTIONS.filter(question => clean(node.textContent).includes(question)).length >= 2)
      .sort((a, b) => clean(a.textContent).length - clean(b.textContent).length)[0] || null;
  }

  function findComposer(chat) {
    const textarea = chat?.querySelector('textarea');
    if (!textarea) return null;
    let node = textarea.parentElement;
    for (let depth = 0; node && node !== chat && depth < 6; depth += 1, node = node.parentElement) {
      const text = clean(node.textContent);
      if (/Generate answer|Attach/i.test(text) && node.querySelectorAll('button').length) return node;
    }
    return textarea.parentElement;
  }

  function findLegacyButtons(chat) {
    return LEGACY_QUESTIONS.map(question => [...chat.querySelectorAll('button,[role="button"]')]
      .find(button => clean(button.textContent) === question)).filter(Boolean);
  }

  function findResponseHost(chat, buttons, composer) {
    const buttonParent = commonAncestor(buttons);
    const promptTop = topUnder(chat, buttonParent);
    const composerTop = topUnder(chat, composer);
    if (promptTop && composerTop && promptTop.parentElement === chat && composerTop.parentElement === chat) {
      const candidates = [];
      let node = promptTop.nextElementSibling;
      while (node && node !== composerTop) {
        if (!node.querySelector('textarea') && !LEGACY_QUESTIONS.some(question => clean(node.textContent).includes(question))) candidates.push(node);
        node = node.nextElementSibling;
      }
      if (candidates.length) {
        return candidates.sort((a, b) => (b.getBoundingClientRect().height || b.scrollHeight || 0) - (a.getBoundingClientRect().height || a.scrollHeight || 0))[0];
      }
    }
    let host = chat.querySelector('.qim-unified-response');
    if (!host) {
      host = document.createElement('div');
      host.className = 'qim-unified-response';
      composer?.parentElement?.insertBefore(host, composer);
    }
    return host;
  }

  function fileIcon(type, label) {
    return `<span class="qim-file-icon qim-${type}" aria-hidden="true"><i></i><b>${label}</b></span>`;
  }

  function ensureStyles() {
    let style = document.getElementById('qim-modern-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qim-modern-styles';
      document.head.appendChild(style);
    }
    style.textContent = `
      :root{--qim-green:#034c1f;--qim-mid:#35792a;--qim-lime:#c6d52f;--qim-blue:#0067a0;--qim-line:#dfe8e1;--qim-soft:#f7faf7;--qim-muted:#6b786f}
      html[data-qim-layout="${RELEASE}"] .content{max-width:1800px!important}
      .qim-status-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin:2px 0 11px;width:100%;font-family:Arial,Helvetica,sans-serif}
      .qim-status-card{min-width:0;border:1px solid #e0e8e2;border-radius:10px;background:#fff;box-shadow:0 3px 13px rgba(3,76,31,.04);padding:9px 10px;display:grid;grid-template-columns:27px 1fr;gap:8px;align-items:center}
      .qim-status-icon{width:27px;height:27px;border-radius:8px;background:#edf5e9;color:var(--qim-green);display:grid;place-items:center;font-size:14px;font-weight:800}
      .qim-status-card b{display:block;color:#35513f;font-size:9px;line-height:1.2;margin-bottom:3px}.qim-status-card span{display:block;color:#7b8780;font-size:8.5px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3{display:grid!important;grid-template-columns:minmax(225px,255px) minmax(0,1fr)!important;grid-template-areas:"repos main" "files main" "evidence main" "sidebar main"!important;gap:11px!important;align-items:start!important;margin:0 0 26px!important;width:100%!important}
      html[data-qim-layout="${RELEASE}"] #qieRepositoriesV3{grid-area:repos!important}
      html[data-qim-layout="${RELEASE}"] #qimFileInventory{grid-area:files!important}
      html[data-qim-layout="${RELEASE}"] #qieEvidenceV3{grid-area:evidence!important}
      html[data-qim-layout="${RELEASE}"] #qieSidebarV3{grid-area:sidebar!important;display:grid!important;gap:11px!important;align-content:start!important}
      html[data-qim-layout="${RELEASE}"] #qieMainV3{grid-area:main!important;min-height:720px!important;border:1px solid #dce6de!important;border-radius:13px!important;background:#fff!important;box-shadow:0 6px 20px rgba(3,76,31,.055)!important;overflow:hidden!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-panel,#qimFileInventory{border:1px solid #dfe8e1!important;border-radius:11px!important;background:#fff!important;box-shadow:0 3px 12px rgba(3,76,31,.035)!important;overflow:hidden!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-header{padding:10px 11px 9px!important;background:#fbfdfb!important;border-bottom:1px solid #edf1ee!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-title{font-size:10.5px!important;gap:7px!important;color:var(--qim-green)!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-icon{width:23px!important;height:23px!important;flex:0 0 23px!important;font-size:12px!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-desc{margin:3px 0 0 30px!important;font-size:8.5px!important;line-height:1.35!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-header-actions button{font-size:8.5px!important;padding:4px!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-body{padding:8px!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-repo-grid,
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-evidence-grid,
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-project-grid,
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-output-grid{display:grid!important;grid-template-columns:1fr!important;gap:6px!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-option-card{padding:8px!important;border-radius:8px!important;min-height:0!important;background:#fbfdfb!important}
      html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3 .qie-option-card :is(p,span,small,label,button,strong){font-size:9px!important;line-height:1.3!important}
      html[data-qim-layout="${RELEASE}"] #qieProjectsV3 .qie-body,html[data-qim-layout="${RELEASE}"] #qieOutputV3 .qie-body{max-height:245px!important;overflow:auto!important}
      html[data-qim-layout="${RELEASE}"] #qieEvidenceV3 .qie-body{max-height:215px!important;overflow:auto!important}
      html[data-qim-layout="${RELEASE}"] #qieRepositoriesV3 .qie-body{max-height:190px!important;overflow:auto!important}

      .qim-file-inventory-head{display:flex;justify-content:space-between;align-items:center;padding:10px 11px 8px;background:#fbfdfb;border-bottom:1px solid #edf1ee;color:var(--qim-green);font-size:10px;font-weight:800}.qim-file-inventory-head small{font-size:8px;color:#7c8981;font-weight:600}
      .qim-file-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:9px}.qim-file-tile{display:flex;align-items:center;gap:7px;padding:7px;border:1px solid #e6ece7;border-radius:8px;background:#fff;color:#4d5b52;font-size:8.5px;font-weight:700;min-width:0}
      .qim-file-icon{position:relative;width:23px;height:26px;border-radius:5px;display:inline-grid;place-items:end center;padding-bottom:4px;box-sizing:border-box;color:#fff;flex:0 0 23px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}.qim-file-icon i{position:absolute;right:0;top:0;width:8px;height:8px;background:#fff9;clip-path:polygon(0 0,100% 100%,0 100%)}.qim-file-icon b{font-size:5.5px!important;line-height:1!important;color:#fff!important}.qim-pdf{background:#d94242}.qim-doc{background:#2f73b7}.qim-xls{background:#238454}.qim-ppt{background:#c9643d}.qim-csv{background:#7258aa}

      .qim-unified-chat{position:relative!important;width:100%!important;min-height:718px!important;margin:0!important;padding:0 0 12px!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important;overflow:hidden!important;font-family:Arial,Helvetica,sans-serif!important;color:#26372d!important}
      .qim-chat-header{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:18px 18px 13px;border-bottom:1px solid #edf1ee;background:linear-gradient(180deg,#fff,#fcfdfc)}
      .qim-chat-brand{display:flex;align-items:flex-start;gap:11px;min-width:0}.qim-orb{width:37px;height:37px;border-radius:50%;display:grid;place-items:center;flex:0 0 37px;background:radial-gradient(circle,#eff7e8 0 35%,#b7d99c 37% 46%,#fff 48% 58%,#35792a 60% 64%,#fff 66%);color:var(--qim-green);font-size:13px;font-weight:900}
      .qim-chat-copy h2{margin:2px 0 4px;color:var(--qim-green);font-size:18px;line-height:1.15}.qim-chat-copy p{margin:0;color:#76837b;font-size:9.5px;line-height:1.4}.qim-online{display:inline-flex;align-items:center;gap:5px;border:1px solid #dce9dd;background:#f4faf4;color:#35792a;border-radius:7px;padding:5px 7px;font-size:8px;font-weight:800}.qim-online:before{content:'';width:6px;height:6px;border-radius:50%;background:#55a34a}
      .qim-question-block{padding:11px 18px 10px;border-bottom:1px solid #edf1ee;background:#fff}.qim-question-label{margin-bottom:7px;font-size:8.5px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:#7c8981}.qim-question-stack{counter-reset:qimq;display:grid!important;grid-template-columns:1fr!important;gap:7px!important;width:100%!important}
      .qim-question-stack .qim-demo-question{counter-increment:qimq;position:relative!important;display:block!important;width:100%!important;min-height:40px!important;margin:0!important;padding:9px 12px 9px 42px!important;border:1px solid #dfe7e0!important;border-radius:9px!important;background:#fff!important;color:#2e4435!important;text-align:left!important;font-size:9.5px!important;font-weight:700!important;line-height:1.35!important;box-shadow:0 2px 7px rgba(3,76,31,.025)!important;transform:none!important}
      .qim-question-stack .qim-demo-question:before{content:counter(qimq);position:absolute;left:11px;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:7px;background:#edf5e9;color:#35792a;display:grid;place-items:center;font-size:9px;font-weight:900}
      .qim-question-stack .qim-demo-question:hover,.qim-question-stack .qim-demo-question:focus-visible{border-color:#82a978!important;background:#f8fcf7!important;outline:none!important}.qim-question-stack .qim-demo-question.active{border-color:#6f9a64!important;background:#edf6e9!important;color:#034c1f!important}
      .qim-response-host{position:relative!important;min-height:355px!important;margin:10px 18px!important;border:1px solid #edf1ee!important;border-radius:10px!important;background:#fff!important;overflow:auto!important}.qim-response-host:empty:after{content:'Select a demo question or ask a question below to generate an answer.';position:absolute;inset:0;display:grid;place-items:center;padding:24px;text-align:center;color:#9aa49e;font-size:9.5px}
      .qim-response-host[data-qim-mode="mapped"] > :not(.qei-response){display:none!important}
      .qim-response-host .qei-response{display:block!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;min-height:350px!important;background:#fff!important}.qim-response-host .qei-response[hidden]{display:none!important}
      .qim-response-host .qei-response-head{padding:13px 14px!important;background:#fbfdfb!important;border-bottom:1px solid #e8eee9!important}.qim-response-host .qei-response-head h3{font-size:11px!important;line-height:1.4!important}.qim-response-host .qei-eyebrow{font-size:8px!important}.qim-response-host .qei-download{font-size:8.5px!important;padding:7px 9px!important}.qim-response-host .qei-response-body{padding:14px!important;max-height:440px!important;font-size:10.5px!important;line-height:1.5!important}.qim-response-host .qei-response-body table{font-size:9.5px!important}.qim-response-host .qei-response-body th,.qim-response-host .qei-response-body td{padding:7px 8px!important}
      .qim-composer-wrap{margin:9px 18px 0!important;padding:0!important;border:0!important;background:#fff!important;box-shadow:none!important}.qim-composer-wrap textarea{width:100%!important;min-height:48px!important;max-height:100px!important;margin:0!important;padding:10px 11px!important;border:1px solid #cfdad1!important;border-radius:9px!important;background:#fff!important;color:#26372d!important;font:500 9.5px/1.45 Arial,Helvetica,sans-serif!important;box-shadow:none!important;outline:none!important}.qim-composer-wrap textarea:focus{border-color:#7ca273!important;box-shadow:0 0 0 3px rgba(53,121,42,.07)!important}
      .qim-composer-wrap button{min-height:31px!important;border-radius:7px!important;font-size:8.5px!important;font-weight:750!important}.qim-composer-wrap button:is([class*="primary"],button:last-of-type){background:#034c1f!important;color:#fff!important;border-color:#034c1f!important}
      #quest-enterprise-insights-override.qim-mapped-vault{display:none!important}
      .qim-old-prompt-hidden{display:none!important}

      @media(max-width:1180px){.qim-status-strip{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:920px){html[data-qim-layout="${RELEASE}"] #qieWorkspaceV3{grid-template-columns:1fr!important;grid-template-areas:"repos" "files" "evidence" "sidebar" "main"!important}.qim-status-strip{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:620px){.qim-status-strip{grid-template-columns:1fr}.qim-chat-header{padding:14px}.qim-question-block{padding-left:12px;padding-right:12px}.qim-response-host,.qim-composer-wrap{margin-left:12px!important;margin-right:12px!important}}
    `;
  }

  function countSelections(root) {
    if (!root) return { total: 0, checked: 0 };
    const inputs = [...root.querySelectorAll('input[type="checkbox"],input[type="radio"]')].filter(input => !input.disabled);
    return { total: inputs.length, checked: inputs.filter(input => input.checked).length };
  }

  function ensureStatusStrip(workspace) {
    let strip = document.getElementById('qimStatusStrip');
    if (!strip) {
      strip = document.createElement('div');
      strip.id = 'qimStatusStrip';
      strip.className = 'qim-status-strip';
      workspace.parentElement?.insertBefore(strip, workspace);
    }
    const projects = countSelections(document.getElementById('qieProjectsV3'));
    const evidence = countSelections(document.getElementById('qieEvidenceV3'));
    const repos = countSelections(document.getElementById('qieRepositoriesV3'));
    const output = countSelections(document.getElementById('qieOutputV3'));
    const cards = [
      ['◎','Selected Scope',projects.checked ? `${projects.checked} selected` : 'All available projects'],
      ['▣','Datapoint Types',evidence.checked ? `${evidence.checked} selected` : 'All evidence types'],
      ['☁','Connected Repositories',repos.checked ? `${repos.checked} connected` : 'Available repositories'],
      ['⚙','Output Configuration',output.checked ? `${output.checked} options` : 'Detailed answer'],
      ['▤','Workspace Status','Current session'],
      ['▱','Evidence Base',evidence.total ? `${evidence.total} evidence controls` : 'Connected evidence']
    ];
    strip.innerHTML = cards.map(([icon, title, value]) => `<div class="qim-status-card"><div class="qim-status-icon">${icon}</div><div><b>${title}</b><span>${value}</span></div></div>`).join('');
  }

  function ensureFileInventory(workspace) {
    let panel = document.getElementById('qimFileInventory');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'qimFileInventory';
      panel.innerHTML = `<div class="qim-file-inventory-head"><span>File Inventory</span><small>Connected evidence</small></div><div class="qim-file-grid">
        <div class="qim-file-tile">${fileIcon('pdf','PDF')}<span>Reports</span></div>
        <div class="qim-file-tile">${fileIcon('ppt','PPTX')}<span>Presentations</span></div>
        <div class="qim-file-tile">${fileIcon('doc','DOCX')}<span>Transcripts</span></div>
        <div class="qim-file-tile">${fileIcon('xls','XLSX')}<span>Surveys</span></div>
        <div class="qim-file-tile">${fileIcon('csv','CSV')}<span>Models & data</span></div>
      </div>`;
      workspace.appendChild(panel);
    }
  }

  function hideOldPromptChrome(chat, questionStack, composer, responseHost) {
    [...chat.querySelectorAll('h1,h2,h3,h4,strong,p,small,span')].forEach(node => {
      if (node.closest('.qim-chat-header,.qim-question-block,.qim-composer-wrap,.qim-response-host')) return;
      const text = clean(node.textContent);
      if (/^Ask a new business question across Quest's research ecosystem$/i.test(text) || /^Responses can combine historical project context/i.test(text)) {
        const parent = node.parentElement;
        if (parent && !parent.querySelector('textarea') && !parent.contains(questionStack) && parent !== responseHost && parent !== composer) parent.classList.add('qim-old-prompt-hidden');
        else node.classList.add('qim-old-prompt-hidden');
      }
    });
  }

  function ensureUnifiedChat(view) {
    const workspace = document.getElementById('qieWorkspaceV3');
    const main = document.getElementById('qieMainV3');
    const qei = document.getElementById('quest-enterprise-insights-override');
    const chat = findLegacyChat(view);
    if (!workspace || !main || !chat || !qei) return false;

    const legacyButtons = findLegacyButtons(chat);
    const mappedButtons = [...qei.querySelectorAll('.qei-question[data-qei-id]')];
    const responsePanel = qei.querySelector('.qei-response');
    const composer = findComposer(chat);
    if (legacyButtons.length < 3 || mappedButtons.length < 2 || !responsePanel || !composer) return false;

    document.querySelectorAll('.qim-shell').forEach(node => { if (!node.contains(chat)) node.remove(); });
    chat.classList.add('qim-unified-chat');
    chat.dataset.qimRelease = RELEASE;

    let header = chat.querySelector(':scope > .qim-chat-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'qim-chat-header';
      header.innerHTML = `<div class="qim-chat-brand"><span class="qim-orb">✦</span><div class="qim-chat-copy"><h2>Quest Enterprise Insights Engine</h2><p>Ask a new business question across Quest's connected research ecosystem.</p></div></div><span class="qim-online">Online</span>`;
      chat.insertBefore(header, chat.firstChild);
    }

    let block = chat.querySelector(':scope > .qim-question-block');
    if (!block) {
      block = document.createElement('div');
      block.className = 'qim-question-block';
      block.innerHTML = '<div class="qim-question-label">Configured demo questions</div><div class="qim-question-stack"></div>';
      header.insertAdjacentElement('afterend', block);
    }
    const stack = block.querySelector('.qim-question-stack');

    legacyButtons.forEach(button => {
      button.classList.add('qim-demo-question');
      button.dataset.qimSource = 'legacy';
      if (button.parentElement !== stack) stack.appendChild(button);
    });

    mappedButtons.forEach(target => {
      const id = target.dataset.qeiId;
      target.style.setProperty('display', 'none', 'important');
      let proxy = stack.querySelector(`[data-qim-map="${id}"]`);
      if (!proxy) {
        proxy = document.createElement('button');
        proxy.type = 'button';
        proxy.className = 'qim-demo-question';
        proxy.dataset.qimMap = id;
        proxy.textContent = MAPPED_LABELS[id] || clean(target.textContent);
        stack.appendChild(proxy);
      }
    });

    composer.classList.add('qim-composer-wrap');
    const responseHost = findResponseHost(chat, legacyButtons, composer);
    responseHost.classList.add('qim-response-host');
    if (!responseHost.dataset.qimMode) responseHost.dataset.qimMode = 'native';

    const attachMappedPanel = () => {
      if (responsePanel.parentElement !== responseHost) responseHost.appendChild(responsePanel);
    };
    attachMappedPanel();
    responsePanel.hidden = true;
    qei.classList.add('qim-mapped-vault');

    const setActive = button => {
      stack.querySelectorAll('.qim-demo-question').forEach(item => item.classList.toggle('active', item === button));
    };

    legacyButtons.forEach(button => {
      if (button.dataset.qimBound === RELEASE) return;
      button.dataset.qimBound = RELEASE;
      button.addEventListener('click', () => {
        responseHost.dataset.qimMode = 'native';
        responsePanel.hidden = true;
        setActive(button);
      }, true);
    });

    stack.querySelectorAll('[data-qim-map]').forEach(proxy => {
      if (proxy.dataset.qimBound === RELEASE) return;
      proxy.dataset.qimBound = RELEASE;
      proxy.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const target = mappedButtons.find(button => button.dataset.qeiId === proxy.dataset.qimMap);
        if (!target) return;
        attachMappedPanel();
        responseHost.dataset.qimMode = 'mapped';
        responsePanel.hidden = false;
        setActive(proxy);
        target.click();
      });
    });

    const textarea = composer.querySelector('textarea');
    const generate = [...composer.querySelectorAll('button')].find(button => /Generate answer/i.test(clean(button.textContent)));
    const routeMappedText = event => {
      const value = clean(textarea?.value).toLowerCase();
      if (!value) return false;
      const q1 = (value.includes('key themes') || value.includes('portfolio themes')) && value.includes('recommend');
      const q2 = value.includes('persona') && (value.includes('comparison') || value.includes('preference') || value.includes('perception'));
      const id = q1 && !q2 ? 'q1' : q2 && !q1 ? 'q2' : '';
      if (!id) return false;
      event?.preventDefault?.();
      event?.stopImmediatePropagation?.();
      stack.querySelector(`[data-qim-map="${id}"]`)?.click();
      return true;
    };
    if (generate && generate.dataset.qimRouteBound !== RELEASE) {
      generate.dataset.qimRouteBound = RELEASE;
      generate.addEventListener('click', event => {
        if (!routeMappedText(event)) {
          responseHost.dataset.qimMode = 'native';
          responsePanel.hidden = true;
        }
      }, true);
    }
    if (textarea && textarea.dataset.qimRouteBound !== RELEASE) {
      textarea.dataset.qimRouteBound = RELEASE;
      textarea.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) routeMappedText(event);
      }, true);
    }

    hideOldPromptChrome(chat, stack, composer, responseHost);
    ensureStatusStrip(workspace);
    ensureFileInventory(workspace);
    document.documentElement.dataset.qimLayout = RELEASE;
    document.documentElement.dataset.questInsightsModernRelease = RELEASE;
    return true;
  }

  function apply() {
    if (applying) return;
    applying = true;
    try {
      ensureStyles();
      const view = insightsView();
      if (!view) return;
      ensureUnifiedChat(view);
    } finally {
      applying = false;
    }
  }

  function schedule(delay = 0) {
    clearTimeout(timer);
    timer = setTimeout(apply, delay);
  }

  function boot() {
    ensureStyles();
    schedule(0);
    [120, 350, 700, 1200, 2200, 4000].forEach(delay => setTimeout(apply, delay));
    window.addEventListener('quest:module-loaded', () => schedule(80));
    window.addEventListener('quest:layout-refresh', () => schedule(100));
    window.addEventListener('quest:stable-route', event => {
      if (/copilot|insights/i.test(String(event.detail?.route || ''))) schedule(80);
    });
    document.addEventListener('click', event => {
      const nav = event.target.closest?.('.nav-item[data-view]');
      if (nav && /copilot|insights/i.test(String(nav.dataset.view || '') + ' ' + clean(nav.textContent))) [60,220,600].forEach(schedule);
    }, true);
    const observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => mutation.addedNodes?.length)) schedule(120);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.QuestInsightsUnifiedLayout = { apply, release: RELEASE };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
