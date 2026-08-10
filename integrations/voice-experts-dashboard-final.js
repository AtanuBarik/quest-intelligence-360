(() => {
  'use strict';

  const RELEASE = '20260810o';
  const DATA_URL = `data/voice-experts-analysis.json?v=${RELEASE}`;
  const TRACKER_URL = `data/project-tracker.json?v=${RELEASE}`;
  const state = { search:'', project:'All', persona:'All', orgType:'All', archetype:'All', level:'All', research:'All', theme:'All', evidence:'All', stance:'All' };
  let DATA = null;
  let TRACKER = null;
  let booted = false;

  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = (v='') => String(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const uniq = values => [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
  const avg = values => values.length ? Math.round(values.reduce((a,b)=>a+Number(b||0),0)/values.length) : 0;
  const clamp = (v,min=0,max=100) => Math.max(min,Math.min(max,Number(v||0)));
  const short = value => String(value||'').replace('Health-System','HS').replace('Large Physician Group','LPG');

  function injectStyles(){
    let s=document.getElementById('voeFinalStyles');
    if(!s){s=document.createElement('style');s.id='voeFinalStyles';document.head.appendChild(s);}
    s.textContent=`
      .voef{--q:#034c1f;--g:#35792a;--lime:#c6d52f;--blue:#00587c;--gold:#c78800;--purple:#80276c;--red:#b52f45;--ink:#26342b;--muted:#607168;--line:#dce6de;--soft:#f7faf6;color:var(--ink)}.voef *{box-sizing:border-box}.voef .page-heading{margin-bottom:12px}.voef .page-heading h1{font-size:30px!important;line-height:1.15!important}.voef .page-heading p{font-size:14px!important;line-height:1.55!important;max-width:1100px}.voef .section-kicker{font-size:12px!important}
      .voe-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.voe-pill{display:inline-flex;align-items:center;gap:5px;padding:6px 9px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:11.5px;color:var(--muted)}.voe-pill b{color:var(--q)}
      .voe-filter{display:grid;grid-template-columns:minmax(230px,1.45fr) repeat(8,minmax(132px,1fr)) auto;gap:8px;align-items:end;padding:14px;margin-bottom:12px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,#fff,#f8fbf7);box-shadow:0 5px 18px rgba(3,76,31,.04)}.voe-field label{display:block;margin:0 0 5px;font-size:12px;font-weight:800;color:var(--q)}.voe-field input,.voe-field select{width:100%;height:42px;border:1px solid #cad7cb;border-radius:9px;background:#fff;padding:0 10px;font-size:13px;color:var(--ink)}.voe-reset,.voe-export{height:42px;border:1px solid #afc3b0;border-radius:9px;background:#fff;color:var(--q);padding:0 13px;font-size:13px;font-weight:800;cursor:pointer}.voe-export{background:var(--q);color:#fff;border-color:var(--q)}
      .voe-lens{margin-bottom:12px;padding:11px 13px;border:1px solid #dbe6d9;border-left:4px solid var(--lime);border-radius:10px;background:linear-gradient(90deg,#f7fbf4,#fff);font-size:12.5px;line-height:1.5;color:#526158}.voe-lens b{color:var(--q)}
      .voe-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:12px}.voe-kpi{display:grid;grid-template-columns:42px 1fr;gap:10px;align-items:center;min-height:92px;padding:13px;border:1px solid var(--line);border-radius:13px;background:#fff;box-shadow:0 5px 18px rgba(3,76,31,.035)}.voe-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#edf5e9;color:var(--q);font-size:18px;font-weight:900}.voe-kpi strong{display:block;font-size:23px;line-height:1;color:var(--q)}.voe-kpi span{display:block;margin-top:5px;font-size:12px;line-height:1.35;color:var(--muted)}
      .voe-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}.voe-12{grid-column:span 12}.voe-8{grid-column:span 8}.voe-7{grid-column:span 7}.voe-6{grid-column:span 6}.voe-5{grid-column:span 5}.voe-4{grid-column:span 4}.voe-panel{min-width:0;padding:15px;border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:0 5px 18px rgba(3,76,31,.035)}.voe-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.voe-kicker{display:block;font-size:11px;font-weight:900;letter-spacing:1px;color:var(--g)}.voe-head h3{margin:4px 0!important;font-size:18px!important;line-height:1.3!important;color:var(--q)!important}.voe-head p{margin:0!important;font-size:12.5px!important;line-height:1.45!important;color:var(--muted)!important}
      .voe-summary{display:grid;grid-template-columns:52px 1fr;gap:12px;align-items:flex-start;padding:15px;border:1px solid #d8e5d8;border-radius:13px;background:linear-gradient(135deg,#f4f9ef,#fff)}.voe-summary-icon{display:grid;place-items:center;width:52px;height:52px;border-radius:14px;background:var(--q);color:#fff;font-size:21px;font-weight:900}.voe-summary h4{margin:0 0 6px!important;font-size:16px!important;color:var(--q)!important}.voe-summary p{margin:0!important;font-size:13px!important;line-height:1.55!important;color:#4f5e55!important}.voe-gauges{grid-column:1/-1;display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:3px}.voe-gauge{padding:9px;border:1px solid #e0e8e1;border-radius:10px;background:#fff}.voe-gauge span{display:flex;justify-content:space-between;gap:8px;font-size:10.5px;color:var(--muted)}.voe-gauge b{color:var(--q)}.voe-gauge i{display:block;height:7px;margin-top:6px;border-radius:999px;background:#edf1ed;overflow:hidden}.voe-gauge i em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--g),var(--lime))}
      .voe-bars{display:grid;gap:11px}.voe-bar{display:grid;grid-template-columns:minmax(190px,260px) 1fr 48px;gap:10px;align-items:center}.voe-bar-label{display:flex;gap:8px;align-items:center;min-width:0}.voe-bar-mark{display:grid;place-items:center;width:32px;height:32px;flex:0 0 32px;border-radius:9px;background:#edf5e9;color:var(--q);font-size:9px;font-weight:900}.voe-bar-label b{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.voe-track{height:14px;border-radius:999px;background:#edf1ed;overflow:hidden}.voe-track i{display:block;height:100%;min-width:4px;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--g),var(--lime))}.voe-bar-val{text-align:right;font-size:13px;font-weight:900;color:var(--q)}
      .voe-donutwrap{display:grid;grid-template-columns:180px 1fr;gap:17px;align-items:center;min-height:215px}.voe-donutbox{position:relative;width:174px;height:174px}.voe-donut{position:absolute;inset:0;border-radius:50%;background:#edf1ed}.voe-donut:after{content:'';position:absolute;inset:40px;border-radius:50%;background:#fff}.voe-donutcenter{position:absolute;inset:0;z-index:2;display:grid;place-items:center;text-align:center;color:var(--q);font-size:25px;font-weight:900}.voe-donutcenter small{display:block;margin-top:-47px;font-size:10.5px;color:var(--muted);font-weight:700}.voe-legend{display:grid;gap:8px}.voe-leg{display:grid;grid-template-columns:10px 1fr auto;gap:8px;align-items:center;font-size:11.5px}.voe-leg i{width:10px;height:10px;border-radius:50%}.voe-leg b{color:var(--q)}
      .voe-scatter-wrap{padding:10px 18px 27px 38px}.voe-scatter{position:relative;height:280px;border-left:1px solid #b9c8be;border-bottom:1px solid #b9c8be;background:linear-gradient(90deg,transparent 49.7%,#edf1ed 50%,transparent 50.3%),linear-gradient(0deg,transparent 49.7%,#edf1ed 50%,transparent 50.3%)}.voe-scatter:before{content:'Higher workflow friction';position:absolute;left:-35px;top:4px;writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;color:var(--muted)}.voe-scatter:after{content:'Higher digital readiness →';position:absolute;right:0;bottom:-21px;font-size:10px;color:var(--muted)}.voe-point{position:absolute;display:grid;place-items:center;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:var(--q);color:#fff;font-size:8px;font-weight:900;box-shadow:0 0 0 5px rgba(3,76,31,.08)}.voe-point.mainstay{background:var(--g)}.voe-point.operator{background:var(--blue)}.voe-point.lpg{background:var(--purple)}.voe-point.consumer{background:var(--gold)}
      .voe-feed{display:grid;gap:9px}.voe-insight{display:grid;grid-template-columns:38px 1fr auto;gap:10px;align-items:flex-start;padding:11px;border:1px solid #e0e8e1;border-radius:11px;background:#fbfdfb}.voe-insight-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:#edf5e9;color:var(--q);font-size:15px;font-weight:900}.voe-insight h4{margin:0 0 5px!important;font-size:13.5px!important;line-height:1.35!important;color:var(--q)!important}.voe-insight p{margin:0 0 6px!important;font-size:12px!important;line-height:1.48!important;color:#536158!important}.voe-insight .imp{padding-top:6px;border-top:1px solid #e8ede8;color:#38523a!important}.voe-score{display:grid;gap:5px;text-align:right}.voe-score b{font-size:12px;color:var(--q)}.voe-score small{font-size:9.5px;color:var(--muted)}
      .voe-tags{display:flex;gap:5px;flex-wrap:wrap}.voe-tag{display:inline-flex;padding:4px 7px;border-radius:999px;background:#eef5e9;color:var(--g);font-size:10.5px;font-weight:800}.voe-tag.blue{background:#e8f3f7;color:var(--blue)}.voe-tag.gold{background:#fff3da;color:#8a5b00}.voe-tag.purple{background:#f3eaf3;color:var(--purple)}
      .voe-recgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.voe-rec{position:relative;padding:12px;border:1px solid #dfe7df;border-radius:12px;background:#fbfdfb}.voe-rec-pri{position:absolute;right:10px;top:10px;display:grid;place-items:center;min-width:32px;height:24px;padding:0 7px;border-radius:999px;background:var(--q);color:#fff;font-size:10px;font-weight:900}.voe-rec h4{margin:0 42px 6px 0!important;font-size:13px!important;line-height:1.35!important;color:var(--q)!important}.voe-rec p{margin:0!important;font-size:11.8px!important;line-height:1.45!important;color:#536158!important}.voe-rec footer{margin-top:8px;padding-top:7px;border-top:1px solid #e6ece6;font-size:10.5px;color:var(--muted)}
      .voe-personas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.voe-persona{padding:11px;border:1px solid #e0e8e1;border-radius:11px;background:#fbfdfb}.voe-persona-top{display:grid;grid-template-columns:38px 1fr;gap:9px;align-items:center}.voe-persona-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:var(--q);color:#fff;font-size:10px;font-weight:900}.voe-persona h4{margin:0!important;font-size:13px!important;color:var(--q)!important}.voe-persona small{font-size:10.5px;color:var(--muted)}.voe-persona p{margin:8px 0!important;font-size:11.5px!important;line-height:1.45!important;color:#536158!important}.voe-mini{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.voe-mini span{padding:6px;border-radius:8px;background:#fff;border:1px solid #e5ebe5;text-align:center;font-size:9.5px;color:var(--muted)}.voe-mini b{display:block;font-size:12px;color:var(--q)}
      .voe-heatwrap{overflow:auto;border:1px solid var(--line);border-radius:11px}.voe-heat{width:100%;min-width:980px;border-collapse:collapse}.voe-heat th,.voe-heat td{padding:9px;border-bottom:1px solid #e7ede8;font-size:11.5px;text-align:center}.voe-heat th{position:sticky;top:0;background:var(--q);color:#fff}.voe-heat th:first-child,.voe-heat td:first-child{text-align:left}.voe-heat td:first-child{position:sticky;left:0;background:#fff;color:var(--q);font-weight:800}.voe-cell{display:inline-grid;place-items:center;min-width:34px;height:28px;border-radius:8px;font-weight:900}.voe-cell.s0{background:#f1f3f1;color:#9aa49d}.voe-cell.s1{background:#eef4e9;color:#4f6a4f}.voe-cell.s2{background:#dcebcf;color:#245f2b}.voe-cell.s3{background:#c6d52f;color:#034c1f}
      .voe-voices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.voe-voice{margin:0;padding:12px;border:1px solid #e0e8e1;border-left:4px solid var(--lime);border-radius:10px;background:#fbfdfb}.voe-voice p{margin:0!important;font-size:12px!important;line-height:1.52!important;color:#435249!important;font-style:italic}.voe-voice footer{margin-top:8px;font-size:10.5px;color:var(--muted)}
      .voe-projects{display:grid;gap:8px}.voe-project{display:grid;grid-template-columns:minmax(170px,260px) 1fr auto;gap:10px;align-items:center;padding:9px;border:1px solid #e2e9e2;border-radius:10px;background:#fbfdfb}.voe-project b{font-size:11.5px;color:var(--q)}.voe-project i{height:11px;border-radius:999px;background:#edf1ed;overflow:hidden}.voe-project i em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--g),var(--lime))}.voe-project strong{font-size:12px;color:var(--q)}
      .voe-empty{padding:26px;text-align:center;border:1px dashed #cbd8cc;border-radius:12px;background:#fbfdfb;color:var(--muted);font-size:13px}.voe-empty b{display:block;margin-bottom:5px;color:var(--q);font-size:16px}
      @media(max-width:1500px){.voe-filter{grid-template-columns:repeat(5,minmax(145px,1fr))}.voe-field.search{grid-column:span 2}}
      @media(max-width:1150px){.voe-kpis{grid-template-columns:repeat(3,1fr)}.voe-8,.voe-7,.voe-6,.voe-5,.voe-4{grid-column:span 12}.voe-recgrid,.voe-personas,.voe-voices{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:760px){.voe-filter,.voe-kpis,.voe-recgrid,.voe-personas,.voe-voices,.voe-gauges{grid-template-columns:1fr}.voe-field.search{grid-column:span 1}.voe-bar{grid-template-columns:1fr}.voe-donutwrap{grid-template-columns:1fr}.voe-project{grid-template-columns:1fr}}
    `;
  }

  function projectName(id){return DATA?.projects?.find(p=>p.id===id)?.short_name || id;}
  function trackerFor(project){
    const p=DATA?.projects?.find(x=>x.id===project);
    if(!p) return [];
    return (TRACKER?.projects||[]).filter(r=>norm(r.project_name)===norm(p.name));
  }

  function allRows(){
    const rows=[];
    (DATA?.segments||[]).forEach(segment=>{
      (segment.observations||[]).forEach(obs=>rows.push({segment,obs,project:DATA.projects.find(p=>p.id===obs.project_id)||{id:obs.project_id,name:obs.project_id,short_name:obs.project_id}}));
    });
    return rows;
  }

  function filteredRows(){
    const q=norm(state.search);
    return allRows().filter(({segment,obs,project})=>{
      if(state.project!=='All'&&obs.project_id!==state.project)return false;
      if(state.persona!=='All'&&segment.persona!==state.persona)return false;
      if(state.orgType!=='All'&&segment.organization_type!==state.orgType)return false;
      if(state.archetype!=='All'&&segment.organization_archetype!==state.archetype)return false;
      if(state.level!=='All'&&segment.organization_level!==state.level)return false;
      if(state.research!=='All'&&obs.research_type!==state.research)return false;
      if(state.theme!=='All'&&obs.theme!==state.theme)return false;
      if(state.evidence!=='All'&&obs.evidence_type!==state.evidence)return false;
      if(state.stance!=='All'&&obs.stance!==state.stance)return false;
      if(!q)return true;
      return norm([segment.persona,segment.organization_type,segment.organization_archetype,segment.organization_level,segment.role_family,segment.core_perception,project.name,obs.theme,obs.stance,obs.headline,obs.insight,obs.implication,obs.recommendation,obs.quote].join(' ')).includes(q);
    });
  }

  function visibleSegments(rows){
    const ids=new Set(rows.map(r=>r.segment.id));
    return (DATA?.segments||[]).filter(s=>ids.has(s.id));
  }

  function filterBar(){
    const rows=allRows(),segments=DATA?.segments||[];
    const defs=[
      ['project','Project',['All',...(DATA?.projects||[]).map(p=>p.id)],v=>v==='All'?'All projects':projectName(v)],
      ['persona','Persona / expert type',['All',...uniq(segments.map(s=>s.persona))]],
      ['orgType','Organization type',['All',...uniq(segments.map(s=>s.organization_type))]],
      ['archetype','Organization archetype',['All',...uniq(segments.map(s=>s.organization_archetype))]],
      ['level','Organization level',['All',...uniq(segments.map(s=>s.organization_level))]],
      ['research','Research type',['All',...uniq(rows.map(r=>r.obs.research_type))]],
      ['theme','Theme',['All',...uniq(rows.map(r=>r.obs.theme))]],
      ['evidence','Evidence type',['All',...uniq(rows.map(r=>r.obs.evidence_type))]],
      ['stance','Perception / stance',['All',...uniq(rows.map(r=>r.obs.stance))]]
    ];
    return `<div class="voe-filter"><div class="voe-field search"><label>Search expert evidence</label><input data-filter="search" value="${esc(state.search)}" placeholder="Persona, theme, insight, recommendation…"></div>${defs.map(([key,label,vals,fmt])=>`<div class="voe-field"><label>${esc(label)}</label><select data-filter="${key}">${vals.map(v=>`<option value="${esc(v)}"${state[key]===v?' selected':''}>${esc(fmt?fmt(v):v)}</option>`).join('')}</select></div>`).join('')}<button class="voe-reset" id="voeReset">Reset</button></div>`;
  }

  function lens(rows){
    const parts=[];
    [['Project',state.project==='All'?'All':projectName(state.project)],['Persona',state.persona],['Org',state.orgType],['Archetype',state.archetype],['Level',state.level],['Research',state.research],['Theme',state.theme],['Evidence',state.evidence],['Stance',state.stance]].forEach(([k,v])=>{if(v&&v!=='All')parts.push(`<b>${esc(k)}:</b> ${esc(v)}`);});
    return `<div class="voe-lens">${parts.length?parts.join(' · '):'<b>Active lens:</b> All PMR expert perspectives'} · <b>${rows.length}</b> matching expert observations. All persona statements are illustrative synthesis unless replaced with approved confidential PMR evidence.</div>`;
  }

  function kpis(rows){
    const segs=visibleSegments(rows),projects=uniq(rows.map(r=>r.obs.project_id));
    const confidence=avg(rows.map(r=>r.obs.confidence)),impact=avg(rows.map(r=>r.obs.impact));
    const p1=rows.filter(r=>r.obs.priority==='P1').length;
    return `<div class="voe-kpis"><article class="voe-kpi"><div class="voe-icon">♟</div><div><strong>${segs.length}</strong><span>expert/persona segments</span></div></article><article class="voe-kpi"><div class="voe-icon">▤</div><div><strong>${projects.length}</strong><span>PMR projects represented</span></div></article><article class="voe-kpi"><div class="voe-icon">◎</div><div><strong>${confidence}%</strong><span>average demo confidence</span></div></article><article class="voe-kpi"><div class="voe-icon">↗</div><div><strong>${impact}%</strong><span>average strategic impact</span></div></article><article class="voe-kpi"><div class="voe-icon">!</div><div><strong>${p1}</strong><span>P1 insights / actions</span></div></article></div>`;
  }

  function executiveSummary(rows){
    if(!rows.length)return '<div class="voe-empty"><b>No expert synthesis</b>Change one or more filters to broaden the evidence lens.</div>';
    const segs=visibleSegments(rows); const single=segs.length===1?segs[0]:null;
    const headline=single?`${single.persona} · ${single.organization_archetype}`:`${segs.length} expert segments in the active lens`;
    const text=single?single.core_perception:`Across the current selection, the strongest recurring themes are ${topThemes(rows,3).map(x=>x[0]).join(', ')||'distributed across multiple needs'}. The view combines persona priorities with organization context so the same PMR evidence can surface different implications for executives, IT/data, clinical, operational and physician-group stakeholders.`;
    const metrics=['decision_influence','digital_readiness','workflow_friction','change_appetite','quest_trust'];
    const labels={decision_influence:'Decision influence',digital_readiness:'Digital readiness',workflow_friction:'Workflow friction',change_appetite:'Change appetite',quest_trust:'Quest trust'};
    const gaugeVals=metrics.map(m=>[labels[m],avg(segs.map(s=>s.metrics?.[m]||0))]);
    return `<div class="voe-summary"><div class="voe-summary-icon">${esc(single?.icon||'360')}</div><div><h4>${esc(headline)}</h4><p>${esc(text)}</p></div><div class="voe-gauges">${gaugeVals.map(([l,v])=>`<div class="voe-gauge"><span>${esc(l)} <b>${v}</b></span><i><em style="width:${clamp(v)}%"></em></i></div>`).join('')}</div></div>`;
  }

  function topThemes(rows,limit=7){
    const map=new Map(); rows.forEach(r=>{const v=map.get(r.obs.theme)||{sum:0,n:0};v.sum+=Number(r.obs.impact||0);v.n++;map.set(r.obs.theme,v);});
    return [...map.entries()].map(([k,v])=>[k,Math.round(v.sum/v.n),v.n]).sort((a,b)=>b[1]-a[1]||b[2]-a[2]).slice(0,limit);
  }

  function themeBars(rows){
    const themes=topThemes(rows,8); if(!themes.length)return '<div class="voe-empty"><b>No themes</b>No matching themes in this filter context.</div>';
    return `<div class="voe-bars">${themes.map(([name,score,count],i)=>`<div class="voe-bar"><div class="voe-bar-label"><span class="voe-bar-mark">${i+1}</span><b>${esc(name)}</b></div><div class="voe-track"><i style="width:${clamp(score)}%"></i></div><span class="voe-bar-val">${score}</span></div>`).join('')}</div>`;
  }

  function archetypeDonut(rows){
    const colors=['#35792a','#00587c','#80276c','#c78800','#c6d52f','#72877a']; const counts=new Map();rows.forEach(r=>counts.set(r.segment.organization_archetype,(counts.get(r.segment.organization_archetype)||0)+1)); const entries=[...counts.entries()].sort((a,b)=>b[1]-a[1]); const total=rows.length||1;let cursor=0;const stops=[];entries.forEach(([k,n],i)=>{const next=cursor+n/total*360;stops.push(`${colors[i%colors.length]} ${cursor}deg ${next}deg`);cursor=next;});
    return `<div class="voe-donutwrap"><div class="voe-donutbox"><div class="voe-donut" style="background:conic-gradient(${stops.join(',')||'#edf1ed 0 360deg'})"></div><div class="voe-donutcenter">${rows.length}<small>observations</small></div></div><div class="voe-legend">${entries.map(([k,n],i)=>`<div class="voe-leg"><i style="background:${colors[i%colors.length]}"></i><span>${esc(k)}</span><b>${Math.round(n/total*100)}%</b></div>`).join('')}</div></div>`;
  }

  function scatter(rows){
    const segs=visibleSegments(rows); if(!segs.length)return '<div class="voe-empty"><b>No persona map</b>No matching expert segments.</div>';
    return `<div class="voe-scatter-wrap"><div class="voe-scatter">${segs.map(s=>{const x=clamp(s.metrics?.digital_readiness,5,95),y=clamp(s.metrics?.workflow_friction,5,95);const cls=/operator/i.test(s.organization_archetype)?'operator':/lpg/i.test(s.organization_archetype)?'lpg':/consumer/i.test(s.organization_archetype)?'consumer':'mainstay';return `<span class="voe-point ${cls}" style="left:${x}%;bottom:${y}%" title="${esc(s.persona)} · ${esc(s.organization_archetype)} · Digital ${x} · Friction ${y}">${esc(s.icon)}</span>`;}).join('')}</div></div>`;
  }

  function personaBars(rows){
    const map=new Map();rows.forEach(r=>{const k=r.segment.persona,v=map.get(k)||{sum:0,n:0,icon:r.segment.icon};v.sum+=Number(r.obs.impact||0);v.n++;map.set(k,v)});const data=[...map.entries()].map(([k,v])=>[k,Math.round(v.sum/v.n),v.icon]).sort((a,b)=>b[1]-a[1]);
    if(!data.length)return '<div class="voe-empty"><b>No personas</b>No expert personas match this lens.</div>';
    return `<div class="voe-bars">${data.map(([k,v,icon])=>`<div class="voe-bar"><div class="voe-bar-label"><span class="voe-bar-mark">${esc(icon)}</span><b>${esc(k)}</b></div><div class="voe-track"><i style="width:${clamp(v)}%"></i></div><span class="voe-bar-val">${v}</span></div>`).join('')}</div>`;
  }

  function insightFeed(rows){
    if(!rows.length)return '<div class="voe-empty"><b>No insight feed</b>Broaden the filters to show persona-specific observations.</div>';
    const ordered=[...rows].sort((a,b)=>Number(b.obs.impact||0)+Number(b.obs.confidence||0)-Number(a.obs.impact||0)-Number(a.obs.confidence||0)).slice(0,12);
    return `<div class="voe-feed">${ordered.map(({segment,obs,project})=>`<article class="voe-insight"><div class="voe-insight-icon">${esc(segment.icon)}</div><div><div class="voe-tags"><span class="voe-tag">${esc(segment.persona)}</span><span class="voe-tag purple">${esc(segment.organization_archetype)}</span><span class="voe-tag blue">${esc(project.short_name)}</span><span class="voe-tag gold">${esc(obs.theme)}</span></div><h4>${esc(obs.headline)}</h4><p>${esc(obs.insight)}</p><p class="imp"><b>Quest implication:</b> ${esc(obs.implication)}</p></div><div class="voe-score"><b>${esc(obs.priority)}</b><small>${obs.confidence}% conf.</small><small>${obs.impact}% impact</small></div></article>`).join('')}</div>`;
  }

  function recommendations(rows){
    if(!rows.length)return '<div class="voe-empty"><b>No recommendations</b>No matching actions in this context.</div>';
    const seen=new Set(),recs=[];[...rows].sort((a,b)=>Number(b.obs.impact||0)-Number(a.obs.impact||0)).forEach(r=>{const key=norm(r.obs.recommendation);if(!key||seen.has(key))return;seen.add(key);recs.push(r);});
    return `<div class="voe-recgrid">${recs.slice(0,9).map(({segment,obs,project})=>`<article class="voe-rec"><span class="voe-rec-pri">${esc(obs.priority)}</span><h4>${esc(obs.recommendation)}</h4><p><b>Why:</b> ${esc(obs.implication)}</p><footer>${esc(segment.persona)} · ${esc(segment.organization_archetype)} · ${esc(project.short_name)} · ${obs.confidence}% confidence</footer></article>`).join('')}</div>`;
  }

  function personaCards(rows){
    const segs=visibleSegments(rows);if(!segs.length)return '<div class="voe-empty"><b>No expert profiles</b>No profiles match the filters.</div>';
    return `<div class="voe-personas">${segs.map(s=>`<article class="voe-persona"><div class="voe-persona-top"><div class="voe-persona-icon">${esc(s.icon)}</div><div><h4>${esc(s.persona)}</h4><small>${esc(s.organization_archetype)} · ${esc(s.organization_level)}</small></div></div><p>${esc(s.core_perception)}</p><div class="voe-mini"><span><b>${s.metrics.decision_influence}</b>Influence</span><span><b>${s.metrics.digital_readiness}</b>Digital</span><span><b>${s.metrics.workflow_friction}</b>Friction</span></div></article>`).join('')}</div>`;
  }

  function heatmap(rows){
    const personas=uniq(rows.map(r=>r.segment.persona)).slice(0,8),themes=topThemes(rows,10).map(x=>x[0]);if(!personas.length||!themes.length)return '<div class="voe-empty"><b>No matrix</b>No persona-theme overlap.</div>';
    return `<div class="voe-heatwrap"><table class="voe-heat"><thead><tr><th>Theme</th>${personas.map(p=>`<th>${esc(short(p))}</th>`).join('')}</tr></thead><tbody>${themes.map(theme=>`<tr><td>${esc(theme)}</td>${personas.map(persona=>{const rs=rows.filter(r=>r.obs.theme===theme&&r.segment.persona===persona);const v=rs.length?avg(rs.map(r=>r.obs.impact)):0;const cls=v>=90?'s3':v>=80?'s2':v>0?'s1':'s0';return `<td><span class="voe-cell ${cls}">${v||'—'}</span></td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function voices(rows){
    if(!rows.length)return '<div class="voe-empty"><b>No evidence voices</b>No matching illustrative evidence.</div>';
    return `<div class="voe-voices">${rows.slice(0,9).map(({segment,obs,project})=>`<blockquote class="voe-voice"><p>“${esc(obs.quote)}”</p><footer>${esc(segment.persona)} · ${esc(segment.organization_archetype)} · ${esc(obs.evidence_type)} · ${esc(project.short_name)}</footer></blockquote>`).join('')}</div>`;
  }

  function projectCoverage(rows){
    const map=new Map();rows.forEach(r=>map.set(r.obs.project_id,(map.get(r.obs.project_id)||0)+1));const entries=[...map.entries()].sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...entries.map(x=>x[1]));if(!entries.length)return '<div class="voe-empty"><b>No project coverage</b>No matching project evidence.</div>';
    return `<div class="voe-projects">${entries.map(([id,n])=>{const t=trackerFor(id);const completes=t.reduce((s,r)=>s+Number(r.completed||0),0);const target=t.reduce((s,r)=>s+Number(r.total_target||0),0);return `<div class="voe-project"><b>${esc(projectName(id))}</b><i><em style="width:${Math.round(n/max*100)}%"></em></i><strong>${n} insights${target?` · ${completes}/${target} completes`:''}</strong></div>`;}).join('')}</div>`;
  }

  function template(){
    const rows=filteredRows();
    const reportDate=TRACKER?.reporting_date||'Not available';
    return `<section class="view voef" data-view="experts" data-voe-final="true"><div class="page-heading"><div><span class="section-kicker">PERSONA & ORGANIZATION INTELLIGENCE</span><h1>Voice of Experts</h1><p>Compare how health-system executives, IT/data, clinical, operational, physician-group and other expert segments perceive customer needs, digital workflows, stewardship, data/AI and enterprise value across the Quest PMR portfolio.</p><div class="voe-meta"><span class="voe-pill"><b>Tracker:</b> ${esc(reportDate)}</span><span class="voe-pill"><b>Projects:</b> ${(DATA?.projects||[]).length} PMR programs</span><span class="voe-pill"><b>Persona model:</b> expert × organization × level</span><span class="voe-pill"><b>Analysis:</b> filter-responsive demo synthesis</span></div></div><div class="heading-actions"><button class="voe-export" id="voeExport">↓ Export filtered insights</button></div></div>${filterBar()}${lens(rows)}${kpis(rows)}<div class="voe-grid"><article class="voe-panel voe-12"><div class="voe-head"><div><span class="voe-kicker">EXECUTIVE PERSONA SYNTHESIS</span><h3>What does the selected expert lens care about?</h3><p>Perception and operating priorities recompute from the active filters.</p></div></div>${executiveSummary(rows)}</article><article class="voe-panel voe-7"><div class="voe-head"><div><span class="voe-kicker">PERSONA PRIORITY</span><h3>Strategic importance by expert type</h3><p>Average impact of matching observations for each persona.</p></div></div>${personaBars(rows)}</article><article class="voe-panel voe-5"><div class="voe-head"><div><span class="voe-kicker">ORGANIZATION MIX</span><h3>Evidence by organization archetype</h3><p>Mainstay, Operator, LPG and other segment representation.</p></div></div>${archetypeDonut(rows)}</article><article class="voe-panel voe-7"><div class="voe-head"><div><span class="voe-kicker">THEME INTENSITY</span><h3>What matters most in this lens?</h3><p>High-impact themes ranked across matching expert observations.</p></div></div>${themeBars(rows)}</article><article class="voe-panel voe-5"><div class="voe-head"><div><span class="voe-kicker">READINESS × FRICTION</span><h3>Persona operating context</h3><p>Digital readiness plotted against workflow friction.</p></div></div>${scatter(rows)}</article><article class="voe-panel voe-12"><div class="voe-head"><div><span class="voe-kicker">PERSONA × THEME MATRIX</span><h3>Where priorities converge and diverge</h3><p>Higher values indicate stronger strategic importance for that persona-theme intersection.</p></div></div>${heatmap(rows)}</article><article class="voe-panel voe-8"><div class="voe-head"><div><span class="voe-kicker">DYNAMIC EXPERT INSIGHT FEED</span><h3>Perceptions, needs and Quest implications</h3><p>Project-specific findings re-rank when filters change.</p></div></div>${insightFeed(rows)}</article><article class="voe-panel voe-4"><div class="voe-head"><div><span class="voe-kicker">PMR COVERAGE</span><h3>Project contribution</h3><p>Matching insights and source-backed completed sample where available.</p></div></div>${projectCoverage(rows)}</article><article class="voe-panel voe-12"><div class="voe-head"><div><span class="voe-kicker">RECOMMENDATIONS BY PERSONA</span><h3>Actions suggested by the selected evidence context</h3><p>Recommendations inherit the active project, persona and organization filters.</p></div></div>${recommendations(rows)}</article><article class="voe-panel voe-12"><div class="voe-head"><div><span class="voe-kicker">EXPERT ARCHETYPES</span><h3>How different personas see the relationship</h3><p>Compact profiles show influence, digital readiness and workflow friction.</p></div></div>${personaCards(rows)}</article><article class="voe-panel voe-12"><div class="voe-head"><div><span class="voe-kicker">VOICE OF EVIDENCE</span><h3>Illustrative report / transcript-style evidence</h3><p>Demo paraphrases demonstrate how approved qualitative evidence could be surfaced without exposing confidential transcripts.</p></div></div>${voices(rows)}</article></div></section>`;
  }

  function locate(){return document.querySelector('.view[data-view="experts"]')||Array.from(document.querySelectorAll('.view[data-view]')).find(v=>/Voice of Experts/i.test(v.querySelector('h1')?.textContent||''));}

  function wire(view){
    view.querySelectorAll('[data-filter]').forEach(control=>{const evt=control.tagName==='INPUT'?'input':'change';control.addEventListener(evt,()=>{state[control.dataset.filter]=control.value;render();});});
    view.querySelector('#voeReset')?.addEventListener('click',()=>{Object.assign(state,{search:'',project:'All',persona:'All',orgType:'All',archetype:'All',level:'All',research:'All',theme:'All',evidence:'All',stance:'All'});render();});
    view.querySelector('#voeExport')?.addEventListener('click',exportCsv);
  }

  function render(){
    if(!DATA)return;const current=locate();if(!current)return;const holder=document.createElement('div');holder.innerHTML=template().trim();const replacement=holder.firstElementChild;if(current.classList.contains('active'))replacement.classList.add('active');current.replaceWith(replacement);wire(replacement);
  }

  function exportCsv(){
    const rows=filteredRows().map(({segment,obs,project})=>[project.short_name,segment.persona,segment.organization_type,segment.organization_archetype,segment.organization_level,obs.research_type,obs.evidence_type,obs.theme,obs.stance,obs.priority,obs.confidence,obs.impact,obs.headline,obs.insight,obs.implication,obs.recommendation]);
    const data=[['Project','Persona','Organization type','Archetype','Organization level','Research type','Evidence type','Theme','Stance','Priority','Confidence','Impact','Headline','Insight','Quest implication','Recommendation'],...rows].map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');const blob=new Blob([data],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='quest-voice-of-experts-filtered-insights.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  }

  async function load(){
    const [data,tracker]=await Promise.all([fetch(DATA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Voice of Experts data ${r.status}`);return r.json();}),fetch(TRACKER_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)]);DATA=data;TRACKER=tracker;
  }

  async function boot(){
    if(booted)return;booted=true;injectStyles();try{await load();}catch(e){console.error('Voice of Experts analysis unavailable:',e);return;}render();document.addEventListener('click',e=>{const nav=e.target.closest('.nav-item');if(nav&&(nav.dataset.view==='experts'||/Voice of Experts/i.test(nav.textContent||'')))setTimeout(render,0);},true);window.addEventListener('quest:layout-refresh',e=>{if(!e.detail?.group||e.detail.group==='experts')setTimeout(render,0);});window.addEventListener('quest:module-loaded',e=>{if(/voice-experts/i.test(e.detail?.path||''))setTimeout(render,0);});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
