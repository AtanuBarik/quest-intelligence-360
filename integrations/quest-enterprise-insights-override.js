(() => {
  'use strict';
  const RELEASE = '20260831a';
  const QUESTIONS = [
    {
      id: 'q1',
      question: 'What are the key themes of all the projects, what are the key outcomes, and what are the key recommendations from each project for Quest?',
      asset: 'data/quest-insights-q1.gz.b64',
      filename: 'Quest_Project_Portfolio_Synthesis.md',
      processing: 'Synthesizing themes, outcomes, and recommendations across the Quest project portfolio…'
    },
    {
      id: 'q2',
      question: 'Build a detailed table comparing the findings across different types of persona participated in different projects and mentioned in survey, interview transcript, final report, and other files. Group by each category of personas and cover their preference, opinion, and perception for Quest and other players.',
      asset: 'data/quest-insights-q2.gz.b64',
      filename: 'Quest_Persona_Comparison.md',
      processing: 'Comparing persona-level preferences, opinions, and perceptions across the available research evidence…'
    }
  ];
  const answerCache = new Map();
  let applyQueued = false;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const inline = value => escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  async function inflateText(path) {
    if (answerCache.has(path)) return answerCache.get(path);
    const promise = (async () => {
      const response = await fetch(new URL(path, document.baseURI), { cache: 'no-store' });
      if (!response.ok) throw new Error(`Unable to load mapped response (${response.status})`);
      const encoded = (await response.text()).replace(/\s+/g, '');
      const binary = atob(encoded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      if (!('DecompressionStream' in window)) throw new Error('This browser does not support the report decompression required by the Insights Engine.');
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return new Response(stream).text();
    })();
    answerCache.set(path, promise);
    return promise;
  }

  function renderMarkdown(markdown) {
    const lines = String(markdown || '').replace(/\r/g, '').split('\n');
    let html = '';
    let i = 0;
    const isTableSeparator = line => /^\s*\|?\s*:?-{3,}/.test(line) && /\|/.test(line);
    const tableCells = line => line.trim().replace(/^\||\|$/g, '').split('|').map(v => v.trim());

    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i += 1; continue; }
      if (/^---+$/.test(line.trim())) { html += '<hr>'; i += 1; continue; }
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = Math.min(6, heading[1].length + 1);
        html += `<h${level}>${inline(heading[2])}</h${level}>`;
        i += 1; continue;
      }
      if (/^>\s?/.test(line)) {
        const quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
        html += `<blockquote>${inline(quote.join(' '))}</blockquote>`;
        continue;
      }
      if (/^\s*[-*]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
        html += '<ul>' + items.map(item => `<li>${inline(item)}</li>`).join('') + '</ul>';
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ''));
        html += '<ol>' + items.map(item => `<li>${inline(item)}</li>`).join('') + '</ol>';
        continue;
      }
      if (/^\s*\|/.test(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        const headers = tableCells(line);
        i += 2;
        const rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(tableCells(lines[i++]));
        html += '<div class="qei-table-wrap"><table><thead><tr>' + headers.map(cell => `<th>${inline(cell)}</th>`).join('') + '</tr></thead><tbody>';
        rows.forEach(row => { html += '<tr>' + row.map(cell => `<td>${inline(cell)}</td>`).join('') + '</tr>'; });
        html += '</tbody></table></div>';
        continue;
      }
      const paragraph = [line.trim()];
      i += 1;
      while (i < lines.length && lines[i].trim() && !/^(#{1,6})\s+/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !/^\s*\|/.test(lines[i]) && !/^---+$/.test(lines[i].trim())) {
        paragraph.push(lines[i].trim());
        i += 1;
      }
      html += `<p>${inline(paragraph.join(' '))}</p>`;
    }
    return html;
  }

  function findHeading() {
    return [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[class*="title"],[class*="heading"]')]
      .find(node => /^Quest Enterprise Insights Engine$/i.test(clean(node.textContent))) ||
      [...document.querySelectorAll('body *')].find(node => node.children.length === 0 && /^Quest Enterprise Insights Engine$/i.test(clean(node.textContent)));
  }

  function findRoot(heading) {
    if (!heading) return null;
    const candidates = [];
    let node = heading.parentElement;
    for (let depth = 0; node && depth < 6; depth += 1, node = node.parentElement) {
      const buttons = node.querySelectorAll('button,[role="button"],a').length;
      const text = clean(node.textContent);
      if (buttons >= 1 && text.length < 12000) candidates.push({ node, buttons, len: text.length });
    }
    candidates.sort((a,b) => (b.buttons - a.buttons) || (a.len - b.len));
    return candidates[0]?.node || heading.parentElement;
  }

  function hideLegacyQuestions(root, wrapper) {
    if (!root) return;
    root.querySelectorAll('button,[role="button"],a,[class*="question"],[class*="prompt"]').forEach(node => {
      if (wrapper.contains(node)) return;
      const text = clean(node.textContent);
      if (text.includes('?') || /^What |^How |^Which |^Build |^Compare |^Summarize /i.test(text)) {
        node.dataset.qeiLegacyHidden = 'true';
        node.style.setProperty('display', 'none', 'important');
      }
    });
  }

  function downloadReport(text, filename) {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1200);
  }

  function setProcessing(panel, item) {
    panel.hidden = false;
    panel.setAttribute('aria-busy', 'true');
    panel.innerHTML = `<div class="qei-processing"><div class="qei-spinner" aria-hidden="true"></div><div><strong>Processing request</strong><p>${escapeHtml(item.processing)}</p><span>Reviewing the mapped Quest research outputs. Response will appear shortly.</span></div></div>`;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function answerQuestion(item, buttons, panel) {
    buttons.forEach(btn => { btn.disabled = true; btn.classList.toggle('active', btn.dataset.qeiId === item.id); });
    setProcessing(panel, item);
    const delay = 5000 + Math.floor(Math.random() * 5001);
    try {
      const [text] = await Promise.all([
        inflateText(item.asset),
        new Promise(resolve => setTimeout(resolve, delay))
      ]);
      panel.setAttribute('aria-busy', 'false');
      panel.innerHTML = `
        <div class="qei-response-head">
          <div><span class="qei-eyebrow">Mapped response</span><h3>${escapeHtml(item.question)}</h3></div>
          <button type="button" class="qei-download">Download report</button>
        </div>
        <div class="qei-response-body">${renderMarkdown(text)}</div>`;
      panel.querySelector('.qei-download')?.addEventListener('click', () => downloadReport(text, item.filename));
    } catch (error) {
      panel.setAttribute('aria-busy', 'false');
      panel.innerHTML = `<div class="qei-error"><strong>Unable to load this mapped response.</strong><p>${escapeHtml(error.message || error)}</p></div>`;
    } finally {
      buttons.forEach(btn => { btn.disabled = false; });
    }
  }

  function ensureStyles() {
    if (document.getElementById('qei-override-styles')) return;
    const style = document.createElement('style');
    style.id = 'qei-override-styles';
    style.textContent = `
      .qei-override{margin:18px 0 8px;font-family:Arial,Helvetica,sans-serif;color:#27352d}
      .qei-label{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#35792a;margin-bottom:9px}
      .qei-question-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .qei-question{appearance:none;border:1px solid #cfdcd2;background:#fff;border-radius:12px;padding:16px 17px;text-align:left;color:#24452f;font-size:14px;font-weight:650;line-height:1.45;cursor:pointer;box-shadow:0 3px 12px rgba(3,76,31,.05);transition:.18s ease}
      .qei-question:hover,.qei-question:focus-visible{border-color:#35792a;box-shadow:0 7px 20px rgba(3,76,31,.11);outline:none;transform:translateY(-1px)}
      .qei-question.active{border-color:#034c1f;background:#f3f8f3;color:#034c1f}
      .qei-question:disabled{cursor:wait;opacity:.78}
      .qei-response{margin-top:15px;border:1px solid #d7e3d9;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgba(3,76,31,.06);overflow:hidden}
      .qei-processing{display:flex;gap:14px;align-items:center;padding:24px}
      .qei-processing strong{display:block;color:#034c1f;font-size:15px;margin-bottom:5px}
      .qei-processing p{margin:0 0 4px;font-size:13.5px;line-height:1.45;color:#3d4a42}.qei-processing span{font-size:12px;color:#718078}
      .qei-spinner{width:28px;height:28px;flex:0 0 auto;border:3px solid #dbe6dc;border-top-color:#35792a;border-radius:50%;animation:qei-spin .8s linear infinite}@keyframes qei-spin{to{transform:rotate(360deg)}}
      .qei-response-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:18px 20px;border-bottom:1px solid #e3ebe4;background:#f8fbf8}
      .qei-eyebrow{display:block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#35792a;margin-bottom:5px}
      .qei-response-head h3{margin:0;font-size:15px;line-height:1.45;color:#034c1f;max-width:920px}
      .qei-download{border:0;border-radius:8px;background:#034c1f;color:#fff;padding:10px 13px;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap}.qei-download:hover{filter:brightness(1.08)}
      .qei-response-body{padding:20px;max-height:650px;overflow:auto;font-size:13.5px;line-height:1.58;color:#3e4742}
      .qei-response-body h2,.qei-response-body h3,.qei-response-body h4,.qei-response-body h5,.qei-response-body h6{color:#034c1f;margin:22px 0 9px}.qei-response-body h2:first-child,.qei-response-body h3:first-child{margin-top:0}
      .qei-response-body p{margin:8px 0}.qei-response-body ul,.qei-response-body ol{margin:8px 0 12px;padding-left:22px}.qei-response-body li{margin:5px 0}.qei-response-body blockquote{margin:13px 0;padding:11px 14px;border-left:4px solid #89a982;background:#f4f8f4;color:#24452f}.qei-response-body hr{border:0;border-top:1px solid #e0e8e1;margin:20px 0}
      .qei-table-wrap{overflow:auto;margin:12px 0 18px;border:1px solid #dae5dc;border-radius:10px}.qei-response-body table{border-collapse:collapse;width:100%;min-width:980px;font-size:12.5px}.qei-response-body th,.qei-response-body td{padding:10px 11px;vertical-align:top;text-align:left;border-bottom:1px solid #e3ebe4;border-right:1px solid #e8eee9}.qei-response-body th{position:sticky;top:0;background:#eef5ef;color:#034c1f;font-weight:800;z-index:1}.qei-response-body tr:last-child td{border-bottom:0}
      .qei-error{padding:20px;color:#7a2e2e}.qei-error p{margin:6px 0 0}
      @media(max-width:800px){.qei-question-grid{grid-template-columns:1fr}.qei-response-head{flex-direction:column}.qei-download{width:100%}.qei-response-body{max-height:560px}}
    `;
    document.head.appendChild(style);
  }

  function build(root, heading) {
    let wrapper = root.querySelector(':scope > .qei-override') || document.getElementById('quest-enterprise-insights-override');
    if (!wrapper) {
      wrapper = document.createElement('section');
      wrapper.id = 'quest-enterprise-insights-override';
      wrapper.className = 'qei-override';
      wrapper.dataset.release = RELEASE;
      wrapper.innerHTML = `<div class="qei-label">Business questions</div><div class="qei-question-grid"></div><div class="qei-response" role="status" aria-live="polite" hidden></div>`;
      const grid = wrapper.querySelector('.qei-question-grid');
      QUESTIONS.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'qei-question';
        button.dataset.qeiId = item.id;
        button.innerHTML = `<span style="display:block;font-size:11px;color:#6d7d73;margin-bottom:5px">Question ${index + 1}</span>${escapeHtml(item.question)}`;
        grid.appendChild(button);
      });
      const insertion = heading.parentElement === root ? heading.nextSibling : null;
      if (insertion) root.insertBefore(wrapper, insertion); else heading.insertAdjacentElement('afterend', wrapper);
      const buttons = [...wrapper.querySelectorAll('.qei-question')];
      const panel = wrapper.querySelector('.qei-response');
      buttons.forEach(button => button.addEventListener('click', event => {
        event.preventDefault(); event.stopPropagation();
        const item = QUESTIONS.find(q => q.id === button.dataset.qeiId);
        if (item) answerQuestion(item, buttons, panel);
      }));
    }
    hideLegacyQuestions(root, wrapper);
    document.documentElement.dataset.questEnterpriseInsightsRelease = RELEASE;
  }

  function apply() {
    applyQueued = false;
    ensureStyles();
    const heading = findHeading();
    if (!heading) return;
    const root = findRoot(heading);
    if (root) build(root, heading);
  }
  function schedule(delay = 0) {
    if (delay) { setTimeout(apply, delay); return; }
    if (applyQueued) return;
    applyQueued = true;
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
      if (nav && /insights/i.test(clean(nav.textContent) + ' ' + clean(nav.dataset?.view))) [0,100,350,900].forEach(schedule);
    }, true);
    window.addEventListener('hashchange', () => [0,120,500].forEach(schedule));
    window.addEventListener('quest:layout-refresh', () => [0,120,500].forEach(schedule));
    [250,700,1500,3000].forEach(schedule);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
