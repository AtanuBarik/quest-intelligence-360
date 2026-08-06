(() => {
  'use strict';

  const RELEASE = '2026-08-06a';
  const URLS = {
    projects: `data/project-tracker.json?v=${RELEASE}`,
    news: `data/laboratory-news.json?v=${RELEASE}`,
    social: `data/social-intelligence.json?v=${RELEASE}`,
    email: `data/laboratory-email-status.json?v=${RELEASE}`,
    ai: `data/laboratory-ai-health.json?v=${RELEASE}`
  };
  const DB_NAME = 'quest-intelligence-local-repository';
  const DB_VERSION = 1;
  const STORE = 'documents';
  const state = { projects: null, news: null, social: null, email: null, ai: null, charts: {} };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const fmt = number => number == null ? '—' : Number(number).toLocaleString();
  const dateText = value => {
    if (!value) return 'Not available';
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleString([], { dateStyle:'medium', timeStyle:'short' });
  };

  function injectStyles() {
    if ($('#freeLiveOperationsStyles')) return;
    const style = document.createElement('style');
    style.id = 'freeLiveOperationsStyles';
    style.textContent = `
      .flo-badge{display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:0 11px;border:1px solid #d9e3da;border-radius:7px;background:#fff;color:#034c1f;font:700 11px Arial,sans-serif;cursor:pointer}.flo-dot{width:8px;height:8px;border-radius:50%;background:#35792a;box-shadow:0 0 0 4px rgba(53,121,42,.12)}.flo-dot.warn{background:#c78800}.flo-dot.off{background:#9a9a9a}.flo-shell{font-family:Arial,sans-serif;color:#646464}.flo-panel{background:#fff;border:1px solid #dfe5e0;border-radius:10px;padding:18px;box-shadow:0 7px 22px rgba(3,76,31,.05);margin:14px 0}.flo-panel h2,.flo-panel h3{color:#35792a;margin:0 0 7px;font-weight:500}.flo-panel h2{font-size:25px}.flo-panel h3{font-size:18px}.flo-panel p{font-size:13px;line-height:1.55;margin:0;color:#646464}.flo-kicker{display:block;color:#35792a;font-size:11px;font-weight:700;letter-spacing:1.1px;margin-bottom:5px}.flo-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}.flo-span-12{grid-column:span 12}.flo-span-8{grid-column:span 8}.flo-span-7{grid-column:span 7}.flo-span-6{grid-column:span 6}.flo-span-5{grid-column:span 5}.flo-span-4{grid-column:span 4}.flo-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px;margin:14px 0}.flo-kpi{background:#fff;border:1px solid #dfe5e0;border-radius:10px;padding:14px;min-height:94px;border-left:5px solid #35792a}.flo-kpi:nth-child(2){border-left-color:#c6d52f}.flo-kpi:nth-child(3){border-left-color:#034c1f}.flo-kpi:nth-child(4){border-left-color:#9a9a9a}.flo-kpi:nth-child(5){border-left-color:#024c6a}.flo-kpi span,.flo-kpi small{display:block;font-size:11px;color:#646464}.flo-kpi strong{display:block;font-size:25px;color:#034c1f;margin:5px 0;font-weight:700}.flo-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0}.flo-controls input,.flo-controls select,.flo-input{min-height:40px;border:1px solid #cfd9d1;border-radius:7px;padding:8px 10px;background:#fff;color:#646464;font:13px Arial,sans-serif}.flo-controls input{flex:1;min-width:230px}.flo-button{min-height:40px;border:1px solid #034c1f;border-radius:7px;padding:0 14px;background:#034c1f;color:#fff;font:700 13px Arial,sans-serif;cursor:pointer}.flo-button.secondary{background:#fff;color:#034c1f}.flo-button.lime{background:#c6d52f;border-color:#c6d52f;color:#034c1f}.flo-table-wrap{overflow:auto;border:1px solid #dfe5e0;border-radius:9px}.flo-table{width:100%;border-collapse:collapse;min-width:1250px}.flo-table th,.flo-table td{padding:10px;border-bottom:1px solid #edf1ed;text-align:left;vertical-align:top;font-size:11px;line-height:1.4}.flo-table th{background:#646464;color:#fff;position:sticky;top:0;z-index:1}.flo-table tbody tr:hover{background:#f7faf6}.flo-table strong{color:#034c1f}.flo-chip{display:inline-flex;border-radius:5px;padding:4px 7px;background:#edf4e9;color:#034c1f;font-size:10px;font-weight:700}.flo-chip.completed{background:#e7f2f7;color:#024c6a}.flo-chip.warning{background:#fff1d4;color:#8a5c00}.flo-progress{height:8px;background:#e8ede9;border-radius:999px;overflow:hidden;min-width:90px}.flo-progress i{display:block;height:100%;background:#35792a}.flo-progress i.lime{background:#c6d52f}.flo-chart{height:300px;position:relative}.flo-status-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.flo-status-card{border:1px solid #dfe5e0;border-radius:9px;padding:12px;background:#fff}.flo-status-card strong{display:block;color:#034c1f;font-size:13px;margin:5px 0}.flo-status-card small{font-size:10px;line-height:1.4;color:#646464}.flo-status-line{display:flex;align-items:center;gap:7px;font-size:11px}.flo-drop{border:2px dashed #9a9a9a;border-radius:10px;padding:24px;text-align:center;background:#fbfcfb;cursor:pointer}.flo-drop.drag{border-color:#35792a;background:#f2f8ef}.flo-doc-list{display:grid;gap:8px;margin-top:12px}.flo-doc{display:grid;grid-template-columns:1fr auto;gap:10px;border:1px solid #dfe5e0;border-radius:8px;padding:11px;background:#fff}.flo-doc strong{display:block;color:#034c1f;font-size:12px}.flo-doc small{display:block;font-size:10px;color:#646464;margin-top:4px}.flo-search-result{border-left:4px solid #35792a;background:#f8faf7;padding:11px;margin:8px 0;border-radius:0 8px 8px 0}.flo-search-result strong{color:#034c1f}.flo-search-result p{font-size:12px;margin:5px 0}.flo-drawer{position:fixed;right:16px;top:74px;z-index:1400;width:min(460px,calc(100vw - 32px));max-height:calc(100vh - 90px);overflow:auto;background:#fff;border:1px solid #dfe5e0;border-radius:11px;box-shadow:0 22px 70px rgba(3,76,31,.25);padding:17px;display:none}.flo-drawer.open{display:block}.flo-drawer-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.flo-drawer-head button{width:36px;height:36px;border:1px solid #dfe5e0;border-radius:7px;background:#fff}.flo-note{font-size:11px;line-height:1.5;color:#646464;background:#f5f7f5;border-left:4px solid #c6d52f;padding:10px;margin:10px 0}.flo-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1700;background:#034c1f;color:#fff;padding:10px 14px;border-radius:7px;font:700 12px Arial;box-shadow:0 10px 30px rgba(0,0,0,.22)}
      @media(max-width:1100px){.flo-kpis,.flo-status-grid{grid-template-columns:repeat(3,1fr)}.flo-span-8,.flo-span-7,.flo-span-6,.flo-span-5,.flo-span-4{grid-column:span 12}}
      @media(max-width:720px){.flo-kpis,.flo-status-grid{grid-template-columns:1fr 1fr}.flo-grid{display:block}.flo-panel{padding:14px}.flo-controls>*{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function toast(message) {
    const node = document.createElement('div');
    node.className = 'flo-toast';
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2400);
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache:'no-store' });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  }

  async function loadAll(force = false) {
    const suffix = force ? `&refresh=${Date.now()}` : '';
    const entries = Object.entries(URLS);
    const results = await Promise.all(entries.map(async ([key, url]) => {
      try { return [key, await fetchJson(url + suffix), null]; }
      catch (error) { return [key, null, error]; }
    }));
    results.forEach(([key, value]) => { if (value) state[key] = value; });
    updateGlobalStatus(results);
    mountProjects(true);
    mountHomeStatus(true);
    return results;
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath:'id' });
          store.createIndex('project', 'project', { unique:false });
          store.createIndex('type', 'type', { unique:false });
          store.createIndex('uploadedAt', 'uploadedAt', { unique:false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function dbPut(record) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function dbAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async function dbDelete(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function splitCsvLine(line) {
    const values = []; let value = ''; let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') { value += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { values.push(value.trim()); value = ''; }
      else value += char;
    }
    values.push(value.trim());
    return values;
  }

  function csvToObjects(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter(line => line.trim());
    if (!lines.length) return [];
    const headers = splitCsvLine(lines[0]);
    return lines.slice(1).map(line => {
      const values = splitCsvLine(line); const row = {};
      headers.forEach((header, index) => { row[header] = values[index] ?? ''; });
      return row;
    });
  }

  async function ensureScript(src, globalName) {
    if (window[globalName]) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src; script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
    });
  }

  async function extractFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (['txt','md','csv','tsv','json','html','htm'].includes(extension)) return file.text();
    if (['xlsx','xls'].includes(extension)) {
      await ensureScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX');
      const workbook = XLSX.read(await file.arrayBuffer(), { type:'array' });
      return workbook.SheetNames.map(name => `## ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`).join('\n\n');
    }
    if (extension === 'docx') {
      await ensureScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js', 'mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer:await file.arrayBuffer() });
      return result.value;
    }
    if (extension === 'pdf') {
      await ensureScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js', 'pdfjsLib');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data:await file.arrayBuffer() }).promise;
      const pages = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(`## Page ${pageNumber}\n${content.items.map(item => item.str).join(' ')}`);
      }
      return pages.join('\n\n');
    }
    return `[Binary file indexed by metadata only: ${file.name}]`;
  }

  function projectOptions() {
    const projects = state.projects?.projects || [];
    return projects.map(item => `<option value="${esc(item.project_name)}">${esc(item.project_name)}</option>`).join('');
  }

  function globalDrawer() {
    if ($('#floDrawer')) return;
    document.body.insertAdjacentHTML('beforeend', `<aside class="flo-drawer flo-shell" id="floDrawer"><div class="flo-drawer-head"><div><span class="flo-kicker">NO-COST LIVE OPERATIONS</span><h3>Data operations centre</h3><p>Refresh public feeds, inspect data health and load approved local research files without API credits.</p></div><button id="floDrawerClose">×</button></div><div id="floDrawerBody"></div></aside>`);
    $('#floDrawerClose').onclick = () => $('#floDrawer').classList.remove('open');
  }

  function renderDrawer() {
    globalDrawer();
    const cards = [
      ['Project tracker', state.projects ? `${state.projects.projects?.length || 0} workstreams` : 'Unavailable', state.projects?.updated_at],
      ['Laboratory news', state.news ? `${state.news.items?.length || 0} articles` : 'Unavailable', state.news?.generated_at],
      ['Social intelligence', state.social ? `${state.social.companies?.length || 0} companies` : 'Unavailable', state.social?.generated_at],
      ['Email workflow', state.email?.status || 'Unavailable', state.email?.updated_at || state.email?.sent_at],
      ['AI worker', state.ai?.status || state.ai?.ok ? 'Reachable' : 'Unavailable', state.ai?.checked_at]
    ];
    $('#floDrawerBody').innerHTML = `<div class="flo-controls"><button class="flo-button" id="floRefreshAll">Refresh all live data</button><button class="flo-button secondary" id="floOpenLibrary">Open local repository</button></div><div class="flo-status-grid">${cards.map(([name,value,date]) => `<article class="flo-status-card"><div class="flo-status-line"><i class="flo-dot ${value === 'Unavailable' ? 'off' : ''}"></i>${esc(name)}</div><strong>${esc(value)}</strong><small>${esc(dateText(date))}</small></article>`).join('')}</div><div class="flo-note"><strong>Private Quest files stay in the browser.</strong> They are not uploaded to GitHub. Use SharePoint as the approved system of record and this local workspace for zero-cost demonstrations.</div>`;
    $('#floRefreshAll').onclick = async () => { await loadAll(true); renderDrawer(); toast('Live datasets refreshed.'); };
    $('#floOpenLibrary').onclick = () => { $('#floDrawer').classList.remove('open'); const nav = $('.nav-item[data-view="library"]'); if (nav) nav.click(); };
  }

  function installGlobalBadge() {
    const target = $('.top-actions') || $('.topbar') || $('header');
    if (!target || $('#floGlobalBadge')) return;
    const button = document.createElement('button');
    button.id = 'floGlobalBadge'; button.className = 'flo-badge';
    button.innerHTML = '<i class="flo-dot warn"></i><span>Live data: checking</span>';
    button.onclick = () => { renderDrawer(); $('#floDrawer').classList.toggle('open'); };
    target.prepend(button);
  }

  function updateGlobalStatus(results) {
    installGlobalBadge();
    const failed = results.filter(([, value]) => !value).length;
    const badge = $('#floGlobalBadge'); if (!badge) return;
    badge.innerHTML = `<i class="flo-dot ${failed ? 'warn' : ''}"></i><span>${failed ? `${results.length - failed}/${results.length} live sources` : 'All live sources ready'}</span>`;
    renderDrawer();
  }

  function homeStatusHtml() {
    const projectCount = state.projects?.projects?.length || 0;
    const articleCount = state.news?.items?.length || 0;
    const socialCount = state.social?.companies?.length || 0;
    return `<section class="flo-panel flo-shell" id="floHomeStatus"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><span class="flo-kicker">LIVE OPERATIONS</span><h3>Connected intelligence services</h3><p>Operational view of the free, data-driven services currently powering the prototype.</p></div><button class="flo-button secondary" id="floHomeRefresh">Refresh all</button></div><div class="flo-status-grid" style="margin-top:12px"><article class="flo-status-card"><div class="flo-status-line"><i class="flo-dot"></i>Project portfolio</div><strong>${projectCount} workstreams</strong><small>JSON-driven weekly tracker</small></article><article class="flo-status-card"><div class="flo-status-line"><i class="flo-dot"></i>News monitor</div><strong>${fmt(articleCount)} articles</strong><small>Six-hour GitHub Actions sync</small></article><article class="flo-status-card"><div class="flo-status-line"><i class="flo-dot ${socialCount ? '' : 'warn'}"></i>Social dashboard</div><strong>${socialCount} companies</strong><small>Import-ready daily/weekly dataset</small></article><article class="flo-status-card"><div class="flo-status-line"><i class="flo-dot"></i>Local research</div><strong id="floHomeDocs">Checking…</strong><small>Browser-indexed approved files</small></article><article class="flo-status-card"><div class="flo-status-line"><i class="flo-dot ${state.ai ? '' : 'warn'}"></i>AI services</div><strong>${state.ai ? 'Monitor available' : 'Manual mode'}</strong><small>No new paid API required</small></article></div></section>`;
  }

  async function mountHomeStatus(force = false) {
    const view = $('.view[data-view="home"]'); if (!view) return;
    const existing = $('#floHomeStatus', view);
    if (existing && !force) return;
    if (existing) existing.remove();
    const firstGrid = $('.kpi-grid', view) || view.firstElementChild;
    firstGrid.insertAdjacentHTML('afterend', homeStatusHtml());
    $('#floHomeRefresh').onclick = async () => { await loadAll(true); toast('Executive data refreshed.'); };
    const docs = await dbAll().catch(() => []); if ($('#floHomeDocs')) $('#floHomeDocs').textContent = `${docs.length} indexed files`;
  }

  function projectMetrics(projects) {
    const numeric = projects.filter(item => Number.isFinite(Number(item.total_target)));
    return {
      workstreams: projects.length,
      onTrack: projects.filter(item => item.status === 'On Track').length,
      completedProjects: projects.filter(item => item.status === 'Completed').length,
      target: numeric.reduce((sum,item) => sum + Number(item.total_target || 0), 0),
      completed: numeric.reduce((sum,item) => sum + Number(item.completed || 0), 0),
      remaining: numeric.reduce((sum,item) => sum + Number(item.remaining || 0), 0),
      finalAverage: Math.round(projects.reduce((sum,item) => sum + Number(item.final_progress || 0), 0) / Math.max(projects.length,1))
    };
  }

  function projectsTemplate() {
    const projects = state.projects?.projects || [];
    const metrics = projectMetrics(projects);
    return `<section class="view flo-shell" data-view="projects" data-live-projects="true"><div class="page-heading"><div><span class="section-kicker">LIVE PRIMARY MARKET RESEARCH PORTFOLIO</span><h1>PMR Projects & Reports</h1><p>JSON-driven weekly tracker with browser-side imports, portfolio analytics and downloadable records.</p></div><div class="heading-actions"><button class="secondary-button" id="floProjectImport">Upload tracker CSV/JSON</button><button class="primary-button" id="floProjectExport">Export current CSV</button></div></div><div class="flo-status-line"><i class="flo-dot"></i><strong>Reporting date:</strong> ${esc(state.projects?.reporting_date || 'Not available')} · Last source update ${esc(dateText(state.projects?.updated_at))}</div><div class="flo-kpis"><article class="flo-kpi"><span>Tracked workstreams</span><strong id="floWorkstreams">${metrics.workstreams}</strong><small>${metrics.onTrack} on track · ${metrics.completedProjects} completed</small></article><article class="flo-kpi"><span>Respondents completed</span><strong id="floCompleted">${metrics.completed}/${metrics.target}</strong><small>${metrics.remaining} remaining</small></article><article class="flo-kpi"><span>Fieldwork completion</span><strong>${metrics.target ? Math.round(metrics.completed/metrics.target*100) : 0}%</strong><small>Applicable IDI and survey workstreams</small></article><article class="flo-kpi"><span>Final output progress</span><strong>${metrics.finalAverage}%</strong><small>Portfolio average</small></article><article class="flo-kpi"><span>Open blockers</span><strong>${projects.filter(item => !['NA','Not Applicable',''].includes(item.risk)).length}</strong><small>Based on latest tracker</small></article></div><div class="flo-controls"><input id="floProjectSearch" placeholder="Search projects, owners, milestones or next steps…"><select id="floProjectStatus"><option value="">All statuses</option><option>On Track</option><option>Completed</option><option>At Risk</option><option>Blocked</option></select><select id="floProjectType"><option value="">All research types</option>${[...new Set(projects.map(item => item.research_type))].map(value => `<option>${esc(value)}</option>`).join('')}</select><button class="flo-button secondary" id="floProjectReset">Reset</button></div><div class="flo-grid"><article class="flo-panel flo-span-7"><span class="flo-kicker">DELIVERABLE PROGRESS</span><h3>Final report completion by workstream</h3><div class="flo-chart"><canvas id="floProjectProgressChart"></canvas></div></article><article class="flo-panel flo-span-5"><span class="flo-kicker">FIELDWORK DELIVERY</span><h3>Target versus completed</h3><div class="flo-chart"><canvas id="floProjectFieldworkChart"></canvas></div></article><article class="flo-panel flo-span-12"><span class="flo-kicker">PROJECT REGISTER</span><h3>Current portfolio records</h3><div class="flo-table-wrap"><table class="flo-table"><thead><tr><th>Project</th><th>Type</th><th>Lead / owner</th><th>Status</th><th>Fieldwork</th><th>Interim</th><th>Final</th><th>Next milestone</th><th>Due</th><th>Next step</th><th>Response needed</th></tr></thead><tbody id="floProjectRows"></tbody></table></div></article></div><input type="file" id="floProjectFile" accept=".csv,.json" hidden></section>`;
  }

  function projectRows(projects) {
    return projects.map(item => `<tr><td><strong>${esc(item.project_name)}</strong><br><small>${esc(item.hubspot_id || item.id)}</small></td><td>${esc(item.research_type)}</td><td><strong>${esc(item.evs_lead)}</strong><br><small>${esc(item.client_owner)}</small></td><td><span class="flo-chip ${item.status === 'Completed' ? 'completed' : ''}">${esc(item.status)}</span><br><small>${esc(item.priority)} priority</small></td><td>${item.total_target == null ? 'N/A' : `${fmt(item.completed)}/${fmt(item.total_target)}<div class="flo-progress"><i style="width:${Number(item.fieldwork_progress || 0)}%"></i></div>`}</td><td>${esc(item.interim_status)}<div class="flo-progress"><i class="lime" style="width:${Number(item.interim_progress || 0)}%"></i></div></td><td>${esc(item.final_status)}<div class="flo-progress"><i style="width:${Number(item.final_progress || 0)}%"></i></div></td><td>${esc(item.next_milestone)}</td><td>${esc(item.milestone_due || 'N/A')}</td><td>${esc(item.next_step)}</td><td>${esc(item.response_needed_from)}</td></tr>`).join('');
  }

  function destroyChart(key) { if (state.charts[key]) { state.charts[key].destroy(); delete state.charts[key]; } }

  function renderProjectCharts(projects) {
    if (!window.Chart) return;
    const labels = projects.map(item => item.project_name.length > 28 ? `${item.project_name.slice(0,28)}…` : item.project_name);
    destroyChart('projectProgress'); destroyChart('projectFieldwork');
    const progress = $('#floProjectProgressChart');
    if (progress) state.charts.projectProgress = new Chart(progress, { type:'bar', data:{ labels, datasets:[{ label:'Final report progress', data:projects.map(item => item.final_progress || 0), backgroundColor:projects.map((_,index) => ['#35792a','#c6d52f','#034c1f','#9a9a9a','#024c6a','#3995bb','#80276c','#c78800'][index%8]), borderRadius:4 }] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{display:false} }, scales:{ x:{min:0,max:100,ticks:{callback:value=>`${value}%`}} } } });
    const fieldwork = projects.filter(item => item.total_target != null);
    const fieldCanvas = $('#floProjectFieldworkChart');
    if (fieldCanvas) state.charts.projectFieldwork = new Chart(fieldCanvas, { type:'bar', data:{ labels:fieldwork.map(item => item.project_name.slice(0,20)), datasets:[{ label:'Target', data:fieldwork.map(item => item.total_target), backgroundColor:'#9a9a9a', borderRadius:4 },{ label:'Completed', data:fieldwork.map(item => item.completed), backgroundColor:'#35792a', borderRadius:4 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{position:'bottom'} }, scales:{ y:{beginAtZero:true} } } });
  }

  function filteredProjects() {
    const query = ($('#floProjectSearch')?.value || '').toLowerCase();
    const status = $('#floProjectStatus')?.value || '';
    const type = $('#floProjectType')?.value || '';
    return (state.projects?.projects || []).filter(item => (!query || JSON.stringify(item).toLowerCase().includes(query)) && (!status || item.status === status) && (!type || item.research_type === type));
  }

  function rerenderProjects() {
    const projects = filteredProjects();
    if ($('#floProjectRows')) $('#floProjectRows').innerHTML = projectRows(projects);
    renderProjectCharts(projects);
  }

  function exportProjects() {
    const projects = filteredProjects();
    if (!projects.length) return;
    const headers = Object.keys(projects[0]);
    const csv = [headers.join(','), ...projects.map(row => headers.map(header => `"${String(row[header] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); link.download = `quest-project-tracker-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
  }

  function normalizeProjectRow(row, index) {
    const get = (...keys) => { for (const key of keys) if (row[key] !== undefined && row[key] !== '') return row[key]; return ''; };
    const number = value => value === '' || /not applicable/i.test(value) ? null : Number(String(value).replace('%',''));
    return {
      id:get('id','HubSpot ID','Hubspot ID') || `local-${Date.now()}-${index}`,
      project_name:get('project_name','Project Name'), research_type:get('research_type','Research Type'), sow_focus:get('sow_focus','SOW Goal / Outcome'), evs_lead:get('evs_lead','EVS Lead'), client_owner:get('client_owner','Client Owner'), status:get('status','Status') || 'On Track', priority:get('priority','Priority') || 'High', screener_status:get('screener_status','Screener Status'), screener_progress:number(get('screener_progress','Screener Progress (%)')), instrument_status:get('instrument_status','DG / Survey Questions Status'), instrument_progress:number(get('instrument_progress','DG / Survey Questions Progress (%)')), total_target:number(get('total_target','Total Target')), completed:number(get('completed','Interviewed /Surveyed','Interviewed / Surveyed')), remaining:number(get('remaining','Remaining')), fieldwork_progress:number(get('fieldwork_progress','% IDI / Survey Complete')), interim_status:get('interim_status','Status of Interim Report'), interim_progress:number(get('interim_progress','Interim Report Progress (%)')), final_status:get('final_status','Status of Final Report'), final_progress:number(get('final_progress','Final Report Progress (%)')), start_date:get('start_date','Project Start Date'), next_milestone:get('next_milestone','Next Milestone'), milestone_due:get('milestone_due','Milestone Due'), last_week_highlight:get('last_week_highlight','Last Week Highlights vs Goals / SOW'), next_step:get('next_step','Outstanding Items / Next Steps'), next_step_owner:get('next_step_owner','Owner of Next Step'), risk:get('risk','Risks / Blockers') || 'NA', response_needed_from:get('response_needed_from','Response Needed From')
    };
  }

  async function importProjectTracker(file) {
    const text = await file.text();
    const rows = file.name.toLowerCase().endsWith('.json') ? (JSON.parse(text).projects || JSON.parse(text)) : csvToObjects(text);
    if (!Array.isArray(rows) || !rows.length) throw new Error('No project rows found.');
    state.projects = { schema_version:1, updated_at:new Date().toISOString(), reporting_date:new Date().toISOString().slice(0,10), source:`Local import: ${file.name}`, projects:rows.map(normalizeProjectRow) };
    localStorage.setItem('quest-local-project-tracker', JSON.stringify(state.projects));
    mountProjects(true); mountHomeStatus(true); toast(`${rows.length} project rows loaded locally.`);
  }

  function wireProjects() {
    ['floProjectSearch','floProjectStatus','floProjectType'].forEach(id => { const node = $(`#${id}`); if (node) node.addEventListener(id === 'floProjectSearch' ? 'input' : 'change', rerenderProjects); });
    $('#floProjectReset').onclick = () => { $('#floProjectSearch').value=''; $('#floProjectStatus').value=''; $('#floProjectType').value=''; rerenderProjects(); };
    $('#floProjectExport').onclick = exportProjects;
    $('#floProjectImport').onclick = () => $('#floProjectFile').click();
    $('#floProjectFile').onchange = async event => { try { await importProjectTracker(event.target.files[0]); } catch (error) { toast(error.message); } event.target.value=''; };
  }

  function mountProjects(force = false) {
    const view = $('.view[data-view="projects"]'); if (!view || !state.projects) return;
    if (view.dataset.liveProjects === 'true' && !force) return;
    const active = view.classList.contains('active');
    const wrapper = document.createElement('div'); wrapper.innerHTML = projectsTemplate();
    const replacement = wrapper.firstElementChild; if (active) replacement.classList.add('active');
    view.replaceWith(replacement); $('#floProjectRows').innerHTML = projectRows(state.projects.projects || []); wireProjects(); setTimeout(() => renderProjectCharts(state.projects.projects || []), 100);
  }

  function libraryPanelHtml() {
    return `<section class="flo-panel flo-shell" id="floLocalRepository"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><span class="flo-kicker">LOCAL RESEARCH WORKSPACE</span><h3>Index approved files in this browser</h3><p>Free browser-side extraction for PDF, DOCX, XLSX, CSV, JSON, TXT and Markdown. Files stay on this device and can be searched without API credits.</p></div><button class="flo-button secondary" id="floClearDocs">Clear local files</button></div><div class="flo-controls"><select id="floDocProject"><option value="Unassigned">Select project / Unassigned</option>${projectOptions()}</select><select id="floDocType"><option>Final Report</option><option>PMR Transcript</option><option>Survey Data</option><option>Discussion Guide / Questionnaire</option><option>Presentation Output</option><option>Competitive Intelligence</option><option>Other</option></select></div><div class="flo-drop" id="floDrop"><strong>Drop approved files here or click to browse</strong><p>Nothing is sent to GitHub or an external AI service.</p><input id="floFiles" type="file" multiple hidden></div><div class="flo-controls"><input id="floLibrarySearch" placeholder="Search indexed file text, project, type or filename…"><button class="flo-button" id="floLibrarySearchButton">Search local evidence</button></div><div id="floLibraryResults"></div><div class="flo-doc-list" id="floDocList"></div></section>`;
  }

  async function renderDocs() {
    const root = $('#floDocList'); if (!root) return;
    const docs = (await dbAll()).sort((a,b) => b.uploadedAt.localeCompare(a.uploadedAt));
    root.innerHTML = docs.length ? docs.map(doc => `<article class="flo-doc"><div><strong>${esc(doc.name)}</strong><small>${esc(doc.project)} · ${esc(doc.type)} · ${fmt(doc.size)} bytes · ${esc(dateText(doc.uploadedAt))}</small></div><button class="flo-button secondary" data-delete-doc="${esc(doc.id)}">Delete</button></article>`).join('') : '<div class="flo-note">No local files indexed yet.</div>';
    $$('[data-delete-doc]', root).forEach(button => button.onclick = async () => { await dbDelete(button.dataset.deleteDoc); renderDocs(); mountHomeStatus(true); });
  }

  async function ingestFiles(files) {
    const project = $('#floDocProject').value; const type = $('#floDocType').value;
    for (const file of files) {
      toast(`Indexing ${file.name}…`);
      try {
        const text = await extractFile(file);
        await dbPut({ id:`${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`, name:file.name, project, type, mime:file.type, size:file.size, uploadedAt:new Date().toISOString(), text:text.slice(0,5000000) });
      } catch (error) { toast(`Could not index ${file.name}: ${error.message}`); }
    }
    await renderDocs(); await mountHomeStatus(true); toast('Local indexing complete.');
  }

  function searchScore(doc, terms) {
    const haystack = `${doc.name} ${doc.project} ${doc.type} ${doc.text}`.toLowerCase();
    return terms.reduce((sum,term) => sum + (haystack.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g')) || []).length, 0);
  }

  function snippet(text, terms) {
    const lower = text.toLowerCase(); let index = Math.min(...terms.map(term => { const found=lower.indexOf(term); return found < 0 ? Infinity : found; }));
    if (!Number.isFinite(index)) index = 0;
    return text.slice(Math.max(0,index-180), Math.min(text.length,index+620)).replace(/\s+/g,' ');
  }

  async function searchLocalEvidence(query, target = '#floLibraryResults') {
    const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    const docs = await dbAll();
    const results = docs.map(doc => ({ doc, score:searchScore(doc,terms) })).filter(item => item.score > 0).sort((a,b) => b.score-a.score).slice(0,20);
    const root = $(target); if (!root) return results;
    root.innerHTML = results.length ? results.map(({doc,score}) => `<article class="flo-search-result"><strong>${esc(doc.name)}</strong> <span class="flo-chip">${score} matches</span><p>${esc(snippet(doc.text,terms))}</p><small>${esc(doc.project)} · ${esc(doc.type)}</small></article>`).join('') : '<div class="flo-note">No local evidence matched. Index approved files first or broaden the query.</div>';
    return results;
  }

  function wireLibrary() {
    const drop = $('#floDrop'); const input = $('#floFiles');
    drop.onclick = () => input.click(); input.onchange = () => ingestFiles([...input.files]);
    ['dragenter','dragover'].forEach(name => drop.addEventListener(name,event => { event.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave','drop'].forEach(name => drop.addEventListener(name,event => { event.preventDefault(); drop.classList.remove('drag'); }));
    drop.addEventListener('drop',event => ingestFiles([...event.dataTransfer.files]));
    $('#floLibrarySearchButton').onclick = () => searchLocalEvidence($('#floLibrarySearch').value);
    $('#floLibrarySearch').addEventListener('keydown',event => { if(event.key==='Enter') searchLocalEvidence(event.target.value); });
    $('#floClearDocs').onclick = async () => { if (!confirm('Remove all locally indexed files from this browser?')) return; const docs=await dbAll(); await Promise.all(docs.map(doc=>dbDelete(doc.id))); renderDocs(); mountHomeStatus(true); };
    renderDocs();
  }

  function mountLibrary() {
    const view = $('.view[data-view="library"]'); if (!view || $('#floLocalRepository',view)) return;
    const heading = $('.page-heading',view) || view.firstElementChild;
    heading.insertAdjacentHTML('afterend', libraryPanelHtml()); wireLibrary();
  }

  function copilotPanelHtml() {
    return `<section class="flo-panel flo-shell" id="floLocalEvidenceSearch"><span class="flo-kicker">FREE EVIDENCE RETRIEVAL MODE</span><h3>Search locally indexed Quest research</h3><p>Use this when a paid AI API is not available. It retrieves supporting passages from selected local files so an analyst can validate and synthesize them in ChatGPT Pro or Copilot Studio.</p><div class="flo-controls"><input id="floCopilotQuery" placeholder="Ask a business question or enter key concepts…"><button class="flo-button" id="floCopilotSearch">Retrieve evidence</button><button class="flo-button secondary" id="floCopyPrompt">Copy analysis prompt</button></div><div id="floCopilotResults"></div></section>`;
  }

  function mountCopilot() {
    const view = $('.view[data-view="copilot"]'); if (!view || $('#floLocalEvidenceSearch',view)) return;
    const heading = $('.page-heading',view) || view.firstElementChild;
    heading.insertAdjacentHTML('afterend', copilotPanelHtml());
    $('#floCopilotSearch').onclick = () => searchLocalEvidence($('#floCopilotQuery').value,'#floCopilotResults');
    $('#floCopyPrompt').onclick = async () => {
      const query = $('#floCopilotQuery').value.trim(); const results = await searchLocalEvidence(query,'#floCopilotResults');
      const evidence = results.slice(0,8).map(({doc},index) => `SOURCE ${index+1}: ${doc.name} | ${doc.project} | ${doc.type}\n${snippet(doc.text,query.toLowerCase().split(/\s+/).filter(Boolean))}`).join('\n\n');
      const prompt = `Act as Quest's research analyst. Answer the business question using only the evidence below. Identify cross-project patterns, contradictions, evidence gaps and confidence. Cite each claim by SOURCE number. Provide an executive summary and a PowerPoint-ready storyline.\n\nQUESTION: ${query}\n\nEVIDENCE:\n${evidence}`;
      await navigator.clipboard.writeText(prompt); toast('Evidence-grounded prompt copied.');
    };
  }

  function socialImportHtml() {
    return `<section class="flo-panel flo-shell" id="floSocialImport"><div style="display:flex;justify-content:space-between;gap:12px"><div><span class="flo-kicker">ZERO-COST SOCIAL DATA INTAKE</span><h3>Import platform exports for live analysis</h3><p>Upload an approved CSV export from LinkedIn, Facebook, X, YouTube or a manual tracking sheet. The rows are stored only in this browser.</p></div><button class="flo-button secondary" id="floSocialTemplate">Download CSV template</button></div><div class="flo-controls"><input type="file" id="floSocialFile" accept=".csv,.json"><button class="flo-button" id="floSocialImportButton">Import and analyse</button></div><div id="floSocialLocalSummary"></div></section>`;
  }

  function socialSummary(rows) {
    const companies = new Set(rows.map(row => row.Company || row.company).filter(Boolean));
    const platforms = new Set(rows.map(row => row.Platform || row.platform).filter(Boolean));
    const engagement = rows.reduce((sum,row) => sum + Number(row.Engagement || row.engagement || row.Likes || 0),0);
    const themes = {};
    rows.forEach(row => { const theme=row.Theme||row.theme||'Other'; themes[theme]=(themes[theme]||0)+1; });
    const topThemes = Object.entries(themes).sort((a,b)=>b[1]-a[1]).slice(0,5);
    return `<div class="flo-kpis"><article class="flo-kpi"><span>Imported posts</span><strong>${rows.length}</strong><small>Local browser dataset</small></article><article class="flo-kpi"><span>Companies</span><strong>${companies.size}</strong><small>Represented in export</small></article><article class="flo-kpi"><span>Platforms</span><strong>${platforms.size}</strong><small>${esc([...platforms].join(', '))}</small></article><article class="flo-kpi"><span>Total engagement</span><strong>${fmt(engagement)}</strong><small>Based on available metrics</small></article><article class="flo-kpi"><span>Top theme</span><strong style="font-size:17px">${esc(topThemes[0]?.[0] || '—')}</strong><small>${topThemes[0]?.[1] || 0} posts</small></article></div><div class="flo-table-wrap"><table class="flo-table"><thead><tr><th>Company</th><th>Platform</th><th>Date</th><th>Theme</th><th>Post summary</th><th>Engagement</th><th>Sentiment</th></tr></thead><tbody>${rows.slice(0,100).map(row=>`<tr><td>${esc(row.Company||row.company)}</td><td>${esc(row.Platform||row.platform)}</td><td>${esc(row['Post date']||row.date)}</td><td>${esc(row.Theme||row.theme)}</td><td>${esc(row['Post text']||row.summary||row.Text||'')}</td><td>${esc(row.Engagement||row.engagement||row.Likes||'')}</td><td>${esc(row.Sentiment||row.sentiment||'')}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function mountSocialImport() {
    const view = $('.view[data-view="social"]'); if (!view || $('#floSocialImport',view)) return;
    const heading = $('.page-heading',view) || view.firstElementChild;
    heading.insertAdjacentHTML('afterend', socialImportHtml());
    const template = 'Company,Platform,Post date,Post URL,Post text,Content type,Theme,Likes,Comments,Shares,Views,Engagement,Sentiment,Strategic relevance,Analyst note\nQuest Diagnostics,LinkedIn,2026-08-06,https://example.com,Example post,Thought leadership,Patient access,120,15,8,5000,143,Positive,High,Replace with approved export data';
    $('#floSocialTemplate').onclick = () => { const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([template],{type:'text/csv'}));link.download='quest-social-tracking-template.csv';link.click();URL.revokeObjectURL(link.href); };
    $('#floSocialImportButton').onclick = async () => { const file=$('#floSocialFile').files[0]; if(!file)return toast('Select a CSV or JSON file.'); try{const text=await file.text();const rows=file.name.toLowerCase().endsWith('.json')?JSON.parse(text):csvToObjects(text);localStorage.setItem('quest-local-social-posts',JSON.stringify(rows));$('#floSocialLocalSummary').innerHTML=socialSummary(rows);toast(`${rows.length} social rows imported.`);}catch(error){toast(error.message);} };
    try { const rows=JSON.parse(localStorage.getItem('quest-local-social-posts')||'[]'); if(rows.length) $('#floSocialLocalSummary').innerHTML=socialSummary(rows); } catch (_) {}
  }

  function mountAll() { installGlobalBadge(); mountHomeStatus(); mountProjects(); mountLibrary(); mountCopilot(); mountSocialImport(); }

  async function boot() {
    injectStyles(); globalDrawer();
    try { const local = JSON.parse(localStorage.getItem('quest-local-project-tracker') || 'null'); if (local?.projects?.length) state.projects = local; } catch (_) {}
    await loadAll(false);
    mountAll();
    const observer = new MutationObserver(() => mountAll()); observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',event => { if(event.target.closest('.nav-item')) setTimeout(mountAll,80); });
    setInterval(() => loadAll(true), 6 * 60 * 60 * 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
