(() => {
  'use strict';

  const RELEASE = '2026-08-05-brand-v1';
  const PALETTE = ['#35792a','#c6d52f','#034c1f','#9a9a9a','#024c6a','#3995bb','#80276c','#c78800','#646464'];

  function installCss() {
    if (document.getElementById('questBrandSystem')) return;
    const style = document.createElement('style');
    style.id = 'questBrandSystem';
    style.textContent = `
      :root{
        --quest-dark-green:#034c1f;
        --quest-green:#35792a;
        --quest-bright-green:#c6d52f;
        --quest-dark-blue:#024c6a;
        --quest-blue:#3995bb;
        --quest-purple:#80276c;
        --quest-orange:#c78800;
        --quest-grey:#9a9a9a;
        --quest-dark-grey:#646464;
        --quest-paper:#ffffff;
        --quest-canvas:#f5f6f5;
        --quest-soft-green:#f2f7ec;
        --quest-line:#d7ddd7;
        --quest-shadow:0 8px 24px rgba(3,76,31,.07);
        --quest-radius:10px;
      }
      html,body,button,input,select,textarea,table{font-family:Arial,Helvetica,sans-serif!important}
      body{background:var(--quest-canvas)!important;color:var(--quest-dark-grey)!important;font-size:14px!important;line-height:1.45}
      h1,h2,h3,h4,h5,h6{font-family:Arial,Helvetica,sans-serif!important;color:var(--quest-green)!important;font-weight:500!important;letter-spacing:0!important}
      h1{font-size:clamp(26px,2vw,32px)!important;line-height:1.14!important;margin-bottom:7px!important}
      h2{font-size:22px!important;line-height:1.2!important}
      h3{font-size:17px!important;line-height:1.25!important}
      h4{font-size:15px!important}
      p,li,td,th,label,small,span{font-family:Arial,Helvetica,sans-serif}
      .page-heading p,.panel-head p,.muted,.subtitle{color:var(--quest-dark-grey)!important;font-size:14px!important}
      .section-kicker{color:var(--quest-green)!important;font-size:11px!important;font-weight:700!important;letter-spacing:1.1px!important;text-transform:uppercase!important}
      .app-shell,.app{background:var(--quest-canvas)!important}
      .sidebar{background:var(--quest-dark-green)!important;border-right:0!important;box-shadow:none!important}
      .sidebar *{font-family:Arial,Helvetica,sans-serif}
      .sidebar .brand-mark,.sidebar .logo-mark,.sidebar [class*="logo"]{border-color:var(--quest-bright-green)!important;color:var(--quest-bright-green)!important}
      .sidebar .brand-name,.sidebar .brand-title,.sidebar strong{color:#fff!important}
      .sidebar .nav-section-title,.sidebar [class*="section-label"]{color:#91b898!important;font-size:10px!important;letter-spacing:1.15px!important}
      .nav-item{min-height:42px!important;border-radius:7px!important;margin:2px 8px!important;padding:9px 12px!important;color:#fff!important;font-size:14px!important;font-weight:600!important;transition:background .16s ease,transform .16s ease!important}
      .nav-item:hover{background:rgba(53,121,42,.55)!important;transform:translateX(1px)}
      .nav-item.active{background:var(--quest-green)!important;color:#fff!important;border-left:4px solid var(--quest-bright-green)!important;padding-left:8px!important;box-shadow:none!important}
      .nav-item .badge,.nav-badge{background:rgba(198,213,47,.18)!important;color:var(--quest-bright-green)!important}
      .topbar,.app-header,.header{background:#fff!important;border-bottom:1px solid var(--quest-line)!important;box-shadow:none!important}
      .main,.main-content,.content-area{background:var(--quest-canvas)!important}
      .view{padding:24px!important}
      .page-heading{align-items:flex-start!important;margin-bottom:18px!important}
      .page-heading h1{color:var(--quest-green)!important}
      .panel,.kpi-card,.metric-card,.card,.si-panel,.si-kpi,.live-kpi,.live-news-card,.weekly-summary-section,.cp-card,[class*="profile-card"]{
        background:#fff!important;border:1px solid var(--quest-line)!important;border-radius:var(--quest-radius)!important;box-shadow:var(--quest-shadow)!important;
      }
      .panel,.si-panel{padding:18px!important}
      .kpi-card,.metric-card,.si-kpi,.live-kpi{padding:16px!important;min-height:104px!important;position:relative!important;overflow:hidden!important}
      .kpi-card:before,.metric-card:before,.si-kpi:before,.live-kpi:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--quest-green)}
      .kpi-card:nth-child(3n+2):before,.metric-card:nth-child(3n+2):before,.si-kpi:nth-child(3n+2):before,.live-kpi:nth-child(3n+2):before{background:var(--quest-bright-green)}
      .kpi-card:nth-child(3n):before,.metric-card:nth-child(3n):before,.si-kpi:nth-child(3n):before,.live-kpi:nth-child(3n):before{background:var(--quest-dark-blue)}
      .kpi-card span,.metric-card span,.si-kpi span,.live-kpi span{color:var(--quest-dark-grey)!important;font-size:12px!important}
      .kpi-card strong,.metric-card strong,.si-kpi strong,.live-kpi strong{color:var(--quest-dark-green)!important;font-size:28px!important;font-weight:700!important}
      .kpi-card small,.metric-card small,.si-kpi small,.live-kpi small{font-size:11px!important;color:var(--quest-dark-grey)!important}
      .panel-head{border-bottom:1px solid var(--quest-line);padding-bottom:10px;margin-bottom:14px!important}
      .panel-head h3,.si-head h3{color:var(--quest-green)!important;font-weight:600!important}
      button,.button,.primary-button,.secondary-button,.text-button{font-family:Arial,Helvetica,sans-serif!important;font-size:14px!important;font-weight:700!important;min-height:40px!important;border-radius:7px!important;padding:9px 15px!important;box-shadow:none!important}
      .primary-button,button.primary,.btn-primary{background:var(--quest-dark-green)!important;color:#fff!important;border:1px solid var(--quest-dark-green)!important}
      .primary-button:hover,button.primary:hover,.btn-primary:hover{background:var(--quest-green)!important;border-color:var(--quest-green)!important}
      .secondary-button,.btn-secondary{background:#fff!important;color:var(--quest-dark-green)!important;border:1px solid #bfc9c0!important}
      .secondary-button:hover,.btn-secondary:hover{background:var(--quest-soft-green)!important;border-color:var(--quest-green)!important}
      .text-button{background:transparent!important;color:var(--quest-green)!important;border:0!important;padding-left:4px!important;padding-right:4px!important}
      input,select,textarea{background:#fff!important;color:var(--quest-dark-grey)!important;border:1px solid #cbd3cc!important;border-radius:7px!important;font-size:14px!important;min-height:40px!important}
      input:focus,select:focus,textarea:focus{outline:3px solid rgba(198,213,47,.28)!important;border-color:var(--quest-green)!important}
      table{font-size:12px!important;color:var(--quest-dark-grey)!important}
      th{background:var(--quest-dark-grey)!important;color:#fff!important;font-weight:700!important;font-size:12px!important}
      td{background:#fff!important;border-color:#e2e6e2!important}
      tbody tr:hover td{background:#f7faf4!important}
      .status,.tag,.pill,.chip,.si-tag,.live-chip,.tracker-pill{font-size:10px!important;font-weight:700!important}
      .status.green,.tag.green,.pill.green{background:#eaf3e6!important;color:var(--quest-green)!important}
      .status.blue,.tag.blue,.pill.blue{background:#e6f2f6!important;color:var(--quest-dark-blue)!important}
      .status.orange,.tag.orange,.pill.orange{background:#fbf0d8!important;color:var(--quest-orange)!important}
      .status.purple,.tag.purple,.pill.purple{background:#f3e8f0!important;color:var(--quest-purple)!important}
      .chart-wrap{background:#fff!important}
      canvas{font-family:Arial,Helvetica,sans-serif!important}
      .progress,.progress-bar,.si-progress,.live-progress{background:#e6e9e6!important;border-radius:3px!important}
      .progress i,.progress-bar i,.si-progress i,.live-progress i{background:var(--quest-green)!important;border-radius:3px!important}
      .si-filters,.live-filter-bar,.filter-bar,.filters{border-radius:var(--quest-radius)!important;box-shadow:none!important}
      .si-road-col,.si-road-card,.si-item,.tracker-callout,.live-summary,.live-modal,.live-ai-panel{border-radius:var(--quest-radius)!important}
      .si-road-col h4{color:var(--quest-green)!important}
      .si-tab.active{background:var(--quest-dark-green)!important;color:#fff!important}
      .live-ai-launcher{background:var(--quest-dark-green)!important;border-radius:7px!important}
      .live-ai-header{background:var(--quest-dark-green)!important}
      .live-news-card{border-left:4px solid var(--quest-green)!important}
      .live-news-card.priority-high{border-left-color:var(--quest-purple)!important}
      .live-news-card.priority-medium{border-left-color:var(--quest-orange)!important}
      .live-chip{border-radius:4px!important;background:#edf4e9!important;color:var(--quest-green)!important}
      .live-chip.blue{background:#e7f1f5!important;color:var(--quest-dark-blue)!important}
      .live-chip.gold{background:#f7eed5!important;color:var(--quest-orange)!important}
      .live-chip.red{background:#f3e7ef!important;color:var(--quest-purple)!important}
      .q-brand-icon{width:38px;height:38px;border:2px solid var(--quest-bright-green);border-radius:50%;display:grid;place-items:center;background:#fff;flex:0 0 38px}
      .q-brand-icon img{max-width:25px;max-height:25px;object-fit:contain}
      .q-category-icon{width:34px;height:34px;border:2px solid var(--quest-bright-green);border-radius:50%;padding:4px;background:#fff;object-fit:contain;flex:0 0 34px}
      .q-brand-note{display:inline-flex;align-items:center;gap:7px;border-left:3px solid var(--quest-bright-green);background:#f6f9ed;padding:8px 10px;border-radius:4px;color:var(--quest-dark-grey);font-size:11px}
      .q-sync-strip{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:10px 0 14px;padding:10px 12px;background:#fff;border:1px solid var(--quest-line);border-left:4px solid var(--quest-bright-green);border-radius:6px;color:var(--quest-dark-grey);font-size:11px}
      .q-sync-strip strong{color:var(--quest-dark-green)!important}
      .q-sync-dot{width:9px;height:9px;border-radius:50%;background:var(--quest-green);box-shadow:0 0 0 4px rgba(53,121,42,.12)}
      .q-verified-button{font-size:11px!important;min-height:32px!important;padding:6px 10px!important;background:#fff!important;color:var(--quest-dark-green)!important;border:1px solid var(--quest-green)!important;border-radius:5px!important}
      .q-verified-modal{position:fixed;inset:0;z-index:1500;background:rgba(3,76,31,.42);display:grid;place-items:center;padding:24px}
      .q-verified-dialog{width:min(720px,100%);max-height:85vh;overflow:auto;background:#fff;border:1px solid var(--quest-line);border-radius:10px;box-shadow:0 28px 90px rgba(3,76,31,.28)}
      .q-verified-header{display:flex;justify-content:space-between;gap:15px;align-items:center;padding:18px 20px;border-bottom:1px solid var(--quest-line)}
      .q-verified-header h3{margin:0!important;color:var(--quest-green)!important}
      .q-verified-body{padding:20px;font-size:14px;line-height:1.6;color:var(--quest-dark-grey)}
      .q-verified-meta{margin-top:15px;padding-top:12px;border-top:1px solid var(--quest-line);font-size:11px;color:var(--quest-grey)}
      .q-close{width:36px!important;height:36px!important;min-height:36px!important;padding:0!important;background:#fff!important;color:var(--quest-dark-green)!important;border:1px solid var(--quest-line)!important}
      @media(max-width:900px){.view{padding:16px!important}.kpi-card strong,.metric-card strong,.si-kpi strong,.live-kpi strong{font-size:24px!important}.panel,.si-panel{padding:14px!important}}
      @media(max-width:620px){body{font-size:13px!important}.page-heading p,.panel-head p,.muted,.subtitle{font-size:13px!important}h1{font-size:26px!important}.nav-item{font-size:13px!important}}
    `;
    document.head.appendChild(style);
  }

  function updateCharts() {
    if (!window.Chart) return;
    try {
      Chart.defaults.font.family = 'Arial, Helvetica, sans-serif';
      Chart.defaults.color = '#646464';
      Chart.defaults.borderColor = '#e0e4e0';
      const instances = Chart.instances ? Object.values(Chart.instances) : [];
      instances.forEach(chart => {
        if (!chart || !chart.data || !Array.isArray(chart.data.datasets)) return;
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const count = Array.isArray(dataset.data) ? dataset.data.length : 1;
          const base = PALETTE[datasetIndex % PALETTE.length];
          if (chart.config.type === 'line') {
            dataset.borderColor = base;
            dataset.backgroundColor = `${base}20`;
            dataset.pointBackgroundColor = base;
            dataset.pointBorderColor = base;
            dataset.borderWidth = 2.5;
            dataset.tension = .28;
          } else if (chart.config.type === 'doughnut' || chart.config.type === 'pie' || chart.config.type === 'polarArea') {
            dataset.backgroundColor = Array.from({length:count},(_,i)=>PALETTE[i % PALETTE.length]);
            dataset.borderColor = '#ffffff';
            dataset.borderWidth = 2;
          } else {
            dataset.backgroundColor = Array.isArray(dataset.backgroundColor)
              ? Array.from({length:count},(_,i)=>PALETTE[(i + datasetIndex) % PALETTE.length])
              : base;
            dataset.borderColor = base;
            dataset.borderWidth = 0;
            dataset.borderRadius = 3;
          }
        });
        if (chart.options?.plugins?.legend?.labels) {
          chart.options.plugins.legend.labels.color = '#646464';
          chart.options.plugins.legend.labels.font = { family:'Arial', size:11 };
          chart.options.plugins.legend.labels.usePointStyle = true;
        }
        ['x','y','r'].forEach(axis => {
          if (chart.options?.scales?.[axis]?.ticks) {
            chart.options.scales[axis].ticks.color = '#646464';
            chart.options.scales[axis].ticks.font = { family:'Arial', size:11 };
          }
          if (chart.options?.scales?.[axis]?.grid) chart.options.scales[axis].grid.color = '#e3e6e3';
        });
        chart.update('none');
      });
    } catch (error) {
      console.warn('Quest chart branding could not be fully applied', error);
    }
  }

  function normalizeLegacyColors(root = document) {
    root.querySelectorAll('[style]').forEach(node => {
      const value = node.getAttribute('style') || '';
      const updated = value
        .replace(/#4c7637/gi,'#35792a')
        .replace(/#005a2b/gi,'#034c1f')
        .replace(/#c7d92c/gi,'#c6d52f')
        .replace(/#00658a/gi,'#024c6a')
        .replace(/#daa000/gi,'#c78800')
        .replace(/#7b4d83/gi,'#80276c')
        .replace(/#b9c5bd/gi,'#9a9a9a');
      if (updated !== value) node.setAttribute('style', updated);
    });
  }

  function markRelease() {
    document.documentElement.dataset.questBrandRelease = RELEASE;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = '#034c1f';
  }

  function apply() {
    installCss();
    markRelease();
    normalizeLegacyColors();
    updateCharts();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  else apply();

  const observer = new MutationObserver(() => {
    window.clearTimeout(window.__questBrandTimer);
    window.__questBrandTimer = window.setTimeout(() => {
      normalizeLegacyColors();
      updateCharts();
    }, 180);
  });
  observer.observe(document.documentElement, {childList:true,subtree:true});
  window.setInterval(updateCharts, 5000);
  window.QuestBrandSystem = { release: RELEASE, palette: PALETTE, apply };
})();
