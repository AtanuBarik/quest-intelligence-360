(() => {
  'use strict';

  const RELEASE = '20260810j';
  const DATA_URL = `data/social-perception-events.json?v=${RELEASE}`;
  const COLORS = ['#35792a','#034c1f','#c6d52f','#00587c','#c78800','#80276c','#6f8175','#5e8f43'];
  const PLATFORM_COLORS = {LinkedIn:'#35792a',YouTube:'#c78800',X:'#00587c',Facebook:'#6a8d3b',Instagram:'#80276c'};
  const STATE = {company:'All',theme:'All',platform:'All',source:'Public evidence',sentiment:'All'};
  let DATA = null;
  let mounting = false;

  const esc = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const unique = values => [...new Set(values.filter(Boolean))].sort((a,b) => a.localeCompare(b));
  const countBy = (rows,key) => rows.reduce((acc,row) => { const k=row[key]||'Other'; acc[k]=(acc[k]||0)+1; return acc; },{});
  const pct = (part,total) => total ? Math.round(part*100/total) : 0;

  function injectStyles(){
    let style=document.getElementById('socialPerceptionInteractiveV3Styles');
    if(!style){ style=document.createElement('style'); style.id='socialPerceptionInteractiveV3Styles'; document.head.appendChild(style); }
    style.textContent=`
      .view[data-view="social"] .sp2-toolbar,.view[data-view="social"] .sp2-grid,.view[data-view="social"] #spLegacyVisuals{display:none!important}
      .spi3{--dark:#034c1f;--green:#35792a;--lime:#c6d52f;--blue:#00587c;--gold:#c78800;--muted:#607168;--line:#dce6de;color:#26342b;margin-top:12px}
      .spi3 *{box-sizing:border-box}.spi3 a{color:#00587c;text-decoration:none}.spi3 a:hover{text-decoration:underline}
      .spi3-filterbar{display:grid;grid-template-columns:repeat(5,minmax(150px,1fr)) auto;gap:10px;align-items:end;padding:14px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,#fff,#f7faf6);box-shadow:0 5px 18px rgba(3,76,31,.04);margin-bottom:12px}
      .spi3-filter label{display:block;font-size:12px;font-weight:800;color:var(--dark);margin-bottom:5px}.spi3-filter select{width:100%;height:42px;border:1px solid #cfdccf;border-radius:9px;background:#fff;padding:0 10px;font-size:13px;color:#27342c}.spi3-reset{height:42px;border:1px solid #b7cbb8;background:#fff;color:var(--dark);border-radius:9px;padding:0 14px;font-size:13px;font-weight:800;cursor:pointer}.spi3-reset:hover{background:#edf5e9}
      .spi3-filter-note{grid-column:1/-1;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);padding-top:2px}.spi3-filter-note i{width:8px;height:8px;border-radius:50%;background:var(--lime);display:inline-block}.spi3-filter-note b{color:var(--dark)}
      .spi3-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}.spi3-kpi{background:#fff;border:1px solid var(--line);border-radius:13px;padding:13px;display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:center;min-height:82px}.spi3-kpi-icon{width:38px;height:38px;border-radius:11px;background:#edf5e9;color:var(--dark);display:grid;place-items:center;font-size:18px}.spi3-kpi strong{display:block;font-size:20px;color:var(--dark);line-height:1.1}.spi3-kpi span{display:block;font-size:12px;color:var(--muted);margin-top:3px;line-height:1.35}
      .spi3-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}.spi3-panel{background:#fff;border:1px solid var(--line);border-radius:14px;padding:15px;min-width:0;box-shadow:0 5px 18px rgba(3,76,31,.035)}.spi3-7{grid-column:span 7}.spi3-5{grid-column:span 5}.spi3-6{grid-column:span 6}.spi3-12{grid-column:span 12}.spi3-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.spi3-kicker{font:800 10px Arial;letter-spacing:1.15px;color:var(--green)}.spi3-head h3{font-size:18px!important;margin:3px 0 3px!important;color:var(--dark)!important}.spi3-head p{font-size:12px!important;line-height:1.45!important;color:var(--muted)!important;margin:0!important}.spi3-chip{display:inline-flex;padding:5px 8px;border-radius:999px;background:#eef5e9;color:var(--green);font-size:11px;font-weight:800;white-space:nowrap}.spi3-chip.demo{background:#fff4dd;color:#8a5d00}
      .spi3-bars{display:grid;gap:10px}.spi3-bar{display:grid;grid-template-columns:190px 1fr 38px;gap:10px;align-items:center}.spi3-bar-label{display:flex;gap:8px;align-items:center;min-width:0}.spi3-mark{width:30px;height:30px;border-radius:9px;background:#edf5e9;color:var(--dark);display:grid;place-items:center;font-size:10px;font-weight:900;flex:0 0 30px}.spi3-bar-label b{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.spi3-track{height:14px;border-radius:999px;background:#edf1ed;overflow:hidden}.spi3-track i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--green),var(--lime));min-width:3px}.spi3-bar-value{font-size:13px;font-weight:900;color:var(--dark);text-align:right}
      .spi3-donut-wrap{display:grid;grid-template-columns:178px 1fr;gap:16px;align-items:center;min-height:205px}.spi3-donut-box{width:170px;height:170px;position:relative}.spi3-donut{position:absolute;inset:0;border-radius:50%;background:conic-gradient(#dfe8df 0 100%)}.spi3-donut:after{content:'';position:absolute;inset:38px;border-radius:50%;background:#fff}.spi3-donut-center{position:absolute;inset:0;display:grid;place-items:center;text-align:center;z-index:2;color:var(--dark);font-size:24px;font-weight:900}.spi3-donut-center span{display:block;font-size:11px;color:var(--muted);font-weight:700;margin-top:-44px}.spi3-legend{display:grid;gap:8px}.spi3-legend-row{display:grid;grid-template-columns:10px 1fr auto;gap:8px;align-items:center;font-size:12px;color:#415047}.spi3-legend-row i{width:10px;height:10px;border-radius:50%}.spi3-legend-row b{color:var(--dark)}
      .spi3-theme-bars{display:grid;gap:9px}.spi3-theme-row{display:grid;grid-template-columns:minmax(180px,230px) 1fr 36px;gap:10px;align-items:center}.spi3-theme-row span{font-size:12px;font-weight:700;color:#36473c}.spi3-theme-row .spi3-track i{background:linear-gradient(90deg,var(--blue),#62a2ba)}
      .spi3-sentiment{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.spi3-sent{border:1px solid #e3ebe4;border-radius:12px;padding:12px;text-align:center;background:#fbfdfb}.spi3-sent i{width:12px;height:12px;border-radius:50%;display:inline-block;margin-right:5px}.spi3-sent strong{display:block;font-size:22px;color:var(--dark);margin:5px 0 2px}.spi3-sent span{font-size:12px;color:var(--muted)}
      .spi3-matrix-wrap{overflow:auto;border:1px solid var(--line);border-radius:11px}.spi3-matrix{width:100%;min-width:980px;border-collapse:collapse}.spi3-matrix th,.spi3-matrix td{padding:10px;border-bottom:1px solid #e8ede8;text-align:center;font-size:12px}.spi3-matrix thead th{position:sticky;top:0;background:var(--dark);color:#fff;z-index:2}.spi3-matrix th:first-child,.spi3-matrix td:first-child{text-align:left;position:sticky;left:0;background:#fff;z-index:1;font-weight:800;color:var(--dark)}.spi3-matrix thead th:first-child{background:var(--dark);z-index:3}.spi3-heat{display:inline-grid;place-items:center;width:34px;height:30px;border-radius:8px;font-weight:900;color:#29452f}.spi3-heat.h0{background:#f0f3f0;color:#8b978f}.spi3-heat.h1{background:#edf5e9}.spi3-heat.h2{background:#dcebcf}.spi3-heat.h3{background:#c6d52f;color:#29420d}.spi3-heat.h4{background:#4c8a3f;color:#fff}
      .spi3-source-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.spi3-source{border:1px solid #e0e8e1;border-radius:12px;padding:12px;background:#fbfdfb;min-width:0}.spi3-source-top{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:7px}.spi3-source h4{font-size:14px;margin:0 0 6px;color:var(--dark);line-height:1.35}.spi3-source p{font-size:12px;line-height:1.45;color:#536158;margin:0 0 9px}.spi3-source a{font-size:12px;font-weight:900}.spi3-noresults{padding:30px;text-align:center;color:var(--muted);font-size:13px;border:1px dashed #ccd8cd;border-radius:12px;background:#fbfdfb}.spi3-noresults b{display:block;color:var(--dark);font-size:16px;margin-bottom:5px}
      @media(max-width:1250px){.spi3-filterbar{grid-template-columns:repeat(3,1fr)}.spi3-7,.spi3-5,.spi3-6{grid-column:span 12}.spi3-source-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:760px){.spi3-filterbar,.spi3-kpis,.spi3-source-grid{grid-template-columns:1fr}.spi3-donut-wrap{grid-template-columns:1fr}.spi3-bar,.spi3-theme-row{grid-template-columns:1fr}.spi3-bar-value{text-align:left}.spi3-sentiment{grid-template-columns:1fr}}
    `;
  }

  function option(value,label=value){ return `<option value="${esc(value)}">${esc(label)}</option>`; }
  function filterRows(){
    return (DATA?.records || []).filter(row =>
      (STATE.company==='All'||row.company===STATE.company) &&
      (STATE.theme==='All'||row.theme===STATE.theme) &&
      (STATE.platform==='All'||row.platform===STATE.platform) &&
      (STATE.source==='All'||row.source_type===STATE.source) &&
      (STATE.sentiment==='All'||row.sentiment===STATE.sentiment)
    );
  }

  function filterBar(){
    const rows=DATA.records||[];
    const selects=[
      ['company','Company name',['All',...unique(rows.map(r=>r.company))]],
      ['theme','Theme type',['All',...unique(rows.map(r=>r.theme))]],
      ['platform','Social media platform',['All','LinkedIn','YouTube','X','Facebook','Instagram']],
      ['source','Data status',['Public evidence','All','Demo baseline']],
      ['sentiment','Tone',['All','Positive','Neutral','Negative']]
    ];
    return `<section class="spi3-filterbar">${selects.map(([key,label,values])=>`<div class="spi3-filter"><label for="spi3-${key}">${label}</label><select id="spi3-${key}" data-filter="${key}">${values.map(v=>option(v,v==='All'?'All':v)).join('')}</select></div>`).join('')}<button class="spi3-reset" id="spi3Reset">Reset</button><div class="spi3-filter-note"><i></i><span><b>Public evidence</b> uses accessible open-web company/social pages. <b>Demo baseline</b> is synthetic and exists only for unavailable-platform prototyping.</span></div></section>`;
  }

  function kpis(rows){
    const publicCount=rows.filter(r=>r.source_type==='Public evidence').length;
    const linked=rows.filter(r=>r.accessible&&r.url).length;
    const themes=unique(rows.map(r=>r.theme)).length;
    const companies=unique(rows.map(r=>r.company)).length;
    return `<div class="spi3-kpis">
      <div class="spi3-kpi"><div class="spi3-kpi-icon">◉</div><div><strong>${rows.length}</strong><span>Filtered social signals</span></div></div>
      <div class="spi3-kpi"><div class="spi3-kpi-icon">↗</div><div><strong>${linked}</strong><span>Accessible source links</span></div></div>
      <div class="spi3-kpi"><div class="spi3-kpi-icon">◇</div><div><strong>${themes}</strong><span>Themes represented</span></div></div>
      <div class="spi3-kpi"><div class="spi3-kpi-icon">✓</div><div><strong>${pct(publicCount,rows.length)}%</strong><span>Public-evidence share</span></div></div>
    </div>`;
  }

  function companyBars(rows){
    const counts=countBy(rows,'company'); const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]); const max=Math.max(1,...entries.map(x=>x[1]));
    if(!entries.length) return noResults('No company signals match these filters.');
    return `<div class="spi3-bars">${entries.map(([name,count],i)=>`<div class="spi3-bar"><div class="spi3-bar-label"><span class="spi3-mark">${esc(name.split(/\s+/).map(x=>x[0]).join('').slice(0,2))}</span><b>${esc(name)}</b></div><div class="spi3-track"><i style="width:${Math.max(4,count*100/max)}%;background:${COLORS[i%COLORS.length]}"></i></div><div class="spi3-bar-value">${count}</div></div>`).join('')}</div>`;
  }

  function donut(rows,key,colorMap){
    const counts=countBy(rows,key); const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]); const total=rows.length;
    if(!entries.length) return noResults('No mix is available for this filter combination.');
    let cursor=0; const stops=[];
    entries.forEach(([name,count],i)=>{ const start=cursor; cursor+=count*100/total; stops.push(`${colorMap?.[name]||COLORS[i%COLORS.length]} ${start}% ${cursor}%`); });
    return `<div class="spi3-donut-wrap"><div class="spi3-donut-box"><div class="spi3-donut" style="background:conic-gradient(${stops.join(',')})"></div><div class="spi3-donut-center">${total}<span>signals</span></div></div><div class="spi3-legend">${entries.map(([name,count],i)=>`<div class="spi3-legend-row"><i style="background:${colorMap?.[name]||COLORS[i%COLORS.length]}"></i><span>${esc(name)}</span><b>${count}</b></div>`).join('')}</div></div>`;
  }

  function themeBars(rows){
    const counts=countBy(rows,'theme'); const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]); const max=Math.max(1,...entries.map(x=>x[1]));
    if(!entries.length) return noResults('No themes match these filters.');
    return `<div class="spi3-theme-bars">${entries.map(([name,count])=>`<div class="spi3-theme-row"><span>${esc(name)}</span><div class="spi3-track"><i style="width:${Math.max(4,count*100/max)}%"></i></div><b class="spi3-bar-value">${count}</b></div>`).join('')}</div>`;
  }

  function sentiment(rows){
    const counts=countBy(rows,'sentiment'); const defs=[['Positive','#35792a'],['Neutral','#9aa7a0'],['Negative','#c78800']];
    return `<div class="spi3-sentiment">${defs.map(([name,color])=>`<div class="spi3-sent"><span><i style="background:${color}"></i>${name}</span><strong>${counts[name]||0}</strong><span>${pct(counts[name]||0,rows.length)}% of filtered signals</span></div>`).join('')}</div>`;
  }

  function matrix(rows){
    const companies=unique(rows.map(r=>r.company)); const themes=unique(rows.map(r=>r.theme));
    if(!companies.length||!themes.length) return noResults('No company/theme intersections match these filters.');
    const body=companies.map(company=>`<tr><td>${esc(company)}</td>${themes.map(theme=>{const n=rows.filter(r=>r.company===company&&r.theme===theme).length; const cls=n===0?'h0':n===1?'h1':n===2?'h2':n===3?'h3':'h4'; return `<td><span class="spi3-heat ${cls}">${n}</span></td>`;}).join('')}</tr>`).join('');
    return `<div class="spi3-matrix-wrap"><table class="spi3-matrix"><thead><tr><th>Company</th>${themes.map(t=>`<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function sources(rows){
    const ordered=[...rows].sort((a,b)=>Number(b.accessible)-Number(a.accessible)).slice(0,9);
    if(!ordered.length) return noResults('No source cards match these filters.');
    return `<div class="spi3-source-grid">${ordered.map(row=>`<article class="spi3-source"><div class="spi3-source-top"><span class="spi3-chip">${esc(row.company)}</span><span class="spi3-chip">${esc(row.platform)}</span><span class="spi3-chip ${row.source_type==='Demo baseline'?'demo':''}">${esc(row.source_type)}</span></div><h4>${esc(row.title)}</h4><p>${esc(row.summary)}</p>${row.accessible&&row.url?`<a href="${esc(row.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>`:`<span class="spi3-chip demo">No live URL — demo only</span>`}</article>`).join('')}</div>`;
  }

  function noResults(message){ return `<div class="spi3-noresults"><b>No matching signals</b>${esc(message)}</div>`; }

  function dashboard(rows){
    return `${kpis(rows)}<div class="spi3-grid">
      <article class="spi3-panel spi3-7"><div class="spi3-head"><div><span class="spi3-kicker">COMPETITIVE ACTIVITY</span><h3>Signal volume by company</h3><p>Count of records in the currently selected evidence slice.</p></div><span class="spi3-chip">${rows.length} signals</span></div>${companyBars(rows)}</article>
      <article class="spi3-panel spi3-5"><div class="spi3-head"><div><span class="spi3-kicker">CHANNEL MIX</span><h3>Platform distribution</h3><p>Filtered mix of LinkedIn, YouTube and prototype-only unavailable channels.</p></div></div>${donut(rows,'platform',PLATFORM_COLORS)}</article>
      <article class="spi3-panel spi3-7"><div class="spi3-head"><div><span class="spi3-kicker">NARRATIVE TERRITORIES</span><h3>Theme concentration</h3><p>Which narratives dominate the current filter selection.</p></div></div>${themeBars(rows)}</article>
      <article class="spi3-panel spi3-5"><div class="spi3-head"><div><span class="spi3-kicker">PERCEPTION</span><h3>Tone of observed signals</h3><p>Directional editorial tone assigned to the working records.</p></div></div>${sentiment(rows)}</article>
      <article class="spi3-panel spi3-12"><div class="spi3-head"><div><span class="spi3-kicker">COMPETITIVE SIGNAL MAP</span><h3>Company × theme heatmap</h3><p>Darker cells indicate more records in the selected evidence slice.</p></div></div>${matrix(rows)}</article>
      <article class="spi3-panel spi3-12"><div class="spi3-head"><div><span class="spi3-kicker">SOURCE TRAIL</span><h3>Top filtered social signals</h3><p>Accessible public items link to their source. Demo records are clearly marked and never linked.</p></div></div>${sources(rows)}</article>
    </div>`;
  }

  function render(){
    const root=document.getElementById('spInteractiveV3'); if(!root||!DATA) return;
    root.querySelector('#spi3Dashboard').innerHTML=dashboard(filterRows());
    Object.keys(STATE).forEach(key=>{const sel=root.querySelector(`[data-filter="${key}"]`); if(sel) sel.value=STATE[key];});
  }

  function bind(root){
    root.querySelectorAll('[data-filter]').forEach(select=>select.addEventListener('change',()=>{STATE[select.dataset.filter]=select.value; render();}));
    root.querySelector('#spi3Reset')?.addEventListener('click',()=>{Object.assign(STATE,{company:'All',theme:'All',platform:'All',source:'Public evidence',sentiment:'All'}); render();});
  }

  function mount(){
    if(mounting||!DATA) return;
    const view=document.querySelector('.view[data-view="social"]'); if(!view) return;
    const anchor=view.querySelector('.sp2-platform-grid')||view.querySelector('.sp2-kpis'); if(!anchor) return;
    if(view.querySelector('#spInteractiveV3')) return render();
    mounting=true;
    try{
      view.querySelector('#spLegacyVisuals')?.remove();
      anchor.insertAdjacentHTML('afterend',`<section id="spInteractiveV3" class="spi3">${filterBar()}<div id="spi3Dashboard"></div></section>`);
      const root=view.querySelector('#spInteractiveV3'); bind(root); render();
    } finally {mounting=false;}
  }

  async function boot(){
    injectStyles();
    try{const response=await fetch(DATA_URL,{cache:'no-store'}); if(!response.ok) throw new Error(`Social events returned ${response.status}`); DATA=await response.json();}
    catch(error){console.error('Unable to load filterable Social Perception data:',error); return;}
    [0,180,450,900,1500].forEach(delay=>setTimeout(mount,delay));
    document.addEventListener('click',event=>{const target=event.target.closest('[data-view-target="social"],.nav-item[data-view="social"]'); if(target) setTimeout(mount,140);},true);
    window.addEventListener('quest:module-loaded',()=>setTimeout(mount,100));
    window.addEventListener('quest:layout-refresh',()=>setTimeout(mount,100));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
