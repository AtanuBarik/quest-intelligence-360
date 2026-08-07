(() => {
  'use strict';

  const RELEASE = '2026-08-07-lab-sync-v2';
  const REMOTE_BASE = 'https://atanubarik.github.io/laboratory-news-monitor';
  const WORKER = 'https://laboratory-news-ai.atanu-barik.workers.dev';
  const SOURCES = {
    news: ['data/laboratory-news.json', `${REMOTE_BASE}/data/news.json`],
    email: ['data/laboratory-email-status.json', `${REMOTE_BASE}/data/email_status.json`],
    workflow: ['data/laboratory-workflow-health.json', `${REMOTE_BASE}/data/workflow_health.json`],
    strategic: ['data/laboratory-chatgpt-strategic-synthesis.json', `${REMOTE_BASE}/data/chatgpt_strategic_synthesis.json`],
    summaries: ['data/laboratory-chatgpt-summaries.json', `${REMOTE_BASE}/data/chatgpt_summaries.json`],
  };
  const ICON_BASE = 'assets/quest-news-icons';
  const CATEGORY_ICONS = {
    'Product & Services': `${ICON_BASE}/product-services.png`,
    'Product / Innovation': `${ICON_BASE}/product-services.png`,
    'Clinical, R&D': `${ICON_BASE}/clinical-rd.png`,
    'Research / Clinical': `${ICON_BASE}/clinical-rd.png`,
    'Partnership, M&A': `${ICON_BASE}/partnership-ma.png`,
    'Partnerships & Channels': `${ICON_BASE}/partnership-ma.png`,
    'Partnership': `${ICON_BASE}/partnership-ma.png`,
    'M&A / Investment': `${ICON_BASE}/partnership-ma.png`,
    'Financials': `${ICON_BASE}/financials.png`,
    'Financial': `${ICON_BASE}/financials.png`,
    'Organizational Updates': `${ICON_BASE}/organizational.png`,
    'Leadership / Organization': `${ICON_BASE}/organizational.png`,
    'Leadership Changes': `${ICON_BASE}/leadership.png`,
    'Other': `${ICON_BASE}/other.png`
  };

  const state = {
    news: null,
    email: null,
    workflow: null,
    strategic: null,
    summaries: null,
    itemByUrl: new Map(),
    itemByTitle: new Map(),
    loading: false,
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const text = node => (node?.textContent || '').trim();
  const byId = id => document.getElementById(id);

  function injectStyles() {
    if (document.getElementById('questLabSyncStyles')) return;
    const style = document.createElement('style');
    style.id = 'questLabSyncStyles';
    style.textContent = `
      .q-sync-strip{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0 12px;padding:9px 11px;border:1px solid #d9e4da;border-left:4px solid #35792a;border-radius:9px;background:#f8fbf7;color:#646464;font-size:10px}.q-sync-strip strong{color:#034c1f}.q-sync-dot{width:7px;height:7px;border-radius:50%;background:#35792a;box-shadow:0 0 0 3px rgba(53,121,42,.12)}
      .q-category-icon{width:34px;height:34px;object-fit:contain;flex:0 0 34px}.q-chatgpt-chip{background:#eaf3f7!important;color:#024c6a!important}.q-verified-button{border:1px solid #bfd0c0!important;background:#fff!important;color:#034c1f!important;border-radius:6px!important;padding:5px 8px!important;font-size:10px!important;font-weight:700!important;cursor:pointer}.q-verified-button:hover{background:#eef5ea!important}.q-verified-button:disabled{opacity:.55;cursor:wait}
      .q-lab-strategy{margin:0 0 13px;padding:14px;border:1px solid #d9e4da;border-radius:11px;background:linear-gradient(135deg,#fff 0%,#f6faf4 100%);box-shadow:0 4px 14px rgba(3,76,31,.04)}.q-lab-strategy-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:9px}.q-lab-strategy-head h3{margin:2px 0 4px;color:#034c1f;font-size:15px}.q-lab-strategy-head p{margin:0;color:#646464;font-size:10px}.q-lab-strategy-badge{white-space:nowrap;background:#eaf3f7;color:#024c6a;border-radius:6px;padding:5px 7px;font-size:9px;font-weight:700}.q-lab-strategy-body{font-size:11px;line-height:1.6;color:#4f5552}.q-lab-strategy-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.q-lab-strategy-card{padding:10px;border:1px solid #e2e9e3;border-radius:8px;background:#fff}.q-lab-strategy-card strong{display:block;color:#034c1f;font-size:10px;margin-bottom:4px}.q-lab-strategy-card p{margin:0;color:#646464;font-size:9.5px;line-height:1.5}.q-lab-category-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.q-lab-category-row span{padding:4px 6px;border-radius:5px;background:#f1f5ef;color:#35792a;font-size:9px;font-weight:700}
      .q-verified-modal{position:fixed;inset:0;z-index:2200;display:grid;place-items:center;padding:18px;background:rgba(3,40,21,.46)}.q-verified-dialog{width:min(720px,100%);max-height:min(760px,92vh);overflow:auto;background:#fff;border-radius:12px;box-shadow:0 26px 75px rgba(0,0,0,.25)}.q-verified-header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:16px 18px;border-bottom:1px solid #e2e9e3}.q-verified-header h3{margin:3px 0 0;color:#034c1f;font-size:16px}.q-close{width:32px;height:32px;border:0;border-radius:7px;background:#eef5ea;color:#034c1f;font-size:19px}.q-verified-body{padding:16px 18px;color:#4f5552;font-size:11px;line-height:1.65}.q-verified-body p{margin:0 0 10px}.q-verified-meta{margin-top:12px;padding-top:9px;border-top:1px solid #e2e9e3;color:#707772;font-size:9px}.q-evidence-links{margin:8px 0 0;padding-left:18px}.q-evidence-links a{color:#024c6a}
      @media(max-width:760px){.q-lab-strategy-grid{grid-template-columns:1fr}.q-lab-strategy-head{display:block}.q-lab-strategy-badge{display:inline-block;margin-top:7px}}
    `;
    document.head.appendChild(style);
  }

  async function fetchJsonPair([local, remote]) {
    const cache = Date.now();
    try {
      const response = await fetch(`${local}?v=${cache}`, {cache:'no-store'});
      if (!response.ok) throw new Error(`Local ${response.status}`);
      return await response.json();
    } catch (_) {
      const response = await fetch(`${remote}?v=${cache}`, {cache:'no-store'});
      if (!response.ok) throw new Error(`Remote ${response.status}`);
      return response.json();
    }
  }

  function indexItems() {
    state.itemByUrl.clear();
    state.itemByTitle.clear();
    for (const item of state.news?.items || []) {
      [item.url,item.source_url,...(item.sources || []).map(source => source?.url)].filter(Boolean).forEach(url => state.itemByUrl.set(url,item));
      const title = String(item.title || '').trim().toLowerCase();
      if (title) state.itemByTitle.set(title,item);
    }
  }

  function findItem(card) {
    for (const link of card.querySelectorAll('a[href]')) {
      if (state.itemByUrl.has(link.href)) return state.itemByUrl.get(link.href);
    }
    const heading = card.querySelector('h3,h4,strong');
    const title = text(heading).toLowerCase();
    if (state.itemByTitle.has(title)) return state.itemByTitle.get(title);
    return [...state.itemByTitle.entries()].find(([candidate]) => title && (candidate.includes(title) || title.includes(candidate)))?.[1] || null;
  }

  function categoryFor(card, item) {
    if (item?.category) return item.category;
    const full = text(card).toLowerCase();
    return Object.keys(CATEGORY_ICONS).sort((a,b)=>b.length-a.length).find(category => full.includes(category.toLowerCase())) || 'Other';
  }

  function summaryRecord(item) {
    if (!item) return null;
    const external = state.summaries?.summaries?.[item.id];
    const summary = item.chatgpt_summary || external?.summary;
    if (!summary) return null;
    return {
      summary,
      provider: item.summary_provider || external?.provider || state.summaries?.provider || 'ChatGPT',
      updated_at: item.summary_updated_at || external?.updated_at || state.summaries?.updated_at,
      sources: item.summary_evidence || external?.sources_used || [],
      verification: external?.verification || (item.chatgpt_summary ? 'verified' : 'available')
    };
  }

  function applyIconsAndSummaryChips() {
    document.querySelectorAll('.live-news-card,.si-news-card').forEach(card => {
      const item = findItem(card);
      if (card.dataset.questIconApplied !== '1') {
        const category = categoryFor(card,item);
        const icon = document.createElement('img');
        icon.className = 'q-category-icon';
        icon.alt = `${category} icon`;
        icon.src = CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;
        icon.loading = 'lazy';
        icon.addEventListener('error', () => { icon.src = CATEGORY_ICONS.Other; }, {once:true});
        const heading = card.querySelector('h3,h4');
        if (heading) {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:flex-start;gap:10px';
          heading.parentNode.insertBefore(row,heading);
          row.appendChild(icon);
          row.appendChild(heading);
        } else card.prepend(icon);
        card.dataset.questIconApplied = '1';
      }
      const record = summaryRecord(item);
      if (record && !card.querySelector('.q-chatgpt-chip')) {
        const chips = card.querySelector('.live-chips,.si-meta,.si-chips');
        if (chips) {
          const chip = document.createElement('span');
          chip.className = 'live-chip q-chatgpt-chip';
          chip.textContent = 'ChatGPT verified';
          chips.appendChild(chip);
        }
      }
    });
  }

  function closeModal() { document.querySelector('.q-verified-modal')?.remove(); }

  function showModal(title, body, meta = '') {
    closeModal();
    const modal = document.createElement('div');
    modal.className = 'q-verified-modal';
    modal.innerHTML = `<article class="q-verified-dialog"><header class="q-verified-header"><div><span class="section-kicker">VERIFIED INTELLIGENCE BRIEF</span><h3>${esc(title)}</h3></div><button class="q-close" type="button" aria-label="Close">×</button></header><div class="q-verified-body">${body}<div class="q-verified-meta">${esc(meta)}</div></div></article>`;
    modal.addEventListener('click', event => { if (event.target === modal || event.target.closest('.q-close')) closeModal(); });
    document.body.appendChild(modal);
  }

  function showPrecomputedSummary(item, record) {
    const paragraphs = esc(record.summary).split(/\n{2,}/).map(paragraph => `<p>${paragraph.replace(/\n/g,'<br>')}</p>`).join('');
    const evidence = (record.sources || []).length
      ? `<strong>Evidence used</strong><ul class="q-evidence-links">${record.sources.map(url => `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a></li>`).join('')}</ul>`
      : '';
    const when = record.updated_at ? new Date(record.updated_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}) : 'latest source refresh';
    showModal(item.title || 'Article summary', paragraphs + evidence, `${record.provider} · ${record.verification} · Updated ${when}`);
  }

  async function requestWorkerSummary(item, button) {
    const previous = button.textContent;
    button.disabled = true;
    button.textContent = 'Verifying…';
    showModal(item.title || 'Article summary','<p>Reading the underlying public evidence and verifying material details…</p>','On-demand fallback while the scheduled ChatGPT summary is unavailable.');
    try {
      const response = await fetch(WORKER,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'email_article_summary',article_ids:[item.id]})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      if (!data.content_verified || !data.answer || data.answer === 'CONTENT_UNAVAILABLE') {
        showModal(item.title || 'Article summary','<p>The underlying article could not be verified with enough substantive detail. No generic interpretation was inserted.</p>',data.error || 'Content unavailable');
      } else {
        const paragraphs = esc(data.answer).split(/\n{2,}/).map(paragraph => `<p>${paragraph.replace(/\n/g,'<br>')}</p>`).join('');
        showModal(item.title || 'Article summary',paragraphs,`Verified on demand · ${data.model || 'fallback model'} · ${data.tool_profile || 'web tools'}`);
      }
    } catch (error) {
      showModal(item.title || 'Article summary','<p>The on-demand verification layer is temporarily unavailable. The original article remains accessible from the news card.</p>',error.message);
    } finally {
      button.disabled = false;
      button.textContent = previous;
    }
  }

  function addBriefButtons() {
    document.querySelectorAll('.live-news-card').forEach(card => {
      const item = findItem(card);
      if (!item || card.querySelector('.q-verified-button')) return;
      const record = summaryRecord(item);
      const footer = card.querySelector('.live-card-footer') || card;
      const button = document.createElement('button');
      button.className = 'q-verified-button';
      button.type = 'button';
      button.textContent = record ? 'ChatGPT brief' : 'Verified brief';
      button.addEventListener('click', event => {
        event.preventDefault();
        if (record) showPrecomputedSummary(item,record);
        else requestWorkerSummary(item,button);
      });
      footer.appendChild(button);
    });
  }

  function statusInfo() {
    const workflow = state.workflow || {};
    const news = state.news || {};
    const email = state.email || {};
    const summaryCount = Object.keys(state.summaries?.summaries || {}).length || (news.items || []).filter(item => item.chatgpt_summary).length;
    return {
      generated: news.generated_at_display || workflow.last_run_display || 'not available',
      next: workflow.next_update_display || 'scheduled every 6 hours',
      itemCount: news.item_count ?? news.items?.length ?? 0,
      queue: workflow.chatgpt_queue_count ?? 0,
      remaining: workflow.chatgpt_remaining_unsummarized,
      summaryCount,
      emailStatus: email.status || workflow.email_status || 'not available'
    };
  }

  function updateNativeStatus() {
    const info = statusInfo();
    const updated = byId('liveUpdated');
    if (updated) updated.textContent = `Last updated: ${info.generated}`;
    const email = byId('liveEmailStatus');
    if (email) email.textContent = `Email workflow: ${info.emailStatus}`;
    document.querySelectorAll('.live-status-pill').forEach(pill => {
      if (/^AI:/i.test(text(pill))) pill.textContent = `AI: ${info.summaryCount} ChatGPT-verified briefs · Gemini fallback`;
      if (/Automated refresh/i.test(text(pill))) pill.textContent = `↻ Next source refresh: ${info.next}`;
    });
  }

  function addSyncStrip(view) {
    if (!view || view.querySelector('.q-sync-strip')) return;
    const info = statusInfo();
    const heading = view.querySelector('.page-heading');
    const remaining = Number.isFinite(Number(info.remaining)) ? `${info.remaining} awaiting summary` : 'queue monitored';
    const strip = document.createElement('div');
    strip.className = 'q-sync-strip';
    strip.innerHTML = `<span class="q-sync-dot"></span><strong>Laboratory-news-monitor synced</strong><span>${esc(info.itemCount)} curated items · ${esc(info.generated)}</span><span>${esc(info.summaryCount)} ChatGPT verified briefs · ${esc(remaining)}</span><span>Next source refresh: ${esc(info.next)}</span><span>Email: ${esc(info.emailStatus)}</span>`;
    if (heading) heading.insertAdjacentElement('afterend',strip); else view.prepend(strip);
  }

  function addStrategicSynthesis(view) {
    if (!view || view.querySelector('.q-lab-strategy') || !state.strategic?.synthesis) return;
    const sync = view.querySelector('.q-sync-strip');
    const companies = state.strategic.companies || {};
    const preferred = ['Quest Diagnostics','Labcorp'];
    const companyCards = preferred.filter(name => companies[name]).map(name => `<article class="q-lab-strategy-card"><strong>${esc(name)}</strong><p>${esc(companies[name])}</p></article>`).join('');
    const categories = Object.keys(state.strategic.categories || {}).slice(0,6).map(category => `<span>${esc(category)}</span>`).join('');
    const panel = document.createElement('section');
    panel.className = 'q-lab-strategy';
    panel.innerHTML = `<div class="q-lab-strategy-head"><div><span class="section-kicker">LATEST VERIFIED STRATEGIC SYNTHESIS</span><h3>What the newest signals mean competitively</h3><p>${esc(state.strategic.scope || 'Recent substantive competitor developments')}</p></div><span class="q-lab-strategy-badge">${esc(state.strategic.provider || 'ChatGPT')} · ${esc(state.strategic.updated_at_display || 'current')}</span></div><div class="q-lab-strategy-body">${esc(state.strategic.synthesis)}</div>${companyCards ? `<div class="q-lab-strategy-grid">${companyCards}</div>` : ''}${categories ? `<div class="q-lab-category-row">${categories}</div>` : ''}`;
    if (sync) sync.insertAdjacentElement('afterend',panel); else view.prepend(panel);
  }

  function enhance() {
    injectStyles();
    const alerts = document.querySelector('.view[data-view="alerts"]');
    if (!alerts) return;
    applyIconsAndSummaryChips();
    addBriefButtons();
    alerts.querySelectorAll('.q-sync-strip,.q-lab-strategy').forEach(node => node.remove());
    addSyncStrip(alerts);
    addStrategicSynthesis(alerts);
    updateNativeStatus();
    document.documentElement.dataset.labNewsSyncRelease = RELEASE;
  }

  async function load() {
    if (state.loading) return;
    state.loading = true;
    const results = await Promise.allSettled([
      fetchJsonPair(SOURCES.news),
      fetchJsonPair(SOURCES.email),
      fetchJsonPair(SOURCES.workflow),
      fetchJsonPair(SOURCES.strategic),
      fetchJsonPair(SOURCES.summaries),
    ]);
    if (results[0].status === 'fulfilled') state.news = results[0].value;
    if (results[1].status === 'fulfilled') state.email = results[1].value;
    if (results[2].status === 'fulfilled') state.workflow = results[2].value;
    if (results[3].status === 'fulfilled') state.strategic = results[3].value;
    if (results[4].status === 'fulfilled') state.summaries = results[4].value;
    indexItems();
    state.loading = false;
    enhance();
    setTimeout(enhance,350);
    setTimeout(enhance,1100);
  }

  function boot() {
    load();
    window.addEventListener('quest:module-loaded', () => setTimeout(enhance,120));
    window.addEventListener('quest:layout-refresh', () => setTimeout(enhance,120));
    document.addEventListener('click', event => {
      if (event.target.closest?.('.nav-item,[data-view]')) setTimeout(enhance,150);
    }, {passive:true});
    setInterval(load,6*60*60*1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.QuestLabNewsSync = {release:RELEASE,reload:load,state};
})();
