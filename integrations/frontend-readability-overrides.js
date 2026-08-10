(() => {
  'use strict';
  if (document.getElementById('questReadabilityOverrides')) return;
  const style = document.createElement('style');
  style.id = 'questReadabilityOverrides';
  style.textContent = `
    .si-head h3,.panel-head h3{font-size:17px!important;font-weight:700!important}
    .si-head p,.panel-head p{font-size:13.5px!important;line-height:1.55!important;color:#6d746f!important}
    .si-item strong,.si-road-card strong,.si-news-card strong,.si-company-row strong,.si-post strong{font-size:13.5px!important;line-height:1.48!important;color:#034c1f!important}
    .si-item p,.si-road-card p,.si-news-card p,.si-post p{font-size:13px!important;line-height:1.58!important;color:#5d6660!important}
    .si-meta,.si-source-note{font-size:12px!important;line-height:1.52!important;color:#6d746f!important}
    .si-tag,.si-pill,.si-tab{font-size:12px!important}
    .si-news-card h4,.si-news-card h4 a{font-size:14.5px!important;line-height:1.48!important;color:#1f2923!important}
    .si-score{font-size:18px!important;color:#034c1f!important}
    .si-platform span{font-size:12px!important}.si-platform strong{font-size:17px!important}
    .si-post,.si-company-row{font-size:12.5px!important;line-height:1.52!important}
    .si-table th,.si-table td{font-size:12.5px!important;line-height:1.52!important}
    .live-status-pill{font-size:12.5px!important}
    .live-news-head h2{font-size:20px!important}.live-news-head span{font-size:12.5px!important}
    .live-news-card h3,.live-news-card h3 a{font-size:16px!important;line-height:1.5!important;color:#1f2923!important}
    .live-meta,.live-card-footer a,.live-card-footer button,.live-disclaimer{font-size:12.5px!important;line-height:1.48!important}
    .live-chip{font-size:12px!important;line-height:1.35!important}
    .live-context{font-size:13px!important;line-height:1.6!important}
    .live-summary-content{font-size:15px!important;line-height:1.7!important}
    .live-summary-content h2,.live-summary-content h3{font-size:16px!important}
    .live-ai-message{font-size:13.5px!important;line-height:1.6!important}
    .live-ai-header span{font-size:12px!important}
    .live-ai-form textarea{font-size:13.5px!important}
    .live-filter-bar input,.live-filter-bar select,.live-filter-bar button{font-size:13px!important}
    .live-kpi span,.live-kpi small{font-size:12.5px!important;line-height:1.45!important}
    [class*="preview"]{font-weight:700!important}
  `;
  document.head.appendChild(style);
})();
