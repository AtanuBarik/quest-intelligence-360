(() => {
  'use strict';
  const RELEASE='20260901stable1';
  const parts=['chunk-00.b64','chunk-01.b64'];
  async function boot(){
    try{
      if(document.documentElement.dataset.competitiveStableLoaded===RELEASE)return;
      const base=new URL('.',document.currentScript.src);
      const responses=await Promise.all(parts.map(name=>fetch(new URL(`${name}?v=${RELEASE}`,base),{cache:'no-store'})));
      const failed=responses.find(response=>!response.ok);if(failed)throw new Error(`Unable to load competitive intelligence refresh (${failed.status})`);
      const encoded=(await Promise.all(responses.map(response=>response.text()))).join('').replace(/\s+/g,'');
      const binary=atob(encoded),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));const source=await new Response(stream).text();
      const observerShim="class QStableMutationObserver{constructor(){}observe(){}disconnect(){}takeRecords(){return[]}};\n";
      const stableSource=observerShim+source.replace(/\bMutationObserver\b/g,'QStableMutationObserver');
      const script=document.createElement('script');script.dataset.integration='competitive-intelligence-live-refresh';script.dataset.release=RELEASE;script.textContent=`${stableSource}\n//# sourceURL=competitive-intelligence-live-refresh.js`;document.body.appendChild(script);
      document.documentElement.dataset.competitiveStableLoaded=RELEASE;document.documentElement.dataset.competitiveIntelligenceRelease=RELEASE;
    }catch(error){console.error('Competitive intelligence live refresh loader failed:',error)}
  }
  boot();
})();