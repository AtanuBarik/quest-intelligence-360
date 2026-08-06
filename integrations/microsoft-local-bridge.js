(() => {
  'use strict';

  const RELEASE = '2026-08-06d';
  const CONFIG_URL = `data/microsoft-integration.json?v=${RELEASE}`;
  const LOCAL_BASE = 'http://127.0.0.1:8765';
  const state = { config: null, local: null, files: [], search: [] };
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function injectStyles() {
    if ($('#mlbStyles')) return;
    const style = document.createElement('style');
    style.id = 'mlbStyles';
    style.textContent = `
      .mlb-launch{position:fixed;right:18px;bottom:18px;z-index:1350;display:flex;gap:8px;align-items:center;min-height:44px;padding:0 15px;border:0;border-radius:8px;background:#034c1f;color:#fff;font:700 13px Arial,sans-serif;box-shadow:0 12px 32px rgba(3,76,31,.25);cursor:pointer}.mlb-launch i{width:9px;height:9px;border-radius:50%;background:#c6d52f}.mlb-launch.off i{background:#c78800}.mlb-backdrop{position:fixed;inset:0;z-index:1490;background:rgba(3,34,18,.48);display:none}.mlb-backdrop.open{display:block}.mlb-panel{position:fixed;right:0;top:0;z-index:1500;width:min(620px,100vw);height:100vh;background:#f7f9f7;border-left:1px solid #d9e3da;box-shadow:-18px 0 55px rgba(3,76,31,.18);transform:translateX(102%);transition:transform .22s ease;overflow:auto;font-family:Arial,sans-serif;color:#646464}.mlb-panel.open{transform:translateX(0)}.mlb-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;gap:12px;padding:18px 20px;background:#fff;border-bottom:1px solid #dfe5e0}.mlb-head h2{margin:3px 0;color:#35792a;font-size:24px;font-weight:500}.mlb-head p{margin:0;font-size:12px;line-height:1.45}.mlb-close{width:38px;height:38px;border:1px solid #d9e3da;border-radius:7px;background:#fff;color:#034c1f;font-size:22px;cursor:pointer}.mlb-body{padding:16px 20px 34px}.mlb-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.mlb-card{background:#fff;border:1px solid #dfe5e0;border-radius:10px;padding:14px;box-shadow:0 6px 18px rgba(3,76,31,.04)}.mlb-card.wide{grid-column:1/-1}.mlb-card h3{margin:3px 0 7px;color:#35792a;font-size:17px;font-weight:500}.mlb-card p,.mlb-card li{font-size:12px;line-height:1.5}.mlb-status{display:inline-flex;align-items:center;gap:6px;padding:4px 7px;border-radius:5px;background:#edf4e9;color:#034c1f;font-size:10px;font-weight:700}.mlb-status.warn{background:#fff1d4;color:#8a5c00}.mlb-status.blue{background:#e7f2f7;color:#024c6a}.mlb-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.mlb-btn{min-height:38px;padding:0 12px;border:1px solid #034c1f;border-radius:7px;background:#034c1f;color:#fff;font:700 12px Arial,sans-serif;cursor:pointer}.mlb-btn.secondary{background:#fff;color:#034c1f}.mlb-btn.lime{background:#c6d52f;border-color:#c6d52f;color:#034c1f}.mlb-input,.mlb-select,.mlb-textarea{width:100%;box-sizing:border-box;border:1px solid #cfd9d1;border-radius:7px;background:#fff;color:#646464;font:12px Arial,sans-serif;padding:9px;margin-top:7px}.mlb-textarea{min-height:82px;resize:vertical}.mlb-drop{border:2px dashed #9a9a9a;border-radius:9px;padding:18px;text-align:center;background:#fbfcfb;margin-top:10px}.mlb-drop.drag{border-color:#35792a;background:#f1f7ef}.mlb-files{display:grid;gap:7px;margin-top:10px}.mlb-file{display:grid;grid-template-columns:1fr auto;gap:8px;padding:10px;border:1px solid #e3e9e4;border-radius:8px;background:#fff}.mlb-file strong{display:block;color:#034c1f;font-size:12px}.mlb-file small{display:block;margin-top:3px;font-size:10px;color:#646464}.mlb-results{display:grid;gap:7px;margin-top:10px}.mlb-result{border-left:4px solid #35792a;padding:9px 10px;background:#f7faf6;border-radius:0 7px 7px 0}.mlb-result strong{color:#034c1f;font-size:12px}.mlb-result p{margin:5px 0 0;font-size:11px;line-height:1.45}.mlb-iframe{width:100%;height:520px;border:1px solid #dfe5e0;border-radius:9px;background:#fff}.mlb-note{margin-top:9px;padding:9px 10px;border-left:4px solid #c6d52f;background:#f4f7f2;font-size:11px;line-height:1.45}.mlb-mini{font-size:10px;color:#646464}.mlb-progress{height:7px;border-radius:999px;background:#e8ede9;overflow:hidden;margin-top:8px}.mlb-progress i{display:block;height:100%;background:#35792a;width:0}.mlb-toast{position:fixed;left:50%;bottom:24px;z-index:1700;transform:translateX(-50%);background:#034c1f;color:#fff;padding:10px 14px;border-radius:7px;font:700 12px Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.22)}@media(max-width:700px){.mlb-grid{grid-template-columns:1fr}.mlb-card.wide{grid-column:auto}.mlb-launch{right:10px;bottom:10px}.mlb-body{padding:12px}}
    `;
    document.head.appendChild(style);
  }

  function toast(message) {
    const node = document.createElement('div');
    node.className = 'mlb-toast';
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2600);
  }

  async function jsonFetch(url, options = {}) {
    const response = await fetch(url, { cache:'no-store', ...options });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  }

  async function localHealth() {
    try {
      state.local = await jsonFetch(`${LOCAL_BASE}/api/health?ts=${Date.now()}`);
      return true;
    } catch (_) {
      state.local = null;
      return false;
    }
  }

  function addShell() {
    if ($('#mlbPanel')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <button class="mlb-launch off" id="mlbLaunch"><i></i><span>Microsoft & local data</span></button>
      <div class="mlb-backdrop" id="mlbBackdrop"></div>
      <aside class="mlb-panel" id="mlbPanel" aria-label="Microsoft and local data connections">
        <div class="mlb-head"><div><span class="section-kicker">QUEST CONNECTED WORKSPACE</span><h2>Microsoft & local connections</h2><p>Use SharePoint and Copilot for confidential knowledge, and the local companion for persistent demo files without API credits.</p></div><button class="mlb-close" id="mlbClose">×</button></div>
        <div class="mlb-body" id="mlbBody"></div>
      </aside>`);
    $('#mlbLaunch').onclick = openPanel;
    $('#mlbClose').onclick = closePanel;
    $('#mlbBackdrop').onclick = closePanel;
  }

  function openPanel() {
    $('#mlbPanel').classList.add('open');
    $('#mlbBackdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
    render();
  }

  function closePanel() {
    $('#mlbPanel').classList.remove('open');
    $('#mlbBackdrop').classList.remove('open');
    document.body.style.overflow = '';
  }

  function copilotUrl() {
    return localStorage.getItem('questCopilotEmbedUrl') || state.config?.copilot_studio?.embed_url || '';
  }

  function render() {
    const cfg = state.config || {};
    const sharePoint = cfg.sharepoint || {};
    const copilot = cfg.copilot_studio || {};
    const localReady = Boolean(state.local);
    $('#mlbLaunch').classList.toggle('off', !localReady);
    $('#mlbLaunch span').textContent = localReady ? 'Local repository connected' : 'Microsoft & local data';
    $('#mlbBody').innerHTML = `
      <div class="mlb-grid">
        <section class="mlb-card"><span class="mlb-status">SharePoint site ready</span><h3>Quest Intelligence SharePoint</h3><p>Confidential reports, transcripts and raw survey data remain in the authenticated Microsoft environment.</p><div class="mlb-actions"><button class="mlb-btn" id="mlbOpenSharePoint">Open SharePoint</button></div><div class="mlb-note">The public GitHub page does not request SharePoint credentials. Use ChatGPT sync, Copilot Studio or a locally synchronized folder.</div></section>
        <section class="mlb-card"><span class="mlb-status blue">Agent published</span><h3>${esc(copilot.agent_name || 'Quest Insights Engine')}</h3><p>Available in Teams and Microsoft 365. An authenticated agent is the recommended interface for confidential SharePoint evidence.</p><div class="mlb-actions"><button class="mlb-btn" id="mlbCopilotConfig">Configure web panel</button><button class="mlb-btn secondary" id="mlbCopilotOpen">Open panel</button></div></section>
        <section class="mlb-card"><span class="mlb-status warn">User setup</span><h3>ChatGPT Pro SharePoint sync</h3><ol><li>Open ChatGPT Settings → Apps.</li><li>Connect SharePoint using the Evalueserve Microsoft account.</li><li>Select Enable sync.</li><li>Wait for indexing and test the Quest site.</li></ol><div class="mlb-actions"><button class="mlb-btn secondary" id="mlbCopyTestPrompt">Copy test prompt</button></div></section>
        <section class="mlb-card"><span class="mlb-status">Standard connectors available</span><h3>Power Automate</h3><p>Use SharePoint, Outlook and RSS flows to write approved dashboard exports into a SharePoint folder. A locally synchronized folder can be watched by the companion service.</p><div class="mlb-actions"><button class="mlb-btn secondary" id="mlbCopyFlowPlan">Copy flow plan</button></div></section>
        <section class="mlb-card wide"><span class="mlb-status ${localReady ? '' : 'warn'}">${localReady ? 'Connected on this computer' : 'Local companion not running'}</span><h3>Persistent local research repository</h3><p>${localReady ? `Running at ${esc(state.local.base_url || LOCAL_BASE)} with ${Number(state.local.file_count || 0)} stored files.` : 'Run the downloadable local companion package. It stores original files and extracted text on this computer, never in GitHub.'}</p><div class="mlb-actions"><button class="mlb-btn ${localReady ? 'secondary' : 'lime'}" id="mlbCheckLocal">${localReady ? 'Refresh local status' : 'Check again'}</button>${localReady ? '<button class="mlb-btn secondary" id="mlbLoadFiles">Load stored files</button>' : ''}</div></section>
        ${localReady ? uploadTemplate() : ''}
        ${localReady ? searchTemplate() : ''}
        <section class="mlb-card wide" id="mlbCopilotArea"><h3>Embedded Quest Insights Engine</h3>${copilotUrl() ? `<iframe class="mlb-iframe" src="${esc(copilotUrl())}" title="Quest Insights Engine"></iframe>` : '<p class="mlb-note">Paste the exact iframe <strong>src</strong> from Copilot Studio → Channels → Web app. For confidential SharePoint knowledge, keep Microsoft authentication enabled; unauthenticated public embedding should not be used.</p>'}</section>
      </div>`;
    bind();
  }

  function uploadTemplate() {
    return `<section class="mlb-card wide"><h3>Store approved files locally</h3><p>Original files and extracted text are written to the local companion. Add project and evidence metadata before upload.</p><div class="mlb-grid"><div><label class="mlb-mini">Project</label><input class="mlb-input" id="mlbProject" placeholder="Project name"></div><div><label class="mlb-mini">Evidence type</label><select class="mlb-select" id="mlbType"><option>Final report</option><option>PMR transcript</option><option>Survey data</option><option>Questionnaire / discussion guide</option><option>Presentation</option><option>Competitive intelligence</option><option>Other</option></select></div></div><div class="mlb-drop" id="mlbDrop"><strong>Drop files here or select files</strong><p class="mlb-mini">PDF, DOCX, PPTX, XLSX, CSV, JSON, TXT and Markdown are accepted.</p><input type="file" id="mlbFiles" multiple></div><div class="mlb-progress"><i id="mlbUploadProgress"></i></div><div class="mlb-files" id="mlbFileList"></div></section>`;
  }

  function searchTemplate() {
    return `<section class="mlb-card wide"><h3>Search persistent local evidence</h3><div class="mlb-actions"><input class="mlb-input" id="mlbSearch" placeholder="Ask a business question or enter keywords" style="flex:1;min-width:250px;margin:0"><button class="mlb-btn" id="mlbSearchBtn">Search</button></div><div class="mlb-results" id="mlbResults"></div></section>`;
  }

  function bind() {
    const cfg = state.config || {};
    $('#mlbOpenSharePoint').onclick = () => window.open(cfg.sharepoint?.site_url, '_blank', 'noopener');
    $('#mlbCopyTestPrompt').onclick = async () => {
      await navigator.clipboard.writeText('Search the connected SharePoint app for the Quest Intelligence site. List the available projects, then identify the latest approved final reports, transcripts and survey datasets. Cite each file used.');
      toast('ChatGPT SharePoint test prompt copied.');
    };
    $('#mlbCopyFlowPlan').onclick = async () => {
      const text = `Power Automate flow: Recurrence → Get files (properties only) from the Quest Intelligence SharePoint library → Filter approved dashboard outputs → Get file content → Create or update a JSON/CSV export in a locally synchronized Dashboard Exports folder → Send an Outlook completion email. Do not send confidential source documents to GitHub.`;
      await navigator.clipboard.writeText(text); toast('Power Automate flow plan copied.');
    };
    $('#mlbCopilotConfig').onclick = configureCopilot;
    $('#mlbCopilotOpen').onclick = () => {
      if (!copilotUrl()) return configureCopilot();
      $('#mlbCopilotArea').scrollIntoView({ behavior:'smooth', block:'start' });
    };
    $('#mlbCheckLocal').onclick = async () => { await localHealth(); render(); };
    if ($('#mlbLoadFiles')) $('#mlbLoadFiles').onclick = loadFiles;
    if ($('#mlbSearchBtn')) $('#mlbSearchBtn').onclick = searchFiles;
    if ($('#mlbSearch')) $('#mlbSearch').addEventListener('keydown', event => { if (event.key === 'Enter') searchFiles(); });
    if ($('#mlbFiles')) {
      $('#mlbFiles').onchange = event => uploadFiles([...event.target.files]);
      const drop = $('#mlbDrop');
      drop.ondragover = event => { event.preventDefault(); drop.classList.add('drag'); };
      drop.ondragleave = () => drop.classList.remove('drag');
      drop.ondrop = event => { event.preventDefault(); drop.classList.remove('drag'); uploadFiles([...event.dataTransfer.files]); };
    }
  }

  function configureCopilot() {
    const value = prompt('Paste only the iframe src URL from Copilot Studio → Channels → Web app.', copilotUrl());
    if (value == null) return;
    const clean = value.trim().replace(/^src=["']|["']$/g, '');
    if (clean && !/^https:\/\//i.test(clean)) return toast('Please paste a valid HTTPS iframe URL.');
    if (clean) localStorage.setItem('questCopilotEmbedUrl', clean); else localStorage.removeItem('questCopilotEmbedUrl');
    render();
  }

  async function extractForUpload(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (['txt','md','csv','tsv','json','html','htm'].includes(ext)) return file.text();
    if (window.__questExtractFile) {
      try { return await window.__questExtractFile(file); } catch (_) { return ''; }
    }
    return '';
  }

  async function uploadFiles(files) {
    if (!files.length) return;
    const project = $('#mlbProject').value.trim() || 'Unclassified';
    const type = $('#mlbType').value;
    const list = $('#mlbFileList');
    const progress = $('#mlbUploadProgress');
    list.innerHTML = '';
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const extracted = await extractForUpload(file);
      const form = new FormData();
      form.append('file', file, file.name);
      form.append('project', project);
      form.append('evidence_type', type);
      form.append('extracted_text', extracted || '');
      form.append('approved', 'true');
      try {
        const response = await fetch(`${LOCAL_BASE}/api/upload`, { method:'POST', body:form });
        if (!response.ok) throw new Error(`Upload failed (${response.status})`);
        const result = await response.json();
        list.insertAdjacentHTML('beforeend', `<div class="mlb-file"><div><strong>${esc(file.name)}</strong><small>${esc(project)} · ${esc(type)} · stored locally</small></div><span class="mlb-status">Saved</span></div>`);
        state.files.unshift(result.file);
      } catch (error) {
        list.insertAdjacentHTML('beforeend', `<div class="mlb-file"><div><strong>${esc(file.name)}</strong><small>${esc(error.message)}</small></div><span class="mlb-status warn">Failed</span></div>`);
      }
      progress.style.width = `${Math.round(((index + 1) / files.length) * 100)}%`;
    }
    await localHealth();
    setTimeout(() => { progress.style.width = '0'; }, 900);
  }

  async function loadFiles() {
    try {
      const payload = await jsonFetch(`${LOCAL_BASE}/api/files?ts=${Date.now()}`);
      state.files = payload.files || [];
      const list = $('#mlbFileList');
      if (!list) return;
      list.innerHTML = state.files.length ? state.files.slice(0, 30).map(file => `<div class="mlb-file"><div><strong>${esc(file.name)}</strong><small>${esc(file.project || 'Unclassified')} · ${esc(file.evidence_type || 'Other')} · ${esc(file.uploaded_at || '')}</small></div><button class="mlb-btn secondary" data-delete-local="${esc(file.id)}">Delete</button></div>`).join('') : '<p class="mlb-note">No locally stored files yet.</p>';
      list.querySelectorAll('[data-delete-local]').forEach(button => button.onclick = async () => {
        await fetch(`${LOCAL_BASE}/api/files/${encodeURIComponent(button.dataset.deleteLocal)}`, { method:'DELETE' });
        loadFiles();
      });
    } catch (error) { toast(error.message); }
  }

  async function searchFiles() {
    const query = $('#mlbSearch').value.trim();
    if (!query) return;
    const box = $('#mlbResults');
    box.innerHTML = '<p class="mlb-mini">Searching local evidence…</p>';
    try {
      const payload = await jsonFetch(`${LOCAL_BASE}/api/search`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ query, limit:20 }) });
      state.search = payload.results || [];
      box.innerHTML = state.search.length ? state.search.map(result => `<article class="mlb-result"><strong>${esc(result.name)}</strong><span class="mlb-mini"> · ${esc(result.project || 'Unclassified')} · score ${esc(result.score)}</span><p>${esc(result.snippet || '')}</p></article>`).join('') : '<p class="mlb-note">No matching local evidence was found.</p>';
    } catch (error) { box.innerHTML = `<p class="mlb-note">${esc(error.message)}</p>`; }
  }

  function exposeExtractor() {
    if (window.__questExtractFile) return;
    window.__questExtractFile = async file => {
      const extension = file.name.split('.').pop().toLowerCase();
      if (['txt','md','csv','tsv','json','html','htm'].includes(extension)) return file.text();
      if (extension === 'docx' && window.mammoth) return (await mammoth.extractRawText({ arrayBuffer:await file.arrayBuffer() })).value;
      if (['xlsx','xls'].includes(extension) && window.XLSX) {
        const workbook = XLSX.read(await file.arrayBuffer(), { type:'array' });
        return workbook.SheetNames.map(name => `## ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`).join('\n\n');
      }
      if (extension === 'pdf' && window.pdfjsLib) {
        const pdf = await pdfjsLib.getDocument({ data:await file.arrayBuffer() }).promise;
        const pages = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber); const content = await page.getTextContent();
          pages.push(`## Page ${pageNumber}\n${content.items.map(item => item.str).join(' ')}`);
        }
        return pages.join('\n\n');
      }
      return '';
    };
  }

  async function boot() {
    injectStyles(); addShell(); exposeExtractor();
    try { state.config = await jsonFetch(CONFIG_URL); } catch (_) { state.config = {}; }
    await localHealth();
    render();
    setInterval(async () => { await localHealth(); const launch = $('#mlbLaunch'); if (launch) { launch.classList.toggle('off', !state.local); launch.querySelector('span').textContent = state.local ? 'Local repository connected' : 'Microsoft & local data'; } }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
})();
