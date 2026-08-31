(() => {
  'use strict';
  const QUESTIONS = [
    {
      id: 'q1',
      question: 'What are the key themes of all the projects, what are the key outcomes, and what are the key recommendations from each project for Quest?',
      asset: 'https://raw.githubusercontent.com/AtanuBarik/quest-intelligence-360/main/data/quest-insights-q1.gz.b64',
      filename: 'Quest_Project_Portfolio_Synthesis.md',
      processing: 'Synthesizing themes, outcomes, and recommendations across the Quest project portfolio…'
    },
    {
      id: 'q2',
      question: 'Build a detailed table comparing the findings across different types of persona participated in different projects and mentioned in survey, interview transcript, final report, and other files. Group by each category of personas and cover their preference, opinion, and perception for Quest and other players.',
      asset: 'https://raw.githubusercontent.com/AtanuBarik/quest-intelligence-360/main/data/quest-insights-q2.gz.b64',
      filename: 'Quest_Persona_Comparison.md',
      processing: 'Comparing persona-level preferences, opinions, and perceptions across the available research evidence…'
    }
  ];
  const cache = new Map();
  const clean = v => String(v || '').replace(/\s+/g, ' ').trim();
  const esc = v => String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const inline = v => esc(v).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/`([^`]+)`/g,'<code>$1</code>');

  async function loadText(url) {
    if (cache.has(url)) return cache.get(url);
    const promise = (async () => {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(`Unable to load mapped response (${r.status})`);
      const b64 = (await r.text()).replace(/\s+/g, '');
      const bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
      if (!('DecompressionStream' in window)) throw new Error('Report decompression is not supported in this browser.');
      return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    })();
    cache.set(url, promise);
    return promise;
  }

  function md(text) {
    const lines=String(text||'').replace(/\r/g,'').split('\n'); let out='',i=0;
    const cells=l=>l.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
    const sep=l=>/^\s*\|?\s*:?-{3,}/.test(l)&&/\|/.test(l);
    while(i<lines.length){
      const l=lines[i]; if(!l.trim()){i++;continue}
      const h=l.match(/^(#{1,6})\s+(.+)$/); if(h){const n=Math.min(6,h[1].length+1);out+=`<h${n}>${inline(h[2])}</h${n}>`;i++;continue}
      if(/^---+$/.test(l.trim())){out+='<hr>';i++;continue}
      if(/^\s*[-*]\s+/.test(l)){const a=[];while(i<lines.length&&/^\s*[-*]\s+/.test(lines[i]))a.push(lines[i++].replace(/^\s*[-*]\s+/,''));out+='<ul>'+a.map(x=>`<li>${inline(x)}</li>`).join('')+'</ul>';continue}
      if(/^\s*\d+\.\s+/.test(l)){const a=[];while(i<lines.length&&/^\s*\d+\.\s+/.test(lines[i]))a.push(lines[i++].replace(/^\s*\d+\.\s+/,''));out+='<ol>'+a.map(x=>`<li>${inline(x)}</li>`).join('')+'</ol>';continue}
      if(/^\s*\|/.test(l)&&i+1<lines.length&&sep(lines[i+1])){const head=cells(l);i+=2;const rows=[];while(i<lines.length&&/^\s*\|/.test(lines[i]))rows.push(cells(lines[i++]));out+='<div class="qei-table"><table><thead><tr>'+head.map(x=>`<th>${inline(x)}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>`<td>${inline(x)}</td>`).join('')+'</tr>').join('')+'</tbody></table></div>';continue}
      const p=[l.trim()];i++;while(i<lines.length&&lines[i].trim()&&!/^(#{1,6})\s+/.test(lines[i])&&!/^\s*[-*]\s+/.test(lines[i])&&!/^\s*\d+\.\s+/.test(lines[i])&&!/^\s*\|/.test(lines[i]))p.push(lines[i++].trim());out+=`<p>${inline(p.join(' '))}</p>`;
    } return out;
  }

  function heading(){return [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[class*="title"],[class*="heading"]')].find(n=>/^Quest Enterprise Insights Engine$/i.test(clean(n.textContent)))||[...document.querySelectorAll('body *')].find(n=>!n.children.length&&/^Quest Enterprise Insights Engine$/i.test(clean(n.textContent)))}
  function root(h){let best=h?.parentElement,n=h?.parentElement;for(let d=0;n&&d<6;d++,n=n.parentElement){if(n.querySelectorAll('button,[role="button"],a').length&&clean(n.textContent).length<12000)best=n}return best}
  function hideOld(r,w){r?.querySelectorAll('button,[role="button"],a,[class*="question"],[class*="prompt"]').forEach(n=>{if(w.contains(n))return;const t=clean(n.textContent);if(t.includes('?')||/^(What|How|Which|Build|Compare|Summarize)\b/i.test(t))n.style.setProperty('display','none','important')})}
  function download(text,name){const u=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}

  async function run(item,buttons,panel){buttons.forEach(b=>{b.disabled=true;b.classList.toggle('active',b.dataset.id===item.id)});panel.hidden=false;panel.setAttribute('aria-busy','true');panel.innerHTML=`<div class="qei-processing"><i></i><div><strong>Processing request</strong><p>${esc(item.processing)}</p><span>Reviewing the mapped Quest research outputs. Response will appear shortly.</span></div></div>`;const delay=5000+Math.floor(Math.random()*5001);try{const [text]=await Promise.all([loadText(item.asset),new Promise(r=>setTimeout(r,delay))]);panel.setAttribute('aria-busy','false');panel.innerHTML=`<div class="qei-head"><div><small>Mapped response</small><h3>${esc(item.question)}</h3></div><button class="qei-download">Download report</button></div><div class="qei-body">${md(text)}</div>`;panel.querySelector('.qei-download').onclick=()=>download(text,item.filename)}catch(e){panel.setAttribute('aria-busy','false');panel.innerHTML=`<div class="qei-error"><strong>Unable to load this mapped response.</strong><p>${esc(e.message||e)}</p></div>`}finally{buttons.forEach(b=>b.disabled=false)}}

  function styles(){if(document.getElementById('qei-live-style'))return;const s=document.createElement('style');s.id='qei-live-style';s.textContent=`.qei-live{margin:18px 0 8px}.qei-label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#4c7637;margin-bottom:9px}.qei-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.qei-question{border:1px solid #cfdcd2;background:#fff;border-radius:12px;padding:16px 17px;text-align:left;color:#24452f;font-size:14px;font-weight:650;line-height:1.45;box-shadow:0 3px 12px rgba(3,76,31,.05)}.qei-question:hover,.qei-question:focus-visible,.qei-question.active{border-color:#4c7637;background:#f3f8f3;outline:none}.qei-question:disabled{cursor:wait;opacity:.78}.qei-result{margin-top:15px;border:1px solid #d7e3d9;border-radius:14px;background:#fff;overflow:hidden}.qei-processing{display:flex;gap:14px;align-items:center;padding:24px}.qei-processing i{width:28px;height:28px;flex:none;border:3px solid #dbe6dc;border-top-color:#4c7637;border-radius:50%;animation:qeiSpin .8s linear infinite}@keyframes qeiSpin{to{transform:rotate(360deg)}}.qei-processing strong{display:block;color:#034c1f;margin-bottom:5px}.qei-processing p{margin:0 0 4px;font-size:13px}.qei-processing span{font-size:11px;color:#718078}.qei-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:18px 20px;border-bottom:1px solid #e3ebe4;background:#f8fbf8}.qei-head small{display:block;color:#4c7637;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px}.qei-head h3{margin:0;color:#034c1f;font-size:15px;line-height:1.45}.qei-download{border:0;border-radius:8px;background:#034c1f;color:#fff;padding:10px 13px;font-weight:700;font-size:12px;white-space:nowrap}.qei-body{padding:20px;max-height:650px;overflow:auto;font-size:13px;line-height:1.58}.qei-body h2,.qei-body h3,.qei-body h4,.qei-body h5,.qei-body h6{color:#034c1f;margin:22px 0 9px}.qei-body p{margin:8px 0}.qei-body ul,.qei-body ol{padding-left:22px}.qei-table{overflow:auto;margin:12px 0;border:1px solid #dae5dc;border-radius:10px}.qei-body table{border-collapse:collapse;width:100%;min-width:980px;font-size:12px}.qei-body th,.qei-body td{padding:10px;vertical-align:top;text-align:left;border-bottom:1px solid #e3ebe4;border-right:1px solid #e8eee9}.qei-body th{position:sticky;top:0;background:#eef5ef;color:#034c1f;z-index:1}.qei-error{padding:20px;color:#7a2e2e}@media(max-width:800px){.qei-grid{grid-template-columns:1fr}.qei-head{flex-direction:column}.qei-download{width:100%}}`;document.head.appendChild(s)}

  function apply(){styles();const h=heading();if(!h)return;const r=root(h);if(!r)return;let w=document.getElementById('quest-enterprise-insights-override');if(!w){w=document.createElement('section');w.id='quest-enterprise-insights-override';w.className='qei-live';w.innerHTML='<div class="qei-label">Business questions</div><div class="qei-grid"></div><div class="qei-result" role="status" aria-live="polite" hidden></div>';h.insertAdjacentElement('afterend',w);const g=w.querySelector('.qei-grid'),p=w.querySelector('.qei-result');QUESTIONS.forEach((q,i)=>{const b=document.createElement('button');b.className='qei-question';b.type='button';b.dataset.id=q.id;b.innerHTML=`<span style="display:block;font-size:11px;color:#6d7d73;margin-bottom:5px">Question ${i+1}</span>${esc(q.question)}`;g.appendChild(b)});const bs=[...w.querySelectorAll('.qei-question')];bs.forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();const q=QUESTIONS.find(x=>x.id===b.dataset.id);run(q,bs,p)})}hideOld(r,w)}
  function boot(){apply();const o=new MutationObserver(m=>{if(m.some(x=>x.addedNodes?.length))requestAnimationFrame(apply)});o.observe(document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{const n=e.target.closest('.nav-item,[data-view]');if(n&&/insights/i.test(clean(n.textContent)+' '+clean(n.dataset?.view)))[0,120,400,900].forEach(t=>setTimeout(apply,t))},true);[250,700,1500,3000].forEach(t=>setTimeout(apply,t))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
