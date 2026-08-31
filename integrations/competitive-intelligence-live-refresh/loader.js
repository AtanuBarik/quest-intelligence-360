(() => {
  'use strict';
  const RELEASE='20260831ci3';
  const parts=['chunk-00.b64','chunk-01.b64'];
  async function boot(){
    try{
      const base=new URL('.',document.currentScript.src);
      const responses=await Promise.all(parts.map(name=>fetch(new URL(`${name}?v=${RELEASE}`,base),{cache:'no-store'})));
      const failed=responses.find(response=>!response.ok);
      if(failed)throw new Error(`Unable to load competitive intelligence refresh (${failed.status})`);
      const encoded=(await Promise.all(responses.map(response=>response.text()))).join('').replace(/\s+/g,'');
      const binary=atob(encoded);const bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const source=await new Response(stream).text();
      const script=document.createElement('script');
      script.dataset.integration='competitive-intelligence-live-refresh';
      script.dataset.release=RELEASE;
      script.textContent=`${source}\n//# sourceURL=competitive-intelligence-live-refresh.js`;
      document.body.appendChild(script);
      document.documentElement.dataset.competitiveIntelligenceRelease=RELEASE;
    }catch(error){console.error('Competitive intelligence live refresh loader failed:',error);}
  }
  boot();
})();
