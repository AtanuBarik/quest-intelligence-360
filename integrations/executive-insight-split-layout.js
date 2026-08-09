(() => {
  'use strict';

  const RELEASE = '20260809m';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let observer = null;
  let timer = 0;

  const COLORS = ['#034c1f', '#35792a', '#c6d52f', '#00587c', '#c78800'];

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
      /* Stable visual system for the Executive Hub. All changes below are CSS/attribute based
         so the live Executive renderer's child-list observer is not retriggered by this module. */
      .view[data-view="home"]{
        --qeis-green:#034c1f;
        --qeis-mid:#35792a;
        --qeis-lime:#c6d52f;
        --qeis-blue:#00587c;
        --qeis-gold:#c78800;
        --qeis-line:#d9e5da;
        --qeis-soft:#f7faf6;
        --qeis-shadow:0 8px 24px rgba(3,76,31,.075);
      }

      .view[data-view="home"] :is(.panel,.flo-panel,.q-ui-card){
        border:1px solid var(--qeis-line)!important;
        border-radius:14px!important;
        background:linear-gradient(180deg,#fff 0%,#fbfdfb 100%)!important;
        box-shadow:var(--qeis-shadow)!important;
      }
      .view[data-view="home"] :is(.kpi-card,.flo-status-card,.qef-mini,.qef-signal,.qef-company-card){
        border:1px solid #dce6dd!important;
        background:linear-gradient(180deg,#fff 0%,#f8fbf7 100%)!important;
        box-shadow:0 4px 12px rgba(3,76,31,.045)!important;
      }
      .view[data-view="home"] .kpi-card{
        border-top-width:3px!important;
        border-top-color:var(--qeis-mid)!important;
      }
      .view[data-view="home"] .kpi-card:nth-child(2n){border-top-color:var(--qeis-lime)!important}
      .view[data-view="home"] .kpi-card:nth-child(3n){border-top-color:var(--qeis-blue)!important}
      .view[data-view="home"] .flo-status-card{border-radius:10px!important}
      .view[data-view="home"] .qef-signal{border-left:4px solid var(--qeis-lime)!important}
      .view[data-view="home"] .qef-project{padding:12px!important;margin:8px 0!important;border:1px solid #e1e9e2!important;border-radius:10px!important;background:#fff!important}
      .view[data-view="home"] .qef-progress{height:9px!important}
      .view[data-view="home"] .qef-chip,.view[data-view="home"] .qef-tag,.view[data-view="home"] .qef-status{
        border:1px solid #dce7d7!important;
        box-shadow:0 2px 6px rgba(3,76,31,.035)!important;
      }

      #qExecutiveInsightPairFinal{
        display:flex!important;
        flex-direction:row!important;
        flex-wrap:nowrap!important;
        gap:18px!important;
        align-items:stretch!important;
        width:100%!important;
        max-width:none!important;
        grid-column:1/-1!important;
        clear:both!important;
      }
      #qExecutiveInsightPairFinal>.qeis-tile{
        flex:1 1 0!important;
        width:calc(50% - 9px)!important;
        max-width:calc(50% - 9px)!important;
        min-width:0!important;
        margin:0!important;
        overflow:hidden!important;
        position:relative!important;
      }
      #qExecutiveInsightPairFinal>.qeis-tile::after{
        content:'';
        position:absolute;
        inset:0 auto auto 0;
        width:100%;
        height:3px;
        background:linear-gradient(90deg,var(--qeis-green),var(--qeis-lime));
        pointer-events:none;
      }

      .qeis-visual-panel .qef-kicker,
      .qeis-visual-panel > :first-child :is(.eyebrow,.kicker){display:flex!important;align-items:center!important;gap:7px!important}
      .qeis-visual-panel .qef-kicker::before{
        display:inline-grid;
        place-items:center;
        width:25px;
        height:25px;
        border-radius:8px;
        background:#edf4e9;
        border:1px solid #dce8d8;
        color:var(--qeis-green);
        font-size:14px;
        font-weight:800;
      }
      .qeis-signal .qef-kicker::before{content:'⚡'}
      .qeis-actions .qef-kicker::before{content:'↗'}
      .qeis-social .qef-kicker::before{content:'◎'}
      .qeis-benchmark .qef-kicker::before{content:'◉'}

      /* Voice of Experts: chart left, executive takeaways right. */
      .qeis-voice{
        display:grid!important;
        grid-template-columns:minmax(0,1.05fr) minmax(260px,.95fr)!important;
        column-gap:18px!important;
        align-content:start!important;
      }
      .qeis-voice>.qeis-wide{grid-column:1/-1!important}
      .qeis-voice>.qeis-chart-column{
        grid-column:1!important;
        min-width:0!important;
        min-height:300px!important;
        height:300px!important;
        padding:8px 4px 4px!important;
        border-radius:10px!important;
        background:linear-gradient(180deg,#fbfdfb,#f5f9f3)!important;
        border:1px solid #e1e9e2!important;
      }
      .qeis-voice>.qeis-chart-column canvas{
        width:100%!important;
        height:100%!important;
        min-height:280px!important;
        display:block!important;
      }
      .qeis-voice>.qef-voice-insights{
        grid-column:2!important;
        margin:0!important;
        padding:8px 0 0 16px!important;
        border-top:0!important;
        border-left:1px solid #dfe7e0!important;
      }
      .qeis-voice .qef-voice-insights ul{display:grid!important;grid-template-columns:1fr!important;gap:9px!important}
      .qeis-voice .qef-voice-insights li{
        margin:0!important;
        padding:11px 12px 11px 30px!important;
        border:1px solid #e1e9e2!important;
        border-radius:9px!important;
        background:linear-gradient(135deg,#fff,#f7faf5)!important;
        position:relative!important;
      }
      .qeis-voice .qef-voice-insights li::before{
        content:'✓';
        position:absolute;
        left:10px;
        top:11px;
        width:14px;
        height:14px;
        border-radius:50%;
        display:grid;
        place-items:center;
        color:#fff;
        background:var(--qeis-mid);
        font-size:9px;
        font-weight:800;
      }

      /* Public & Social: stable CSS donut. The existing live rows become the legend;
         no children are removed/recreated, eliminating the previous flicker loop. */
      .qeis-social{
        display:grid!important;
        grid-template-columns:minmax(270px,.92fr) minmax(0,1.08fr)!important;
        grid-template-rows:auto minmax(0,1fr) auto!important;
        column-gap:18px!important;
        align-content:start!important;
      }
      .qeis-social>.qef-head{grid-column:1/-1!important;grid-row:1!important}
      .qeis-social>.qef-activity{
        grid-column:1!important;
        grid-row:2/4!important;
        min-width:0!important;
        min-height:305px!important;
        position:relative!important;
        display:grid!important;
        gap:7px!important;
        align-content:end!important;
        padding:188px 10px 8px!important;
        border-radius:10px!important;
        background:linear-gradient(180deg,#fbfdfb,#f5f9f3)!important;
        border:1px solid #e1e9e2!important;
      }
      .qeis-social>.qef-activity::before{
        content:'';
        position:absolute;
        width:158px;
        height:158px;
        left:50%;
        top:18px;
        transform:translateX(-50%);
        border-radius:50%;
        background:var(--qeis-donut-bg,conic-gradient(#dce5dc 0 100%));
        box-shadow:0 8px 22px rgba(3,76,31,.10),inset 0 0 0 1px rgba(3,76,31,.08);
      }
      .qeis-social>.qef-activity::after{
        content:attr(data-qeis-total) '\A updates';
        white-space:pre;
        position:absolute;
        width:92px;
        height:92px;
        left:50%;
        top:51px;
        transform:translateX(-50%);
        display:grid;
        place-items:center;
        text-align:center;
        border-radius:50%;
        background:#fff;
        color:var(--qeis-green);
        box-shadow:0 0 0 1px #e4ebe4;
        font-size:13px;
        line-height:1.25;
        font-weight:800;
      }
      .qeis-social .qef-bar-row{
        display:grid!important;
        grid-template-columns:12px minmax(0,1fr) auto!important;
        gap:8px!important;
        align-items:center!important;
        min-width:0!important;
        padding:4px 2px!important;
      }
      .qeis-social .qef-bar-row>span:first-child{
        grid-column:2!important;
        grid-row:1!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
      }
      .qeis-social .qef-bar-row>.qef-track{
        grid-column:1!important;
        grid-row:1!important;
        width:10px!important;
        height:10px!important;
        border-radius:50%!important;
        background:var(--qeis-color,#35792a)!important;
        overflow:hidden!important;
      }
      .qeis-social .qef-bar-row>.qef-track i{display:none!important}
      .qeis-social .qef-bar-row>strong{grid-column:3!important;grid-row:1!important;color:var(--qeis-green)!important}
      .qeis-social>.qef-social-list{
        grid-column:2!important;
        grid-row:2!important;
        display:grid!important;
        grid-template-columns:1fr!important;
        gap:9px!important;
        min-width:0!important;
        margin:0!important;
        padding:0 0 0 16px!important;
        border-top:0!important;
        border-left:1px solid #dfe7e0!important;
      }
      .qeis-social>.qef-social-list::before{
        content:'Key insights';
        display:block;
        color:var(--qeis-green);
        font-size:14px!important;
        font-weight:800!important;
        margin:0 0 2px!important;
      }
      .qeis-social .qef-social-item{
        margin:0!important;
        padding:11px 12px 11px 31px!important;
        border:1px solid #e1e9e2!important;
        border-radius:9px!important;
        background:linear-gradient(135deg,#fff,#f7faf5)!important;
        position:relative!important;
      }
      .qeis-social .qef-social-item::before{
        content:'✦';
        position:absolute;
        left:10px;
        top:11px;
        color:var(--qeis-mid);
        font-size:13px;
        font-weight:800;
      }
      .qeis-social>.qef-note{grid-column:2!important;grid-row:3!important;margin:8px 0 0 16px!important;padding-top:8px!important;border-top:1px solid #e5ebe6!important}

      /* Section-specific accenting without adding DOM nodes. */
      .qeis-signal{border-top:3px solid var(--qeis-blue)!important}
      .qeis-actions{border-top:3px solid var(--qeis-mid)!important}
      .qeis-benchmark{border-top:3px solid var(--qeis-green)!important}
      .qeis-benchmark .qef-bubble-wrap{box-shadow:inset 0 0 0 1px #e4ebe4,0 8px 22px rgba(3,76,31,.045)!important}

      @media(max-width:1180px){
        .qeis-voice,.qeis-social{grid-template-columns:1fr!important;grid-template-rows:auto!important}
        .qeis-voice>.qeis-wide,.qeis-voice>.qeis-chart-column,.qeis-voice>.qef-voice-insights,
        .qeis-social>.qef-head,.qeis-social>.qef-activity,.qeis-social>.qef-social-list,.qeis-social>.qef-note{grid-column:1!important;grid-row:auto!important}
        .qeis-voice>.qef-voice-insights,.qeis-social>.qef-social-list{border-left:0!important;border-top:1px solid #dfe7e0!important;padding:14px 0 0!important;margin-top:12px!important}
        .qeis-social>.qef-note{margin-left:0!important}
      }
      @media(max-width:920px){
        #qExecutiveInsightPairFinal{flex-direction:column!important}
        #qExecutiveInsightPairFinal>.qeis-tile{width:100%!important;max-width:100%!important}
      }
    `;
  }

  function chartInstance(canvas) {
    if (!canvas || !window.Chart?.instances) return null;
    return Object.values(window.Chart.instances).find(instance => instance?.canvas === canvas) || null;
  }

  function colorAt(value, index, fallback) {
    if (Array.isArray(value)) return value[index % value.length] || fallback;
    return value || fallback;
  }

  function makeVoiceHorizontal(panel) {
    const canvas = $('canvas', panel);
    const chart = chartInstance(canvas);
    if (!chart || chart.__qeisHorizontal) return;

    chart.config.type = 'bar';
    chart.options = chart.options || {};
    chart.options.indexAxis = 'y';
    chart.options.animation = false;
    chart.options.plugins = chart.options.plugins || {};
    chart.options.plugins.legend = { ...(chart.options.plugins.legend || {}), display:false };

    chart.draw = function() {
      if (!this.canvas?.isConnected) return;
      const { w, h } = this._size();
      const ctx = this.ctx;
      const labels = this.data?.labels || [];
      const data = (this.data?.datasets?.[0]?.data || []).map(value => Number(value) || 0);
      const dataset = this.data?.datasets?.[0] || {};
      const max = Math.max(100, ...data, 1);
      ctx.clearRect(0, 0, w, h);
      if (!labels.length) return;

      const left = 12;
      const right = 36;
      const top = 8;
      const row = Math.max(44, (h - top * 2) / labels.length);
      const barH = Math.min(16, Math.max(10, row * .28));
      const usable = w - left - right;

      labels.forEach((label, index) => {
        const value = data[index] || 0;
        const y = top + row * index;
        const color = colorAt(dataset.backgroundColor, index, COLORS[index % COLORS.length]);

        ctx.save();
        ctx.font = '600 12px Arial, Helvetica, sans-serif';
        ctx.fillStyle = '#34463b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        let text = String(label || '');
        while (text.length > 3 && ctx.measureText(text).width > usable - 44) text = text.slice(0, -1);
        if (text !== String(label || '')) text += '…';
        ctx.fillText(text, left, y + 2);

        ctx.font = '700 12px Arial, Helvetica, sans-serif';
        ctx.fillStyle = '#034c1f';
        ctx.textAlign = 'right';
        ctx.fillText(String(Math.round(value)), w - 10, y + 2);

        const by = y + 23;
        ctx.fillStyle = '#e7ede8';
        ctx.beginPath();
        ctx.roundRect(left, by, usable, barH, 6);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(left, by, Math.max(3, usable * value / max), barH, 6);
        ctx.fill();
        ctx.restore();
      });
    };

    chart.__qeisHorizontal = true;
    chart.draw();
  }

  function prepareVoice(panel) {
    panel.classList.add('qeis-tile', 'qeis-voice', 'qeis-visual-panel');
    const canvas = $('canvas', panel);
    const insights = $('.qef-voice-insights', panel);
    if (!canvas || !insights) return;

    const chartNode = topChild(panel, canvas) || canvas;
    chartNode.classList.add('qeis-chart-column');
    insights.classList.add('qeis-insight-column');
    Array.from(panel.children).forEach(child => {
      if (child !== chartNode && child !== insights) child.classList.add('qeis-wide');
    });
    makeVoiceHorizontal(panel);
  }

  function applyDonut(panel) {
    panel.classList.add('qeis-tile', 'qeis-social', 'qeis-visual-panel');
    const activity = $('.qef-activity', panel);
    if (!activity) return;

    const rows = $$('.qef-bar-row', activity).map((row, index) => {
      const name = (row.querySelector('span')?.textContent || '').trim();
      const value = Number((row.querySelector('strong')?.textContent || '0').replace(/[^0-9.]/g, '')) || 0;
      const color = COLORS[index % COLORS.length];
      row.style.setProperty('--qeis-color', color);
      return { name, value, color };
    }).filter(row => row.name);
    if (!rows.length) return;

    const total = rows.reduce((sum, row) => sum + row.value, 0);
    let cursor = 0;
    const segments = rows.map(row => {
      const start = cursor;
      cursor += total > 0 ? row.value / total * 100 : 0;
      return `${row.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });
    if (cursor < 100) segments.push(`#e5ebe5 ${cursor.toFixed(2)}% 100%`);

    activity.style.setProperty('--qeis-donut-bg', `conic-gradient(${segments.join(',')})`);
    activity.setAttribute('data-qeis-total', String(total));
    activity.setAttribute('aria-label', `Public and social activity distribution, ${total} current public updates`);
  }

  function classifyPanels(view) {
    const signal = findPanel(view, /SIGNAL MONITOR|What changed/i);
    const actions = $('#qExecutiveActions', view) || findPanel(view, /PMR DELIVERY & EXECUTIVE ACTIONS|Project progress and next actions/i);
    const benchmark = $('#qExecutiveDecisionMap', view) || findPanel(view, /EXECUTIVE COMPETITIVE BENCHMARK/i);
    signal?.classList.add('qeis-signal', 'qeis-visual-panel');
    actions?.classList.add('qeis-actions', 'qeis-visual-panel');
    benchmark?.classList.add('qeis-benchmark', 'qeis-visual-panel');
  }

  function apply() {
    const view = homeView();
    if (!view) return;
    injectStyles();
    classifyPanels(view);

    const pair = $('#qExecutiveInsightPairFinal', view);
    const voice = findPanel(view, /VOICE OF EXPERTS|Top unmet needs/i);
    const social = findPanel(view, /PUBLIC & SOCIAL ACTIVITY|Company activity pulse|NEWS & SOCIAL|Market pulse/i);
    if (pair && voice && social) {
      prepareVoice(voice);
      applyDonut(social);
    }

    document.documentElement.dataset.executiveInsightLayout = RELEASE;
  }

  function schedule(delay = 0) {
    clearTimeout(timer);
    timer = setTimeout(apply, delay);
  }

  function watch() {
    const view = homeView();
    if (!view) return;
    observer?.disconnect();
    observer = new MutationObserver(mutations => {
      // Watch only for the base renderer replacing child content. This module itself changes
      // classes/styles/canvas drawing, none of which are child-list mutations.
      if (mutations.some(mutation => mutation.type === 'childList')) schedule(60);
    });
    observer.observe(view, { childList:true, subtree:true });
  }

  function boot() {
    injectStyles();
    schedule(80);
    schedule(650);
    watch();
    window.addEventListener('quest:layout-refresh', () => schedule(120));
    window.addEventListener('quest:executive-status-ready', () => schedule(120));
    window.addEventListener('hashchange', () => { schedule(160); setTimeout(watch, 200); });
    document.addEventListener('click', event => {
      if (event.target.closest?.('.nav-item,#floHomeRefresh,[data-qef-refresh]')) schedule(900);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
