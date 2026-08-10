(() => {
  'use strict';

  const RELEASE = '20260810i';
  const LEGACY_URL = `data/social-intelligence.json?v=${RELEASE}`;
  let DATA = null;
  let mounted = false;

  const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const byId = id => document.getElementById(id);

  function injectStyles() {
    let style = byId('socialPerceptionLegacyVisualStyles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'socialPerceptionLegacyVisualStyles';
      document.head.appendChild(style);
    }
    style.textContent = `
      .spv-wrap{margin:12px 0;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}
      .spv-panel{background:#fff;border:1px solid #dce6de;border-radius:14px;padding:15px;box-shadow:0 5px 18px rgba(3,76,31,.035);min-width:0}
      .spv-7{grid-column:span 7}.spv-5{grid-column:span 5}.spv-12{grid-column:span 12}
      .spv-kicker{font:800 10px Arial;letter-spacing:1.15px;color:#35792a}.spv-panel h3{font-size:16px!important;color:#034c1f!important;margin:3px 0 4px!important}.spv-panel p{font-size:11.5px!important;line-height:1.5!important;color:#607168!important;margin:0 0 12px!important}
      .spv-note{padding:9px 10px;border-left:4px solid #c6d52f;background:#f8faf2;border-radius:8px;font-size:10.5px;line-height:1.45;color:#607168;margin-bottom:12px}
      .spv-svg{width:100%;height:260px;display:block}.spv-gridline{stroke:#e5ebe6;stroke-width:1}.spv-axis{font:10px Arial;fill:#657269}.spv-line{fill:none;stroke-width:2.7;stroke-linecap:round;stroke-linejoin:round}.spv-dot{stroke:#fff;stroke-width:1.5}.spv-legend{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}.spv-legend span{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;color:#536158}.spv-legend i{width:9px;height:9px;border-radius:50%;display:inline-block}
      .spv-donut-row{display:grid;grid-template-columns:170px 1fr;gap:18px;align-items:center}.spv-donut{width:160px;height:160px;border-radius:50%;position:relative}.spv-donut:after{content:'';position:absolute;inset:34px;border-radius:50%;background:#fff}.spv-donut-center{position:absolute;inset:0;z-index:2;display:grid;place-items:center;text-align:center;font-size:11px;font-weight:800;color:#034c1f;pointer-events:none}.spv-donut-center span{display:block;font-size:9px;color:#607168;font-weight:600}.spv-sentiment-list{display:grid;gap:9px}.spv-sentiment-item{display:grid;grid-template-columns:12px 1fr auto;gap:8px;align-items:center;font-size:11.5px;color:#415046}.spv-sentiment-item i{width:10px;height:10px;border-radius:50%}.spv-sentiment-item b{color:#034c1f}
      .spv-platforms{display:grid;gap:10px}.spv-platform-row{display:grid;grid-template-columns:180px 1fr;gap:10px;align-items:center}.spv-platform-label{display:flex;align-items:center;gap:8px;min-width:0}.spv-mark{width:30px;height:30px;border-radius:9px;background:#edf5e9;color:#034c1f;display:grid;place-items:center;font-size:10px;font-weight:900;flex:0 0 30px}.spv-platform-label b{font-size:11.5px;color:#26332c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.spv-stack{height:18px;border-radius:999px;overflow:hidden;background:#edf1ed;display:flex}.spv-stack span{height:100%}.spv-platform-key{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.spv-platform-key span{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:#607168}.spv-platform-key i{width:8px;height:8px;border-radius:2px;display:inline-block}
      @media(max-width:1100px){.spv-7,.spv-5{grid-column:span 12}}@media(max-width:700px){.spv-donut-row{grid-template-columns:1fr}.spv-platform-row{grid-template-columns:1fr}.spv-svg{height:230px}}
    `;
  }

  function lineChart(companies) {
    const rows = companies.filter(item => Array.isArray(item.weekly) && item.weekly.length);
    const colors = ['#35792a','#034c1f','#c6d52f','#00587c','#c78800'];
    const width = 760, height = 250, padL = 38, padR = 16, padT = 18, padB = 32;
    const values = rows.flatMap(item => item.weekly.map(Number));
    const min = Math.min(...values, 0), max = Math.max(...values, 1);
    const x = i => padL + (i * (width - padL - padR) / 11);
    const y = value => padT + ((max - value) * (height - padT - padB) / Math.max(1, max - min));
    const grid = [0,.25,.5,.75,1].map(r => {
      const yy = padT + r * (height-padT-padB);
      const val = Math.round(max - r*(max-min));
      return `<line class="spv-gridline" x1="${padL}" y1="${yy}" x2="${width-padR}" y2="${yy}"></line><text class="spv-axis" x="3" y="${yy+3}">${val}</text>`;
    }).join('');
    const weekLabels = Array.from({length:12},(_,i) => `<text class="spv-axis" x="${x(i)}" y="${height-8}" text-anchor="middle">W${i+1}</text>`).join('');
    const lines = rows.map((item,index) => {
      const c = colors[index % colors.length];
      const points = item.weekly.map((v,i) => `${x(i)},${y(Number(v))}`).join(' ');
      const dots = item.weekly.map((v,i) => `<circle class="spv-dot" cx="${x(i)}" cy="${y(Number(v))}" r="3" fill="${c}"></circle>`).join('');
      return `<polyline class="spv-line" points="${points}" stroke="${c}"></polyline>${dots}`;
    }).join('');
    const legend = rows.map((item,index) => `<span><i style="background:${colors[index%colors.length]}"></i>${esc(item.name)}</span>`).join('');
    return `<svg class="spv-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Illustrative weekly competitive conversation trend">${grid}${weekLabels}${lines}</svg><div class="spv-legend">${legend}</div>`;
  }

  function sentiment(company) {
    const mix = company?.sentiment_mix || {positive:54,neutral:33,negative:13};
    const pos = Number(mix.positive || 0), neu = Number(mix.neutral || 0), neg = Number(mix.negative || 0);
    const stop1 = pos, stop2 = pos + neu;
    return `<div class="spv-donut-row"><div style="position:relative;width:160px"><div class="spv-donut" style="background:conic-gradient(#35792a 0 ${stop1}%,#9aa7a0 ${stop1}% ${stop2}%,#c78800 ${stop2}% 100%)"></div><div class="spv-donut-center">${pos-neg>=0?'+':''}${pos-neg}<span>net directional sentiment</span></div></div><div class="spv-sentiment-list"><div class="spv-sentiment-item"><i style="background:#35792a"></i><span>Positive</span><b>${pos}%</b></div><div class="spv-sentiment-item"><i style="background:#9aa7a0"></i><span>Neutral</span><b>${neu}%</b></div><div class="spv-sentiment-item"><i style="background:#c78800"></i><span>Negative</span><b>${neg}%</b></div></div></div>`;
  }

  function platformMix(companies) {
    const colors = {LinkedIn:'#35792a',X:'#00587c',Facebook:'#c6d52f',YouTube:'#c78800',Instagram:'#80276c'};
    const rows = companies.map(item => {
      const p = item.platforms || {};
      const segments = Object.entries(colors).map(([platform,color]) => `<span title="${platform}: ${Number(p[platform]||0)}%" style="width:${Number(p[platform]||0)}%;background:${color}"></span>`).join('');
      return `<div class="spv-platform-row"><div class="spv-platform-label"><span class="spv-mark">${esc((item.name||'?').split(/\s+/).map(x=>x[0]).join('').slice(0,2))}</span><b>${esc(item.name)}</b></div><div class="spv-stack">${segments}</div></div>`;
    }).join('');
    const key = Object.entries(colors).map(([platform,color]) => `<span><i style="background:${color}"></i>${platform}</span>`).join('');
    return `<div class="spv-platforms">${rows}</div><div class="spv-platform-key">${key}</div>`;
  }

  function render() {
    const view = document.querySelector('.view[data-view="social"]');
    if (!view || !DATA || view.querySelector('#spLegacyVisuals')) return;
    const anchor = view.querySelector('.sp2-platform-grid') || view.querySelector('.sp2-kpis');
    if (!anchor) return;
    const companies = (DATA.companies || []).slice(0,5);
    const quest = companies.find(item => item.name === 'Quest Diagnostics') || companies[0];
    anchor.insertAdjacentHTML('afterend', `<section class="spv-wrap" id="spLegacyVisuals">
      <article class="spv-panel spv-7"><span class="spv-kicker">DIRECTIONAL TREND</span><h3>Competitive conversation momentum</h3><p>Restored from the previous Social Perception view for visual continuity.</p><div class="spv-note"><b>Illustrative baseline:</b> weekly values come from the earlier connector-ready prototype dataset and are retained as directional reference only. They are not live social-listening measurements.</div>${lineChart(companies)}</article>
      <article class="spv-panel spv-5"><span class="spv-kicker">PERCEPTION MIX</span><h3>Quest sentiment composition</h3><p>Restored from the prior dashboard as an illustrative reference view.</p><div class="spv-note">This composition is from the previous illustrative baseline, not current API-derived sentiment.</div>${sentiment(quest)}</article>
      <article class="spv-panel spv-12"><span class="spv-kicker">PLATFORM MIX</span><h3>Where the original monitored peer set was active</h3><p>Cross-platform composition retained from the previous dashboard. Current connector availability is shown separately above.</p>${platformMix(companies)}</article>
    </section>`);
  }

  async function boot() {
    if (mounted) return;
    mounted = true;
    injectStyles();
    try {
      const response = await fetch(LEGACY_URL, {cache:'no-store'});
      if (!response.ok) throw new Error(`Legacy social baseline returned ${response.status}`);
      DATA = await response.json();
    } catch (error) {
      console.warn('Legacy Social Perception visuals unavailable:', error);
      return;
    }
    render();
    [200,500,1000,1800].forEach(delay => setTimeout(render, delay));
    window.addEventListener('quest:module-loaded', () => setTimeout(render, 80));
    window.addEventListener('quest:layout-refresh', () => setTimeout(render, 80));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
