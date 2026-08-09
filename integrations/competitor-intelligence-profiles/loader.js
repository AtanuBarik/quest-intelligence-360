(() => {
  'use strict';

  const jsParts = ['chunk-00.b64','chunk-01.b64','chunk-02.b64','chunk-03.b64','chunk-04.b64','chunk-05.b64'];
  const dataParts = ['data-00.b64','data-01.b64','data-02.b64','data-03.b64'];
  const RELEASE = '2026-08-09t';
  const ALLOWED = ['quest','labcorp','arup','mayo','bioreference','sonic','cleveland','neogenomics'];
  const DISPLAY = {quest:'Quest Diagnostics',labcorp:'Labcorp',arup:'ARUP Laboratories',mayo:'Mayo Clinic Laboratories',bioreference:'BioReference Health',sonic:'Sonic Healthcare',cleveland:'Cleveland Clinic Laboratories',neogenomics:'NeoGenomics Laboratories'};
  const REQUIRED = {
    quest:{id:'quest',name:'Quest Diagnostics',type:'National diagnostic information services',priority:'Benchmark',hq:'Secaucus, New Jersey',founded:'1967',leader:'Jim Davis, Chairman, CEO and President',employees:'Nearly 57,000',financial:'FY2025 revenue: approximately $11.04B',geography:'Serves half of U.S. physicians and hospitals and one in three American adults each year',position:'National leader in diagnostic information services with broad routine, advanced-diagnostics, consumer and health-system capabilities.',customers:['Physicians and health systems','Patients and consumers','Employers and population-health programs','Payers','Biopharma and research partners'],products:['Routine and specialty laboratory testing','Advanced oncology, genomic and rare-disease diagnostics','Consumer-initiated testing through questhealth.com','Drug monitoring and toxicology','Cardiometabolic, neurology and women’s-health diagnostics'],pricing:'Mix of contracted payer reimbursement, health-system and physician arrangements, employer programs and direct-to-consumer pricing.',innovation:'Investment spans advanced diagnostics, oncology, digital access, health-system integration, consumer testing and longitudinal health insights.',marketing:'Enterprise relationships, physician education, consumer access, employer solutions and digital channels.',distribution:'National laboratory and patient-service-center network supported by couriers, physician interfaces, hospital partnerships and digital ordering/results.',customer:'Large national access footprint and broad test menu support convenience; billing, coverage, turnaround and digital integration remain important experience dimensions.',operations:'High-volume national laboratory network with automated core labs, logistics, health-system collaborations, specialty centers of excellence and digital connectivity.',moves:['Expansion of health-system partnerships and joint ventures','Growth in consumer and wearable-enabled testing','Continued expansion of advanced oncology and specialty diagnostics'],swot:{Strengths:['National scale and access','Broad payer and provider relationships','Wide routine-to-advanced test menu'],Weaknesses:['Complex reimbursement and billing environment','Large-network service consistency requirements'],Opportunities:['Consumer and longitudinal testing','Health-system laboratory partnerships','Advanced diagnostics and AI-enabled workflow'],Threats:['National and specialty competitors','Reimbursement pressure','Rapid technology and regulatory change']},scores:{Market:5,Innovation:4,Pricing:4,Service:4,Digital:4,Clinical:5},sources:[['Quest Diagnostics fact sheet','https://newsroom.questdiagnostics.com/Fact-sheet?mobile=No'],['Quest Diagnostics newsroom','https://newsroom.questdiagnostics.com/'],['Investor relations','https://ir.questdiagnostics.com/overview/default.aspx']]},
    cleveland:{id:'cleveland',name:'Cleveland Clinic Laboratories',type:'Academic health-system reference laboratory',priority:'Medium',hq:'Cleveland, Ohio',founded:'More than 25 years of reference-laboratory service',leader:'Cleveland Clinic Pathology & Laboratory Medicine leadership',employees:'Part of a pathology and laboratory medicine organization with approximately 2,200 caregivers',financial:'Part of nonprofit Cleveland Clinic; standalone laboratory revenue is not publicly disclosed',geography:'Reference-laboratory services for hospitals and health systems, supported by the Cleveland Clinic network and global clinical reach',position:'Integrated academic reference laboratory combining subspecialty pathology, molecular diagnostics, laboratory medicine and direct access to Cleveland Clinic clinical expertise.',customers:['Hospitals and health systems','Pathologists and community clinicians','Academic and specialty centers','Research and clinical-trial programs','Cleveland Clinic care sites'],products:['Clinical chemistry and immunology','Molecular pathology and genomics','Hematopathology and coagulation','Microbiology and transfusion medicine','Subspecialty anatomic pathology and expert consultation'],pricing:'Reference-laboratory and institutional contracting aligned to specialized testing, consultation and health-system needs.',innovation:'Embedded in an academic clinical environment with translational research, diagnostic AI, molecular pathology and subspecialty expert interpretation.',marketing:'Clinical-authority positioning centered on Cleveland Clinic expertise, specialist consultation and complex diagnostic capability.',distribution:'Central reference services, health-system specimen logistics, client services and Cleveland Clinic network connectivity.',customer:'Strong perceived clinical authority and access to subspecialists; reference workflows emphasize consultation, complex case support and reliable specialty testing.',operations:'Cleveland Clinic Pathology & Laboratory Medicine processes more than 20 million tests annually across the broader institute, with reference services delivered through Cleveland Clinic Laboratories.',moves:['Expansion of molecular and specialty diagnostic menus','Use of diagnostic AI and translational research capabilities','Continued reference-laboratory support for health systems and complex-care programs'],swot:{Strengths:['Cleveland Clinic clinical brand','Deep subspecialty pathology expertise','Integrated academic and care-delivery environment'],Weaknesses:['Smaller commercial footprint than national reference labs','Standalone financial transparency is limited'],Opportunities:['Complex specialty referrals','Health-system reference partnerships','AI and molecular diagnostics'],Threats:['National reference-lab scale competitors','Specialty-test price pressure','Health-system insourcing and network choices']},scores:{Market:3,Innovation:5,Pricing:3,Service:5,Digital:4,Clinical:5},sources:[['Pathology & Laboratory Medicine Institute','https://my.clevelandclinic.org/departments/pathology'],['Laboratory Medicine','https://my.clevelandclinic.org/departments/pathology/depts/laboratory-medicine'],['Cleveland Clinic Laboratories','https://clevelandcliniclabs.com/']]}
  };

  async function inflateBase64(paths, base) {
    const responses = await Promise.all(paths.map(name => fetch(new URL(`${name}?v=${RELEASE}`, base), { cache: 'no-store' })));
    const failed = responses.find(response => !response.ok);
    if (failed) throw new Error(`Unable to load competitor intelligence bundle (${failed.status})`);
    const encoded = (await Promise.all(responses.map(response => response.text()))).join('').replace(/\s+/g, '');
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  }

  function detectRoute() {
    if (document.querySelector('.view[data-view="competitors"]')) return 'competitors';
    if (document.querySelector('.view[data-view="profiles"]')) return 'profiles';
    return 'competitors';
  }
  function currentView(route) { return document.querySelector(`.view[data-view="${route}"]`); }
  function isExpanded(route) {
    const view = currentView(route);
    if (!view) return false;
    if (view.dataset.expanded === '1' || view.dataset.competitorIntelligence === 'true') return true;
    if (view.querySelector('.cp-card, .ci-profile-card, [data-competitor-profile-id]')) return true;
    return view.querySelectorAll('.competitor-card').length > 4;
  }
  function patchRoute(source, route) {
    if (route === 'competitors') return source;
    return source.replaceAll('data-view="competitors"',`data-view="${route}"`).replaceAll("data-view='competitors'",`data-view='${route}'`).replaceAll("'competitors'",`'${route}'`).replaceAll('"competitors"',`"${route}"`);
  }
  function removeLegacyDrawer() {
    document.getElementById('profileDrawer')?.remove(); document.getElementById('drawerBackdrop')?.remove();
    document.body.classList.remove('drawer-open'); document.body.style.overflow = '';
  }
  function mergeList(existing, additions) { return [...(Array.isArray(existing)?existing:[]),...(Array.isArray(additions)?additions:[])].filter((item,index,all)=>item&&all.indexOf(item)===index); }
  function mergeSources(existing, additions) { return [...(Array.isArray(existing)?existing:[]),...(Array.isArray(additions)?additions:[])].filter((item,index,all)=>{const url=Array.isArray(item)?item[1]:'';return url&&all.findIndex(other=>Array.isArray(other)&&other[1]===url)===index;}); }
  function canonicalId(profile) {
    const id=String(profile?.id||'').toLowerCase(); if(ALLOWED.includes(id)) return id;
    const name=String(profile?.name||'').toLowerCase();
    if(name.includes('quest diagnostics')) return 'quest'; if(name.includes('labcorp')) return 'labcorp'; if(name.includes('arup')) return 'arup'; if(name.includes('mayo clinic')) return 'mayo'; if(name.includes('bioreference')) return 'bioreference'; if(name.includes('sonic healthcare')) return 'sonic'; if(name.includes('cleveland clinic')) return 'cleveland'; if(name.includes('neogenomics')) return 'neogenomics'; return '';
  }
  function curateProfiles(profiles) {
    const byId=new Map();
    profiles.forEach(profile=>{const id=canonicalId(profile);if(!id)return;byId.set(id,{...profile,id,name:DISPLAY[id]});});
    Object.entries(REQUIRED).forEach(([id,profile])=>{if(!byId.has(id))byId.set(id,{...profile});});
    return ALLOWED.map(id=>byId.get(id)).filter(Boolean);
  }

  async function applyDailyRefresh(dataText, loaderBase) {
    let parsed; try { parsed=JSON.parse(dataText); } catch (_) { return {dataText,refresh:null,audit:null}; }
    let refresh=null; try { const response=await fetch(new URL(`../../data/competitor-daily-refresh.json?v=${Date.now()}`,loaderBase),{cache:'no-store'}); if(response.ok)refresh=await response.json(); } catch (_) {}
    let audit={overrides:[]}; try { const response=await fetch(new URL(`../../data/competitor-audit-overrides.json?v=${Date.now()}`,loaderBase),{cache:'no-store'}); if(response.ok)audit=await response.json(); } catch (_) {}
    const refreshById=new Map((refresh?.competitors||[]).map(item=>[String(item.id||'').toLowerCase(),item]));
    const refreshByName=new Map((refresh?.competitors||[]).map(item=>[String(item.name||'').toLowerCase(),item]));
    const auditById=new Map((audit.overrides||[]).map(item=>[String(item.id||'').toLowerCase(),item]));
    const rawProfiles=Array.isArray(parsed)?parsed:Array.isArray(parsed.profiles)?parsed.profiles:Array.isArray(parsed.competitors)?parsed.competitors:[];
    const profiles=curateProfiles(rawProfiles);
    rawProfiles.splice(0,rawProfiles.length,...profiles);
    profiles.forEach(profile=>{
      const key=String(profile.id||'').toLowerCase(); const current=refreshById.get(key)||refreshByName.get(String(profile.name||'').toLowerCase());
      if(current){
        Object.entries(current.profile_patch||{}).forEach(([field,value])=>{if(field==='sources'&&Array.isArray(value))profile.sources=mergeSources(profile.sources,value);else if(value!==null&&value!==undefined&&value!=='')profile[field]=value;});
        profile.last_updated_at=current.last_updated_at; profile.last_checked_at=current.last_checked_at; profile.refresh_status=current.refresh_status; profile.latest_developments=current.latest_developments||[]; profile.verified_fields=current.verified_fields||{}; profile.daily_changes=current.changes||{added:[],removed:[],modified:[]};
      }
      const verified=auditById.get(key); if(!verified)return;
      Object.entries(verified).forEach(([field,value])=>{if(['id','last_updated_at','audit_note'].includes(field))return;if(field==='sources_add'){profile.sources=mergeSources(profile.sources,value);return;}if(field==='latest_developments_add'){profile.latest_developments=mergeList(profile.latest_developments,value);return;}if(field.endsWith('_add')){const target=field.slice(0,-4);profile[target]=mergeList(profile[target],value);return;}if(value!==null&&value!==undefined&&value!=='')profile[field]=value;});
      profile.last_updated_at=verified.last_updated_at||profile.last_updated_at; profile.public_audit_note=verified.audit_note||'';
    });
    window.__QUEST_COMPETITOR_REFRESH__=refresh; window.__QUEST_COMPETITOR_AUDIT__=audit; window.__QUEST_COMPETITOR_PROFILES__=profiles;
    return {dataText:JSON.stringify(parsed),refresh,audit};
  }

  function showLoadError(error, route) {
    console.error('Competitor Intelligence Profiles integration failed:',error); let attempts=0;
    const timer=setInterval(()=>{attempts+=1;const view=currentView(route)||currentView(detectRoute());if(view&&!view.querySelector('[data-cp-load-error]')){const warning=document.createElement('div');warning.dataset.cpLoadError='true';warning.style.cssText='margin:12px 0;padding:12px 14px;border:1px solid #efc5d2;border-radius:10px;background:#fff4f7;color:#8e2647;font:600 12px/1.4 Arial,sans-serif';warning.textContent=`Expanded competitor profiles could not load: ${error.message}. Please refresh the page.`;view.prepend(warning);clearInterval(timer);}if(attempts>120)clearInterval(timer);},100);
  }
  async function loadFallback(route, loaderBase) {
    if(isExpanded(route))return;
    const fallbackUrl=new URL(`../competitor-profile-expansion/competitor-expansion.js?v=${RELEASE}`,loaderBase); const response=await fetch(fallbackUrl,{cache:'no-store'}); if(!response.ok)throw new Error(`Fallback profile module returned ${response.status}`);
    let source=await response.text(); const profileBase=new URL('../competitor-profile-expansion/',loaderBase).href;
    source=source.replace("const base=new URL('.',document.currentScript.src);",`const base=new URL('${profileBase}');`).replace("const base = new URL('.', document.currentScript.src);",`const base=new URL('${profileBase}');`).replaceAll('data-view="profiles"',`data-view="${route}"`).replaceAll("data-view='profiles'",`data-view='${route}'`).replaceAll("'profiles'",`'${route}'`).replaceAll('"profiles"',`"${route}"`);
    const script=document.createElement('script');script.dataset.integration='competitor-profile-fallback';script.textContent=`${source}\nwindow.__QUEST_COMPETITOR_PROFILES_VERSION__='${RELEASE}-fallback';\n//# sourceURL=competitor-profile-fallback.js`;document.body.appendChild(script);
  }

  async function boot() {
    let dataUrl; const loaderBase=new URL('.',document.currentScript.src); const route=detectRoute();
    try {
      removeLegacyDrawer();
      const [source,rawDataText]=await Promise.all([inflateBase64(jsParts,loaderBase),inflateBase64(dataParts,loaderBase)]);
      const refreshed=await applyDailyRefresh(rawDataText,loaderBase); const dataText=refreshed.dataText; JSON.parse(dataText); dataUrl=URL.createObjectURL(new Blob([dataText],{type:'application/json'}));
      const patchedSource=patchRoute(source,route).replace("const DATA_URL = 'data/competitor-profiles-expanded.json';",`const DATA_URL = '${dataUrl}';`);
      const script=document.createElement('script');script.dataset.integration='competitor-intelligence-profiles';script.textContent=`${patchedSource}\nwindow.__QUEST_COMPETITOR_PROFILES_VERSION__='${RELEASE}';\n//# sourceURL=competitor-intelligence-profiles.js`;document.body.appendChild(script);
      window.dispatchEvent(new CustomEvent('quest:competitor-refresh-loaded',{detail:refreshed.refresh||{}}));
      setTimeout(async()=>{try{if(!isExpanded(route))await loadFallback(route,loaderBase);removeLegacyDrawer();}catch(error){showLoadError(error,route);}},2200);
      setTimeout(()=>{if(dataUrl)URL.revokeObjectURL(dataUrl);},300000);
    } catch (error) {
      if(dataUrl)URL.revokeObjectURL(dataUrl); try{await loadFallback(route,loaderBase);removeLegacyDrawer();}catch(fallbackError){showLoadError(new Error(`${error.message}; ${fallbackError.message}`),route);}
    }
  }
  boot();
})();
