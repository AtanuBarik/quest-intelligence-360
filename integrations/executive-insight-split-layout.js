(() => {
  'use strict';

  const RELEASE = '20260809j';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let timer = 0;

  function homeView() {
    return $('.view[data-view="home"],.view[data-view="executive"],.view[data-view="hub"],.view[data-view="dashboard"],.view[data-view="my-hub"]');
  }

  function findPanel(view, pattern) {
    return $$('.panel,.flo-panel,.q-ui-card', view).find(node => pattern.test((node.textContent || '').replace(/\s+/g, ' ')));
  }

  function topChild(panel, node) {
    let current = node;
    while (current && current.parentElement && current.parentElement !== panel) current = current.parentElement;
    return current;
  }

  function injectStyles() {
    let style = $('#qExecutiveInsightSplitStyles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qExecutiveInsightSplitStyles';
      document.head.appendChild(style);
    }
    style.textContent = `
      #qExecutiveInsightPairFinal{
        display:flex!important;
        flex-direction:row!important;
        flex-wrap:nowrap!important;
        gap:16px!important;
        align-items:stretch!important;
        width:100%!important;
        max-width:none!important;
        grid-column:1/-1!important;
        clear:both!important;
      }
      #qExecutiveInsightPairFinal>.qeis-tile{
        flex:1 1 0!important;
        width:calc(50% - 8px)!important;
        max-width:calc(50% - 8px)!important;
        min-width:0!important;
        height:auto!important;
        margin:0!important;
        overflow:hidden!important;
        grid-column:auto!important;
        grid-row:auto!important;
      }
      .qeis-voice .qeis-voice-body{
        display:grid!important;
        grid-template-columns:minmax(0,1.04fr) minmax(250px,.96fr)!important;
        gap:15px!important;
        align-items:stretch!important;
        min-width:0!important;
      }
      .qeis-chart-column{
        min-width:0!important;
        min-height:265px!important;
        height:265px!important;
        position:relative!important;
        overflow:hidden!important;
        display:flex!important;
        align-items:stretch!important;
      }
      .qeis-chart-column>*{width:100%!important;max-width:100%!important;min-width:0!important}
      .qeis-chart-column canvas{display:block!important;width:100%!important;max-width:100%!important;height:265px!important;min-height:265px!important}
      .qeis-insight-column{min-width:0!important;border-left:1px solid #dce4dd!important;padding-left:14px!important}
      .qeis-insight-column .qef-voice-insights{margin:0!important;padding:0!important;border:0!important}
      .qeis-insight-column .qef-voice-insights h4{margin:0 0 9px!important;font-size:12px!important;color:#034c1f!important}
      .qeis-insight-column .qef-voice-insights ul{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;list-style:none!important;margin:0!important;padding:0!important;font-size:10px!important;line-height:1.5!important}
      .qeis-insight-column .qef-voice-insights li{position:relative!important;min-height:0!important;margin:0!important;padding:8px 8px 8px 18px!important;border:0!important;border-bottom:1px solid #edf1ed!important;border-radius:0!important;background:transparent!important}
      .qeis-insight-column .qef-voice-insights li:last-child{border-bottom:0!important}
      .qeis-insight-column .qef-voice-insights li::before{content:'';position:absolute;left:2px;top:14px;width:7px;height:7px;border-radius:50%;background:#c6d52f;box-shadow:0 0 0 3px rgba(198,213,47,.16)}

      .qeis-social{display:grid!important;grid-template-columns:minmax(250px,.92fr) minmax(0,1.08fr)!important;grid-template-rows:auto minmax(0,1fr) auto!important;column-gap:16px!important;align-content:start!important}
      .qeis-social>.qef-head{grid-column:1/-1!important;grid-row:1!important}
      .qeis-social>.qef-activity{grid-column:1!important;grid-row:2/4!important;align-self:start!important;min-width:0!important;padding-right:3px!important}
      .qeis-social>.qef-social-list{grid-column:2!important;grid-row:2!important;display:block!important;min-width:0!important;margin:0!important;padding:0 0 0 14px!important;border-top:0!important;border-left:1px solid #dce4dd!important}
      .qeis-social>.qef-social-list::before{content:'Key insights';display:block;margin:0 0 9px!important;color:#034c1f!important;font-size:12px!important;font-weight:700!important}
      .qeis-social .qef-social-item{position:relative!important;margin:0!important;padding:8px 4px 8px 18px!important;border:0!important;border-bottom:1px solid #edf1ed!important;border-radius:0!important;background:transparent!important;color:#505a54!important;font-size:10px!important;line-height:1.5!important}
      .qeis-social .qef-social-item:last-child{border-bottom:0!important}
      .qeis-social .qef-social-item::before{content:'';position:absolute;left:2px;top:14px;width:7px;height:7px;border-radius:50%;background:#c6d52f;box-shadow:0 0 0 3px rgba(198,213,47,.16)}
      .qeis-social>.qef-note{grid-column:2!important;grid-row:3!important;margin:8px 0 0 14px!important;padding-top:8px!important;border-top:1px solid #edf1ed!important;font-size:10px!important;line-height:1.45!important}
      .qeis-social .qef-head h3,.qeis-voice h3{font-size:17px!important}

      .qeis-donut-shell{display:grid!important;grid-template-columns:190px minmax(0,1fr)!important;gap:12px!important;align-items:center!important;min-height:250px!important;padding:4px 0!important}
      .qeis-donut{width:188px!important;height:188px!important;border-radius:50%!important;position:relative!important;margin:auto!important;box-shadow:inset 0 0 0 1px rgba(3,76,31,.08)!important}
      .qeis-donut::after{content:'';position:absolute;inset:43px;border-radius:50%;background:#fff;box-shadow:0 0 0 1px #edf1ed}
      .qeis-donut-center{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#034c1f;pointer-events:none}
      .qeis-donut-center strong{font-size:25px!important;line-height:1!important}.qeis-donut-center span{font-size:10px!important;margin-top:5px!important;color:#657069!important}
      .qeis-donut-legend{display:grid!important;gap:7px!important;min-width:0!important}
      .qeis-donut-key{display:grid!important;grid-template-columns:10px minmax(0,1fr) auto!important;gap:7px!important;align-items:center!important;font-size:10px!important;line-height:1.35!important;color:#4f5952!important}
      .qeis-donut-key i{width:9px!important;height:9px!important;border-radius:50%!important}.qeis-donut-key span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qeis-donut-key strong{color:#034c1f!important;font-size:10px!important}

      @media(max-width:1120px){
        .qeis-voice .qeis-voice-body,.qeis-social{grid-template-columns:1fr!important;grid-template-rows:auto!important}
        .qeis-insight-column{border-left:0!important;border-top:1px solid #dce4dd!important;padding:12px 0 0!important}
        .qeis-social>.qef-head,.qeis-social>.qef-activity,.qeis-social>.qef-social-list,.qeis-social>.qef-note{grid-column:1!important;grid-row:auto!important}
        .qeis-social>.qef-social-list{border-left:0!important;border-top:1px solid #dce4dd!important;padding:12px 0 0!important;margin-top:12px!important}
        .qeis-social>.qef-note{margin:8px 0 0!important}
        .qeis-donut-shell{grid-template-columns:175px minmax(0,1fr)!important}.qeis-donut{width:172px!important;height:172px!important}.qeis-donut::after{inset:39px}
      }
      @media(max-width:900px){
        #qExecutiveInsightPairFinal{flex-direction:column!important}
        #qExecutiveInsightPairFinal>.qeis-tile{width:100%!important;max-width:100%!important}
      }
      @media(max-width:560px){
        .qeis-donut-shell{grid-template-columns:1fr!important}.qeis-donut-legend{grid-template-columns:1fr 1fr!important}.qeis-chart-column{height:245px!important;min-height:245px!important}.qeis-chart-column canvas{height:245px!important;min-height:245px!important}
      }
    `;
  }

  function prepareVoice(panel) {
    panel.classList.add('qeis-tile', 'qeis-voice');
    if ($('.qeis-voice-body', panel)) return;
    const canvas = $('canvas', panel);
    const insights = $('.qef-voice-insights', panel);
    if (!canvas || !insights) return;
    const chartNode = topChild(panel, canvas) || canvas;
    const body = document.createElement('div');
    body.className = 'qeis-voice-body';
    const chartColumn = document.createElement('div');
    chartColumn.className = 'qeis-chart-column';
    const insightColumn = document.createElement('div');
    insightColumn.className = 'qeis-insight-column';
    chartColumn.appendChild(chartNode);
    insightColumn.appendChild(insights);
    body.append(chartColumn, insightColumn);
    panel.appendChild(body);
  }

  function donutFromActivity(activity) {
    if (!activity || $('.qeis-donut-shell', activity)) return;
    const rows = $$('.qef-bar-row', activity).map(row => {
      const parts = row.querySelectorAll('span,strong');
      const name = (parts[0]?.textContent || '').trim();
      const value = Number((row.querySelector('strong')?.textContent || '0').replace(/[^0-9.]/g, '')) || 0;
      return { name, value };
    }).filter(row => row.name);
    if (!rows.length) return;
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const colors = ['#034c1f','#35792a','#c6d52f','#00587c','#c78800'];
    let cursor = 0;
    const segments = rows.map((row, index) => {
      const start = cursor;
      const share = total > 0 ? row.value / total * 100 : 0;
      cursor += share;
      return `${colors[index % colors.length]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });
    if (cursor < 100) segments.push(`#edf1ed ${cursor.toFixed(2)}% 100%`);
    activity.innerHTML = `<div class="qeis-donut-shell"><div class="qeis-donut" role="img" aria-label="Distribution of ${total} current public activity records" style="background:conic-gradient(${segments.join(',')})"><div class="qeis-donut-center"><strong>${total}</strong><span>public updates</span></div></div><div class="qeis-donut-legend">${rows.map((row,index)=>`<div class="qeis-donut-key"><i style="background:${colors[index % colors.length]}"></i><span title="${row.name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}">${row.name}</span><strong>${row.value}</strong></div>`).join('')}</div></div>`;
  }

  function prepareSocial(panel) {
    panel.classList.add('qeis-tile', 'qeis-social');
    donutFromActivity($('.qef-activity', panel));
  }

  function apply() {
    const view = homeView();
    if (!view) return;
    injectStyles();
    const pair = $('#qExecutiveInsightPairFinal', view);
    const voice = findPanel(view, /VOICE OF EXPERTS|Top unmet needs/i);
    const social = findPanel(view, /PUBLIC & SOCIAL ACTIVITY|Company activity pulse|NEWS & SOCIAL|Market pulse/i);
    if (!pair || !voice || !social) return;
    pair.classList.add('qeis-pair');
    if (voice.parentElement !== pair) pair.appendChild(voice);
    if (social.parentElement !== pair) pair.appendChild(social);
    prepareVoice(voice);
    prepareSocial(social);
    document.documentElement.dataset.executiveInsightLayout = RELEASE;
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }

  function schedule(delay = 0) {
    clearTimeout(timer);
    timer = setTimeout(apply, delay);
  }

  function boot() {
    injectStyles();
    schedule(80);
    schedule(700);
    window.addEventListener('quest:layout-refresh', () => schedule(220));
    window.addEventListener('quest:executive-status-ready', () => schedule(160));
    window.addEventListener('hashchange', () => schedule(180));
    document.addEventListener('click', event => {
      if (event.target.closest?.('.nav-item,#floHomeRefresh')) schedule(1100);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
