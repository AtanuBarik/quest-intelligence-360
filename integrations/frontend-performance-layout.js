(() => {
  'use strict';

  const RELEASE = '20260806i';
  const ACCENTS = ['green', 'blue', 'purple', 'orange', 'lime'];
  let refreshTimer = 0;

  function installStyles() {
    if (document.getElementById('questFrontendPolish')) return;
    const style = document.createElement('style');
    style.id = 'questFrontendPolish';
    style.textContent = `
      :root{--q-dark:#034c1f;--q-green:#35792a;--q-lime:#c6d52f;--q-blue:#024c6a;--q-purple:#80276c;--q-orange:#c78800;--q-text:#4f5552;--q-muted:#6d746f;--q-border:#d7e0d8;--q-border-strong:#becabd;--q-canvas:#f3f6f3;--q-card:#fff;--q-green-soft:#eef5ea;--q-blue-soft:#eaf3f7;--q-purple-soft:#f4ebf2;--q-orange-soft:#fbf1df;--q-lime-soft:#f6f8df;--q-shadow:0 4px 14px rgba(3,76,31,.05);--q-radius:10px}
      *{box-sizing:border-box}html{background:var(--q-canvas);text-rendering:optimizeLegibility}body,button,input,select,textarea,table{font-family:Arial,Helvetica,sans-serif!important}body{background:var(--q-canvas)!important;color:var(--q-text)!important;font-size:14px!important;line-height:1.48!important}
      h1{color:var(--q-green)!important;font-size:clamp(28px,2vw,34px)!important;line-height:1.12!important;font-weight:600!important}h2{color:var(--q-green)!important;font-size:21px!important;font-weight:700!important}h3{color:var(--q-dark)!important;font-size:16px!important;font-weight:700!important}h4{color:var(--q-dark)!important;font-size:14px!important;font-weight:700!important}strong,b{font-weight:700!important}.section-kicker{color:var(--q-green)!important;font-size:11px!important;font-weight:700!important;letter-spacing:1.15px!important}
      .app-shell,.app,.main,.main-content,.content-area{background:var(--q-canvas)!important}.view{width:100%;max-width:1700px;margin:0 auto;padding:22px 24px 36px!important}.page-heading{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:18px!important;flex-wrap:wrap!important;margin-bottom:16px!important;padding-bottom:14px;border-bottom:1px solid var(--q-border)}.page-heading>div:first-child{min-width:280px;max-width:980px}.page-heading p{max-width:980px;margin-top:5px!important;font-size:14px!important;line-height:1.55!important}.heading-actions{display:flex!important;gap:8px!important;flex-wrap:wrap!important;margin-left:auto!important}.heading-actions button{width:auto!important;max-width:190px!important;min-width:0!important;white-space:normal!important}
      .panel,.card,.kpi-card,.metric-card,.si-panel,.si-kpi,.live-kpi,.live-news-card,.cp-card,[class*="profile-card"],.weekly-summary-section,.tracker-callout{background:var(--q-card)!important;border:1px solid var(--q-border)!important;border-radius:var(--q-radius)!important;box-shadow:var(--q-shadow)!important}.q-ui-card{position:relative!important;overflow:hidden!important}.q-ui-card:after{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--q-green);pointer-events:none}.q-ui-card[data-q-accent="blue"]:after{background:var(--q-blue)}.q-ui-card[data-q-accent="purple"]:after{background:var(--q-purple)}.q-ui-card[data-q-accent="orange"]:after{background:var(--q-orange)}.q-ui-card[data-q-accent="lime"]:after{background:var(--q-lime)}.panel,.si-panel{padding:16px!important}.panel-head,.si-head{padding-bottom:10px!important;margin-bottom:12px!important;border-bottom:1px solid var(--q-border)!important}
      .kpi-grid,.metric-grid,.si-kpis,.live-kpi-grid,[class*="kpi-grid"]{gap:10px!important;align-items:stretch!important}.kpi-card,.metric-card,.si-kpi,.live-kpi{min-height:104px!important;padding:15px 16px!important}.kpi-card span,.metric-card span,.si-kpi span,.live-kpi span{font-size:11px!important;font-weight:700!important;color:var(--q-muted)!important}.kpi-card strong,.metric-card strong,.si-kpi strong,.live-kpi strong{font-size:27px!important;line-height:1.05!important;color:var(--q-dark)!important;margin:6px 0!important}.kpi-card small,.metric-card small,.si-kpi small,.live-kpi small{font-size:11px!important;line-height:1.4!important}
      button,.button,.primary-button,.secondary-button,.btn-primary,.btn-secondary,.text-button{min-height:38px!important;height:auto!important;border-radius:7px!important;padding:8px 13px!important;font-size:13px!important;line-height:1.25!important;font-weight:700!important;box-shadow:none!important}.primary-button,.btn-primary,button.primary{background:var(--q-dark)!important;border:1px solid var(--q-dark)!important;color:#fff!important}.secondary-button,.btn-secondary{background:#fff!important;border:1px solid var(--q-border-strong)!important;color:var(--q-dark)!important}.q-ui-compact-preview{width:auto!important;min-width:0!important;max-width:120px!important;min-height:32px!important;padding:6px 10px!important;font-size:12px!important}
      input,select,textarea{min-height:38px!important;border:1px solid var(--q-border-strong)!important;border-radius:7px!important;background:#fff!important;color:var(--q-text)!important;font-size:13px!important;padding:8px 10px!important}input:focus,select:focus,textarea:focus{outline:3px solid rgba(198,213,47,.25)!important;border-color:var(--q-green)!important}
      .filter-bar,.filters,.si-filters,.live-filter-bar,[class*="filter-bar"],[data-role="filters"]{position:static!important;display:grid!important;grid-template-columns:minmax(260px,2fr) repeat(3,minmax(145px,1fr)) auto!important;gap:8px!important;align-items:center!important;margin:12px 0 15px!important;padding:11px!important;background:#fff!important;border:1px solid var(--q-border)!important;border-left:4px solid var(--q-green)!important;border-radius:var(--q-radius)!important;box-shadow:none!important}.live-filter-bar{grid-template-columns:minmax(250px,2fr) repeat(4,minmax(130px,1fr)) auto auto!important}.q-filter-top{order:-10!important;width:100%!important;max-width:none!important;right:auto!important;left:auto!important}
      .si-chart,.live-chart,.chart-wrap{min-height:250px!important;max-height:390px!important}.si-chart.tall{height:330px!important}canvas{max-width:100%!important}.q-chart-panel{overflow:hidden!important}
      .status,.tag,.pill,.chip,.si-tag,.live-chip,.tracker-pill,[class*="badge"]{border-radius:5px!important;font-size:10px!important;font-weight:700!important;padding:4px 7px!important}.si-tag,.live-chip{background:var(--q-green-soft)!important;color:var(--q-dark)!important}.si-tag.blue,.live-chip.blue{background:var(--q-blue-soft)!important;color:var(--q-blue)!important}.si-tag.pink,.live-chip.red{background:var(--q-purple-soft)!important;color:var(--q-purple)!important}.si-tag.gold,.live-chip.gold{background:var(--q-orange-soft)!important;color:#805600!important}
      .si-item,.si-road-card,.si-road-col,.live-summary,.tracker-callout,[class*="callout"]{border:1px solid var(--q-border)!important;border-radius:8px!important;background:#fff!important}.si-road-card{border-left:4px solid var(--q-green)!important}.live-news-card{border-left:4px solid var(--q-green)!important}.live-news-card.priority-high{border-left-color:var(--q-purple)!important}.live-news-card.priority-medium{border-left-color:var(--q-orange)!important}.live-news-card,.si-news-card,.si-item,.si-road-card{content-visibility:auto;contain-intrinsic-size:180px}
      .si-table-wrap,.table-wrap,[class*="table-wrap"]{overflow:auto!important;border:1px solid var(--q-border)!important;border-radius:8px!important;background:#fff!important}table{width:100%;border-collapse:separate!important;border-spacing:0!important;font-size:12px!important}th{position:sticky;top:0;z-index:1;background:var(--q-dark)!important;color:#fff!important;font-size:11px!important;font-weight:700!important;padding:10px!important}td{padding:10px!important;background:#fff!important;border-color:#e5ebe6!important;vertical-align:top!important}tbody tr:nth-child(even) td{background:#f8faf8!important}
      .live-ai-panel,.q-chat-panel{right:18px!important;width:min(560px,calc(100vw - 32px))!important;border:1px solid var(--q-border-strong)!important;border-radius:10px!important;box-shadow:0 20px 55px rgba(3,76,31,.22)!important}.q-chat-filter{order:-5!important;display:flex!important;justify-content:flex-start!important;gap:7px!important;flex-wrap:wrap!important;width:100%!important;max-width:none!important;position:static!important;right:auto!important;left:auto!important;margin:0!important;padding:9px 11px!important;border:0!important;border-bottom:1px solid var(--q-border)!important;background:#f7faf6!important}.q-chat-right-filter{position:static!important;right:auto!important;left:auto!important;width:100%!important;max-width:none!important;float:none!important;border-left:0!important;border-right:0!important}.live-ai-messages{background:#f6f8f6!important}.live-ai-message.assistant{border-left:4px solid var(--q-green)!important}
      .q-module-progress{position:fixed;left:0;right:0;top:0;z-index:3000;height:3px;pointer-events:none}.q-module-progress i{display:block;width:0;height:100%;background:linear-gradient(90deg,var(--q-dark),var(--q-green),var(--q-lime));transition:width .18s ease}.q-module-progress.active i{width:72%}.q-module-progress.done i{width:100%}
      @media(max-width:1250px){.filter-bar,.filters,.si-filters,.live-filter-bar,[class*="filter-bar"]{grid-template-columns:repeat(3,minmax(0,1fr))!important}.filter-bar input[type="search"],.filters input[type="search"],.si-filters input,.live-filter-bar input{grid-column:span 2!important}.si-kpis{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
      @media(max-width:900px){.view{padding:16px!important}.heading-actions{width:100%!important;margin-left:0!important}.si-kpis,.live-kpi-grid,[class*="kpi-grid"]{grid-template-columns:repeat(2,minmax(0,1fr))!important}.si-span-4,.si-span-5,.si-span-6,.si-span-7,.si-span-8{grid-column:span 12!important}.live-analytics{grid-template-columns:1fr!important}}
      @media(max-width:620px){body{font-size:13px!important}.view{padding:12px!important}h1{font-size:27px!important}.filter-bar,.filters,.si-filters,.live-filter-bar,[class*="filter-bar"]{grid-template-columns:1fr!important}.filter-bar input,.filters input,.si-filters input,.live-filter-bar input{grid-column:auto!important}.si-kpis,.live-kpi-grid,[class*="kpi-grid"]{grid-template-columns:1fr!important}.live-ai-panel,.q-chat-panel{right:8px!important;width:calc(100vw - 16px)!important}}
      @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
    `;
    document.head.appendChild(style);
  }

  function apply(root = document) {
    const cards = root.querySelectorAll('.panel,.card,.kpi-card,.metric-card,.si-panel,.si-kpi,.live-kpi,.live-news-card,.cp-card,[class*="profile-card"],.weekly-summary-section,.tracker-callout');
    cards.forEach((card, index) => {
      if (!card.classList.contains('q-ui-card')) {
        card.classList.add('q-ui-card');
        card.dataset.qAccent = ACCENTS[index % ACCENTS.length];
      }
      if (card.querySelector('canvas')) card.classList.add('q-chart-panel');
    });
    root.querySelectorAll('button,.button,[role="button"]').forEach(button => {
      const label = (button.textContent || '').replace(/\s+/g, ' ').trim();
      if (/preview/i.test(label) && label.length < 30) button.classList.add('q-ui-compact-preview');
    });
    root.querySelectorAll('.filter-bar,.filters,.si-filters,.live-filter-bar,[class*="filter-bar"],[data-role="filters"]').forEach(filter => filter.classList.add('q-filter-top'));
    root.querySelectorAll('.live-ai-panel,[class*="chatbot-panel"],[class*="chat-panel"],[class*="ai-panel"],[data-ai-panel]').forEach(panel => {
      panel.classList.add('q-chat-panel');
      panel.querySelectorAll('[class*="filter"],[data-role*="filter"]').forEach(node => {
        if (!node.matches('input,select,option,label,button') && node.children.length) node.classList.add('q-chat-filter');
      });
    });
    standardizeCharts();
  }

  function standardizeCharts() {
    if (!window.Chart) return;
    try {
      Chart.defaults.animation = false;
      Chart.defaults.font.family = 'Arial, Helvetica, sans-serif';
      Chart.defaults.color = '#646464';
      Chart.defaults.devicePixelRatio = Math.min(window.devicePixelRatio || 1, 1.35);
      const instances = Chart.instances ? Object.values(Chart.instances) : [];
      instances.forEach(chart => {
        if (!chart || chart.$questLayoutRelease === RELEASE) return;
        chart.$questLayoutRelease = RELEASE;
        chart.options = chart.options || {};
        chart.options.animation = false;
        chart.options.maintainAspectRatio = false;
        if (chart.config?.type === 'bar') {
          chart.options.indexAxis = 'x';
          (chart.data?.datasets || []).forEach(dataset => { dataset.borderRadius = 5; dataset.borderSkipped = false; dataset.maxBarThickness = 48; });
        }
        if (chart.options.plugins?.legend) {
          chart.options.plugins.legend.position = 'bottom';
          chart.options.plugins.legend.labels = { ...(chart.options.plugins.legend.labels || {}), usePointStyle: true, boxWidth: 8, padding: 14, font: { family: 'Arial', size: 11, weight: '600' }, color: '#646464' };
        }
        chart.update('none');
      });
    } catch (error) {
      console.warn('Quest chart standardization skipped:', error);
    }
  }

  function schedule() {
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => apply(document), 80);
  }

  function boot() {
    installStyles();
    schedule();
    document.addEventListener('click', event => {
      if (event.target.closest('.nav-item,[data-view],button,a')) window.setTimeout(schedule, 100);
    }, { passive: true });
    window.addEventListener('quest:module-loaded', schedule);
    window.addEventListener('quest:layout-refresh', schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
