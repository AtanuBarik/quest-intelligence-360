(() => {
  'use strict';

  const RELEASE = '20260916ux1';
  const SHORT_LABELS = {
    q1: 'Portfolio themes, outcomes & recommendations',
    q2: 'Persona comparison across research evidence'
  };
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  let queued = false;

  function icon(type) {
    const labels = { pdf: 'PDF', doc: 'DOCX', xls: 'XLSX', ppt: 'PPTX', csv: 'CSV' };
    return `<span class="qim-file-icon qim-${type}" aria-hidden="true"><i></i><b>${labels[type]}</b></span>`;
  }

  function ensureStyles() {
    if (document.getElementById('qim-modern-styles')) return;
    const style = document.createElement('style');
    style.id = 'qim-modern-styles';
    style.textContent = `
      .qim-shell{width:min(1120px,100%);margin:18px auto 36px;font-family:Arial,Helvetica,sans-serif;color:#22342a}
      .qim-hero{position:relative;overflow:hidden;border:1px solid #d8e4da;border-radius:22px;background:linear-gradient(135deg,#f8fbf8 0%,#fff 55%,#f2f8f3 100%);box-shadow:0 14px 42px rgba(3,76,31,.08);padding:26px 28px 22px}
      .qim-hero:after{content:'';position:absolute;width:250px;height:250px;border-radius:50%;right:-125px;top:-150px;background:radial-gradient(circle,#c7d92f55 0%,#c7d92f00 70%);pointer-events:none}
      .qim-kicker{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#35792a;margin-bottom:9px}
      .qim-kicker:before{content:'';width:8px;height:8px;border-radius:50%;background:#c6d52f;box-shadow:0 0 0 4px #edf3ca}
      .qim-hero h2{margin:0;color:#034c1f;font-size:26px;line-height:1.15;letter-spacing:-.02em}
      .qim-hero p{max-width:760px;margin:9px 0 0;color:#617068;font-size:13.5px;line-height:1.55}
      .qim-source-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:20px;padding-top:18px;border-top:1px solid #e4ece5}
      .qim-source-label{font-size:11px;font-weight:800;color:#6e7d74;text-transform:uppercase;letter-spacing:.08em;margin-right:2px}
      .qim-source{display:inline-flex;align-items:center;gap:7px;border:1px solid #dce6de;border-radius:10px;background:#fff;padding:7px 9px 7px 7px;color:#43544a;font-size:11.5px;font-weight:700;box-shadow:0 2px 8px rgba(3,76,31,.035)}
      .qim-file-icon{position:relative;width:26px;height:30px;border-radius:5px;display:inline-grid;place-items:end center;padding-bottom:4px;box-sizing:border-box;color:#fff;font-size:6px;font-weight:900;letter-spacing:.02em;box-shadow:inset 0 0 0 1px rgba(0,0,0,.07)}
      .qim-file-icon i{position:absolute;right:0;top:0;width:9px;height:9px;background:#fff9;clip-path:polygon(0 0,100% 100%,0 100%)}
      .qim-file-icon b{font-size:6px;line-height:1;color:inherit}.qim-pdf{background:#c53d3d}.qim-doc{background:#3a6ea8}.qim-xls{background:#2f7d54}.qim-ppt{background:#b95e37}.qim-csv{background:#7d6aa8}
      .qim-chat-card{margin-top:16px;border:1px solid #d8e4da;border-radius:20px;background:#fff;box-shadow:0 14px 38px rgba(3,76,31,.07);overflow:hidden}
      .qim-chat-top{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:17px 20px;border-bottom:1px solid #e8eee9;background:#fbfdfb}
      .qim-chat-title{display:flex;align-items:center;gap:10px}.qim-orb{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(145deg,#034c1f,#35792a);color:#fff;box-shadow:0 6px 15px rgba(3,76,31,.18);font-size:17px}
      .qim-chat-title strong{display:block;color:#173c27;font-size:13.5px}.qim-chat-title span{display:block;color:#7a887f;font-size:11px;margin-top:2px}
      .qim-status{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;color:#35792a;background:#f1f7f1;border:1px solid #dbe9dc;border-radius:999px;padding:6px 9px}.qim-status:before{content:'';width:7px;height:7px;border-radius:50%;background:#55a448}
      .qim-demo-area{padding:16px 20px 8px}.qim-demo-label{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#7a887f;margin-bottom:9px}
      #quest-enterprise-insights-override.qei-override{margin:0!important;color:#27352d!important}
      #quest-enterprise-insights-override .qei-label{display:none!important}
      #quest-enterprise-insights-override .qei-question-grid{display:flex!important;flex-wrap:wrap!important;gap:8px!important;margin:0!important}
      #quest-enterprise-insights-override .qei-question{width:auto!important;min-height:0!important;border:1px solid #d8e4da!important;background:#f8fbf8!important;border-radius:999px!important;padding:9px 12px!important;color:#275139!important;font-size:11.5px!important;font-weight:750!important;line-height:1.2!important;box-shadow:none!important;transform:none!important}
      #quest-enterprise-insights-override .qei-question:hover,#quest-enterprise-insights-override .qei-question:focus-visible{border-color:#35792a!important;background:#eef6ef!important;box-shadow:0 4px 12px rgba(3,76,31,.08)!important}
      #quest-enterprise-insights-override .qei-question.active{background:#034c1f!important;border-color:#034c1f!important;color:#fff!important}
      #quest-enterprise-insights-override .qei-question span{display:none!important}
      #quest-enterprise-insights-override .qei-response{margin:14px 20px 0!important;border:0!important;border-top:1px solid #e8eee9!important;border-radius:0!important;box-shadow:none!important;background:#fff!important}
      #quest-enterprise-insights-override .qei-response-head{padding:17px 0!important;background:#fff!important;border-bottom:1px solid #e8eee9!important}
      #quest-enterprise-insights-override .qei-response-body{padding:18px 0 8px!important;max-height:620px!important}
      .qim-composer{margin:10px 20px 20px;border:1px solid #cfdcd2;border-radius:15px;background:#fff;box-shadow:0 5px 18px rgba(3,76,31,.055);padding:8px 8px 8px 13px;display:flex;align-items:flex-end;gap:8px;transition:.18s ease}
      .qim-composer:focus-within{border-color:#35792a;box-shadow:0 0 0 3px rgba(53,121,42,.09),0 6px 18px rgba(3,76,31,.07)}
      .qim-composer textarea{flex:1;min-height:38px;max-height:110px;resize:none;border:0;outline:0;background:transparent;color:#26372d;font:500 12.5px/1.45 Arial,Helvetica,sans-serif;padding:9px 4px}.qim-composer textarea::placeholder{color:#9aa59e}
      .qim-send{width:38px;height:38px;border:0;border-radius:11px;background:#034c1f;color:#fff;display:grid;place-items:center;cursor:pointer;font-size:17px;box-shadow:0 5px 12px rgba(3,76,31,.18)}.qim-send:hover{background:#0d602b}.qim-send:active{transform:translateY(1px)}
      .qim-hint{margin:-8px 22px 17px;color:#89958e;font-size:10.5px}.qim-hint strong{color:#5c6c62}
      .qim-demo-note{margin:0 20px 12px;display:none;padding:10px 12px;border-radius:10px;background:#f8faf8;border:1px solid #e2eae3;color:#68766e;font-size:11px;line-height:1.4}.qim-demo-note.show{display:block}
      @media(max-width:760px){.qim-hero{padding:22px 18px 18px}.qim-hero h2{font-size:22px}.qim-chat-top{padding:14px}.qim-demo-area{padding:14px 14px 7px}#quest-enterprise-insights-override .qei-response{margin-left:14px!important;margin-right:14px!important}.qim-composer{margin-left:14px;margin-right:14px}.qim-hint{margin-left:16px}.qim-source-label{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function buildModernShell(wrapper) {
    if (!wrapper || wrapper.closest('.qim-shell')) return;

    const shell = document.createElement('section');
    shell.className = 'qim-shell';
    shell.dataset.release = RELEASE;
    shell.innerHTML = `
      <div class="qim-hero">
        <div class="qim-kicker">Quest research intelligence</div>
        <h2>Insights Copilot</h2>
        <p>Ask questions across connected primary market research, interview transcripts, surveys, reports, models, and other approved Quest research evidence.</p>
        <div class="qim-source-row" aria-label="Connected research file types">
          <span class="qim-source-label">Connected evidence</span>
          <span class="qim-source">${icon('pdf')} Reports</span>
          <span class="qim-source">${icon('doc')} Transcripts</span>
          <span class="qim-source">${icon('xls')} Surveys</span>
          <span class="qim-source">${icon('ppt')} Presentations</span>
          <span class="qim-source">${icon('csv')} Models & data</span>
        </div>
      </div>
      <div class="qim-chat-card">
        <div class="qim-chat-top">
          <div class="qim-chat-title"><span class="qim-orb">✦</span><div><strong>Research chat</strong><span>Grounded in the connected Quest evidence base</span></div></div>
          <div class="qim-status">Evidence connected</div>
        </div>
        <div class="qim-demo-area"><div class="qim-demo-label">Demo questions</div><div class="qim-wrapper-slot"></div></div>
        <div class="qim-demo-note" role="status"></div>
        <div class="qim-composer"><textarea rows="1" aria-label="Ask Insights Copilot" placeholder="Ask a question across connected Quest research…"></textarea><button type="button" class="qim-send" aria-label="Send question">➜</button></div>
        <div class="qim-hint"><strong>Demo mode:</strong> select a configured question above, or type one of those questions in the chat box.</div>
      </div>`;

    wrapper.parentNode.insertBefore(shell, wrapper);
    shell.querySelector('.qim-wrapper-slot').appendChild(wrapper);

    wrapper.querySelectorAll('.qei-question').forEach(button => {
      const id = button.dataset.qeiId;
      if (SHORT_LABELS[id]) button.textContent = SHORT_LABELS[id];
    });

    const textarea = shell.querySelector('textarea');
    const send = shell.querySelector('.qim-send');
    const note = shell.querySelector('.qim-demo-note');
    const buttons = [...wrapper.querySelectorAll('.qei-question')];

    const routeQuestion = () => {
      const value = clean(textarea.value).toLowerCase();
      if (!value) return;
      const q1 = value.includes('theme') || value.includes('outcome') || value.includes('recommendation');
      const q2 = value.includes('persona') || value.includes('preference') || value.includes('perception');
      const target = q1 && !q2 ? buttons.find(btn => btn.dataset.qeiId === 'q1') : q2 && !q1 ? buttons.find(btn => btn.dataset.qeiId === 'q2') : null;
      if (target) {
        note.classList.remove('show');
        target.click();
      } else {
        note.textContent = 'This prototype is configured for the two demo questions shown above. Please select one of them to view its mapped response.';
        note.classList.add('show');
      }
    };
    send.addEventListener('click', routeQuestion);
    textarea.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); routeQuestion(); }
    });
    buttons.forEach(button => button.addEventListener('click', () => {
      note.classList.remove('show');
      textarea.value = '';
    }));

    document.documentElement.dataset.questInsightsModernRelease = RELEASE;
  }

  function hideLegacyInsightsChrome(wrapper) {
    if (!wrapper) return;
    const shell = wrapper.closest('.qim-shell');
    let node = shell ? shell.parentElement : wrapper.parentElement;
    for (let depth = 0; node && depth < 4; depth += 1, node = node.parentElement) {
      [...node.children].forEach(child => {
        if (child === shell || child.contains(shell)) return;
        const text = clean(child.textContent);
        if (/^Quest Enterprise Insights Engine$/i.test(text)) child.style.setProperty('display', 'none', 'important');
      });
    }
  }

  function apply() {
    queued = false;
    ensureStyles();
    const wrapper = document.getElementById('quest-enterprise-insights-override');
    if (!wrapper) return;
    buildModernShell(wrapper);
    hideLegacyInsightsChrome(wrapper);
  }

  function schedule(delay = 0) {
    if (delay) { setTimeout(apply, delay); return; }
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
      if (nav && /insights/i.test(clean(nav.textContent) + ' ' + clean(nav.dataset?.view))) [0,120,420,900].forEach(schedule);
    }, true);
    [300,800,1600,3000].forEach(schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
