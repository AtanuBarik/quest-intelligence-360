(() => {
  'use strict';

  const RELEASE = '20260809a';
  const DB_NAME = 'quest-intelligence-local-repository';
  const DB_VERSION = 1;
  const STORE = 'documents';
  const MAX_LIST = 50;
  const MAX_SEARCH_RESULTS = 25;
  const MAX_INDEXED_TEXT = 5_000_000;
  const MAX_FILE_BYTES = 75 * 1024 * 1024;
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const fmt = number => Number(number || 0).toLocaleString();
  const yieldUi = () => new Promise(resolve => setTimeout(resolve, 0));

  function injectStyles() {
    if ($('#qKnowledgeLiteStyles')) return;
    const style = document.createElement('style');
    style.id = 'qKnowledgeLiteStyles';
    style.textContent = `
      .qkr-shell{font-family:Arial,sans-serif;color:#646464}.qkr-panel{margin:14px 0;padding:18px;border:1px solid #dfe5e0;border-radius:10px;background:#fff;box-shadow:0 7px 22px rgba(3,76,31,.05)}.qkr-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.qkr-kicker{display:block;color:#35792a;font-size:11px;font-weight:700;letter-spacing:1.1px;margin-bottom:5px}.qkr-head h3{margin:0 0 6px;color:#35792a;font-size:19px;font-weight:500}.qkr-head p{margin:0;font-size:12px;line-height:1.5}.qkr-actions,.qkr-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.qkr-controls{margin:12px 0}.qkr-controls input,.qkr-controls select{min-height:40px;border:1px solid #cfd9d1;border-radius:7px;padding:8px 10px;background:#fff;color:#646464;font:13px Arial,sans-serif}.qkr-controls input{flex:1;min-width:240px}.qkr-btn{min-height:40px;border:1px solid #034c1f;border-radius:7px;padding:0 13px;background:#034c1f;color:#fff;font:700 12px Arial,sans-serif;cursor:pointer}.qkr-btn.secondary{background:#fff;color:#034c1f}.qkr-btn:disabled{opacity:.55;cursor:wait}.qkr-drop{border:2px dashed #9a9a9a;border-radius:10px;padding:22px;text-align:center;background:#fbfcfb;cursor:pointer}.qkr-drop.drag{border-color:#35792a;background:#f2f8ef}.qkr-drop p{margin:5px 0 0;font-size:11px}.qkr-status{margin-top:10px;padding:9px 10px;border-left:4px solid #c6d52f;background:#f5f7f3;font-size:11px;line-height:1.45}.qkr-list{display:grid;gap:8px;margin-top:10px}.qkr-doc{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 11px;border:1px solid #dfe5e0;border-radius:8px;background:#fff}.qkr-doc strong{display:block;color:#034c1f;font-size:12px}.qkr-doc small{display:block;margin-top:4px;font-size:10px;color:#646464}.qkr-result{margin:8px 0;padding:10px 11px;border-left:4px solid #35792a;border-radius:0 8px 8px 0;background:#f8faf7}.qkr-result strong{color:#034c1f;font-size:12px}.qkr-result p{margin:5px 0;font-size:11px;line-height:1.45}.qkr-chip{display:inline-flex;margin-left:6px;padding:3px 6px;border-radius:999px;background:#edf4e9;color:#034c1f;font-size:9px;font-weight:700}.qkr-progress{height:5px;margin-top:8px;border-radius:999px;background:#e7ece8;overflow:hidden}.qkr-progress i{display:block;height:100%;width:0;background:#35792a;transition:width .15s ease}@media(max-width:720px){.qkr-head{display:block}.qkr-actions{margin-top:10px}.qkr-controls>*{width:100%}}
    `;
    document.head.appendChild(style);
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
      request.onerror = () => reject(request.error || new Error('Unable to open local repository.'));
    });
  }

  async function withStore(mode, fn) {
    const db = await openDb();
    try { return await fn(db.transaction(STORE, mode).objectStore(STORE)); }
    finally { db.close(); }
  }

  function countDocs() {
    return withStore('readonly', store => new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => reject(request.error);
    }));
  }

  function putDoc(record) {
    return withStore('readwrite', store => new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }));
  }

  function deleteDoc(id) {
    return withStore('readwrite', store => new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }));
  }

  function clearDocs() {
    return withStore('readwrite', store => new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }));
  }

  async function recentMetadata(limit = MAX_LIST) {
    return withStore('readonly', store => new Promise((resolve, reject) => {
      const results = [];
      const index = store.index('uploadedAt');
      const request = index.openCursor(null, 'prev');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor || results.length >= limit) return resolve(results);
        const value = cursor.value || {};
        results.push({
          id:value.id,
          name:value.name,
          project:value.project,
          type:value.type,
          size:value.size,
          uploadedAt:value.uploadedAt,
        });
        cursor.continue();
      };
    }));
  }

  async function ensureScript(src, globalName) {
    if (window[globalName]) return;
    await new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find(node => (node.src || '').includes(src));
      if (existing) {
        existing.addEventListener('load', resolve, { once:true });
        existing.addEventListener('error', reject, { once:true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function extractFile(file, progress) {
    if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than the 75 MB browser indexing limit.`);
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    if (['txt','md','csv','tsv','json','html','htm'].includes(extension)) return (await file.text()).slice(0, MAX_INDEXED_TEXT);
    if (['xlsx','xls'].includes(extension)) {
      await ensureScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX');
      const workbook = XLSX.read(await file.arrayBuffer(), { type:'array' });
      const text = workbook.SheetNames.map(name => `## ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`).join('\n\n');
      return text.slice(0, MAX_INDEXED_TEXT);
    }
    if (extension === 'docx') {
      await ensureScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js', 'mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer:await file.arrayBuffer() });
      return String(result.value || '').slice(0, MAX_INDEXED_TEXT);
    }
    if (extension === 'pdf') {
      await ensureScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js', 'pdfjsLib');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data:await file.arrayBuffer() }).promise;
      const pages = [];
      let characters = 0;
      for (let pageNumber = 1; pageNumber <= pdf.numPages && characters < MAX_INDEXED_TEXT; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = `## Page ${pageNumber}\n${content.items.map(item => item.str).join(' ')}`;
        pages.push(pageText);
        characters += pageText.length;
        progress?.(Math.round(pageNumber / pdf.numPages * 100));
        if (pageNumber % 4 === 0) await yieldUi();
      }
      return pages.join('\n\n').slice(0, MAX_INDEXED_TEXT);
    }
    return `[Binary file indexed by metadata only: ${file.name}]`;
  }

  function template() {
    return `<section class="qkr-panel qkr-shell" id="qKnowledgeRepositoryLite"><div class="qkr-head"><div><span class="qkr-kicker">LOCAL RESEARCH WORKSPACE</span><h3>Knowledge Repository</h3><p>Index approved research files locally without sending document contents to GitHub or an external AI service. The page opens without reading stored document bodies; large-file extraction and search run only when requested.</p></div><div class="qkr-actions"><button class="qkr-btn secondary" id="qkrShowFiles">Show indexed files</button><button class="qkr-btn secondary" id="qkrClear">Clear local files</button></div></div><div class="qkr-controls"><select id="qkrProject"><option value="Unassigned">Select project / Unassigned</option></select><select id="qkrType"><option>Final Report</option><option>PMR Transcript</option><option>Survey Data</option><option>Discussion Guide / Questionnaire</option><option>Presentation Output</option><option>Competitive Intelligence</option><option>Other</option></select></div><div class="qkr-drop" id="qkrDrop"><strong>Drop approved files here or click to browse</strong><p>PDF, DOCX, XLSX, CSV, JSON, TXT and Markdown · up to 75 MB per file</p><input id="qkrFiles" type="file" multiple hidden></div><div class="qkr-progress" id="qkrProgress" hidden><i></i></div><div class="qkr-controls"><input id="qkrSearch" placeholder="Search indexed text, filename, project or document type…"><button class="qkr-btn" id="qkrSearchButton">Search local evidence</button></div><div class="qkr-status" id="qkrStatus">Checking local repository metadata…</div><div id="qkrResults"></div><div class="qkr-list" id="qkrList"></div></section>`;
  }

  async function updateCount() {
    const status = $('#qkrStatus');
    if (!status) return;
    try {
      const count = await countDocs();
      status.textContent = count ? `${count} indexed file${count === 1 ? '' : 's'} available locally. File contents are not loaded until you search.` : 'No local files are indexed yet.';
    } catch (error) {
      status.textContent = `Local repository unavailable: ${error.message}`;
    }
  }

  async function loadProjects() {
    const select = $('#qkrProject');
    if (!select) return;
    try {
      const response = await fetch(`data/project-tracker.json?v=${RELEASE}`, { cache:'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      const names = (payload.projects || []).map(item => item.project_name).filter(Boolean);
      select.insertAdjacentHTML('beforeend', names.map(name => `<option value="${esc(name)}">${esc(name)}</option>`).join(''));
    } catch (_) {}
  }

  async function showFiles() {
    const button = $('#qkrShowFiles');
    const root = $('#qkrList');
    if (!button || !root) return;
    button.disabled = true;
    button.textContent = 'Loading metadata…';
    root.innerHTML = '';
    try {
      const docs = await recentMetadata(MAX_LIST);
      root.innerHTML = docs.length ? docs.map(doc => `<article class="qkr-doc"><div><strong>${esc(doc.name || 'Untitled file')}</strong><small>${esc(doc.project || 'Unassigned')} · ${esc(doc.type || 'Other')} · ${fmt(doc.size)} bytes · ${esc(doc.uploadedAt || '')}</small></div><button class="qkr-btn secondary" data-qkr-delete="${esc(doc.id)}">Delete</button></article>`).join('') : '<div class="qkr-status">No local files are indexed yet.</div>';
      root.querySelectorAll('[data-qkr-delete]').forEach(node => node.onclick = async () => {
        node.disabled = true;
        await deleteDoc(node.dataset.qkrDelete);
        await updateCount();
        await showFiles();
      });
    } catch (error) {
      root.innerHTML = `<div class="qkr-status">Unable to list local metadata: ${esc(error.message)}</div>`;
    } finally {
      button.disabled = false;
      button.textContent = 'Show indexed files';
    }
  }

  function snippet(text, terms) {
    const value = String(text || '');
    const lower = value.toLowerCase();
    let index = -1;
    for (const term of terms) {
      const found = lower.indexOf(term);
      if (found >= 0 && (index < 0 || found < index)) index = found;
    }
    if (index < 0) return value.slice(0, 320).replace(/\s+/g, ' ');
    return value.slice(Math.max(0, index - 110), index + 310).replace(/\s+/g, ' ');
  }

  async function searchDocs(query) {
    const terms = String(query || '').toLowerCase().split(/\s+/).filter(term => term.length > 1).slice(0, 10);
    const root = $('#qkrResults');
    const status = $('#qkrStatus');
    if (!root || !status) return;
    if (!terms.length) {
      root.innerHTML = '<div class="qkr-status">Enter one or more search terms.</div>';
      return;
    }
    root.innerHTML = '';
    status.textContent = 'Searching local evidence without blocking page navigation…';
    const results = [];
    let scanned = 0;
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const request = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
        request.onerror = () => reject(request.error);
        request.onsuccess = async () => {
          const cursor = request.result;
          if (!cursor) return resolve();
          const doc = cursor.value || {};
          const searchable = `${doc.name || ''}\n${doc.project || ''}\n${doc.type || ''}\n${String(doc.text || '').slice(0, MAX_INDEXED_TEXT)}`.toLowerCase();
          let score = 0;
          terms.forEach(term => {
            let position = 0;
            while ((position = searchable.indexOf(term, position)) >= 0 && score < 1000) { score += 1; position += term.length; }
          });
          if (score) results.push({ doc, score });
          scanned += 1;
          if (scanned % 5 === 0) await yieldUi();
          cursor.continue();
        };
      });
      db.close();
      results.sort((a,b) => b.score - a.score || String(b.doc.uploadedAt || '').localeCompare(String(a.doc.uploadedAt || '')));
      const visible = results.slice(0, MAX_SEARCH_RESULTS);
      root.innerHTML = visible.length ? visible.map(({doc,score}) => `<article class="qkr-result"><strong>${esc(doc.name || 'Untitled file')}</strong><span class="qkr-chip">${score} matches</span><p>${esc(snippet(doc.text, terms))}</p><small>${esc(doc.project || 'Unassigned')} · ${esc(doc.type || 'Other')}</small></article>`).join('') : '<div class="qkr-status">No local evidence matched.</div>';
      status.textContent = `Search complete: ${scanned} indexed file${scanned === 1 ? '' : 's'} checked, ${results.length} matched.`;
    } catch (error) {
      status.textContent = `Search failed: ${error.message}`;
    }
  }

  async function ingest(files) {
    const status = $('#qkrStatus');
    const progress = $('#qkrProgress');
    const bar = progress?.querySelector('i');
    if (!files.length || !status) return;
    if (progress) progress.hidden = false;
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      status.textContent = `Indexing ${file.name} (${index + 1}/${files.length})…`;
      if (bar) bar.style.width = '0%';
      try {
        const text = await extractFile(file, value => { if (bar) bar.style.width = `${value}%`; });
        const now = new Date().toISOString();
        await putDoc({
          id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2,10)}`,
          name:file.name,
          project:$('#qkrProject')?.value || 'Unassigned',
          type:$('#qkrType')?.value || 'Other',
          size:file.size,
          uploadedAt:now,
          text,
          textTruncated:text.length >= MAX_INDEXED_TEXT,
        });
      } catch (error) {
        status.textContent = `Unable to index ${file.name}: ${error.message}`;
        if (progress) progress.hidden = true;
        return;
      }
      await yieldUi();
    }
    if (bar) bar.style.width = '100%';
    if (progress) setTimeout(() => { progress.hidden = true; }, 400);
    await updateCount();
  }

  function bind() {
    const drop = $('#qkrDrop');
    const input = $('#qkrFiles');
    if (!drop || !input || drop.dataset.bound === 'true') return;
    drop.dataset.bound = 'true';
    drop.onclick = () => input.click();
    input.onchange = async () => { await ingest(Array.from(input.files || [])); input.value = ''; };
    ['dragenter','dragover'].forEach(name => drop.addEventListener(name, event => { event.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave','drop'].forEach(name => drop.addEventListener(name, event => { event.preventDefault(); drop.classList.remove('drag'); }));
    drop.addEventListener('drop', event => ingest(Array.from(event.dataTransfer?.files || [])));
    $('#qkrShowFiles').onclick = showFiles;
    $('#qkrSearchButton').onclick = () => searchDocs($('#qkrSearch').value);
    $('#qkrSearch').addEventListener('keydown', event => { if (event.key === 'Enter') searchDocs(event.target.value); });
    $('#qkrClear').onclick = async () => {
      if (!confirm('Remove all locally indexed files from this browser?')) return;
      await clearDocs();
      $('#qkrList').innerHTML = '';
      $('#qkrResults').innerHTML = '';
      await updateCount();
    };
  }

  function mount() {
    injectStyles();
    const view = $('.view[data-view="library"]');
    if (!view || $('#qKnowledgeRepositoryLite', view)) return;
    const legacy = $('#floLocalRepository', view);
    if (legacy) legacy.remove();
    const heading = $('.page-heading', view) || view.firstElementChild;
    if (heading) heading.insertAdjacentHTML('afterend', template());
    else view.insertAdjacentHTML('afterbegin', template());
    bind();
    updateCount();
    loadProjects();
  }

  window.addEventListener('quest:layout-refresh', event => { if (event.detail?.group === 'library') mount(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once:true });
  else mount();
})();
