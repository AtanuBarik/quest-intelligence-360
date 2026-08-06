(() => {
  'use strict';
  if (document.getElementById('questReadabilityOverrides')) return;
  const style = document.createElement('style');
  style.id = 'questReadabilityOverrides';
  style.textContent = `
    .si-head h3,.panel-head h3{font-size:16px!important;font-weight:700!important}
    .si-head p,.panel-head p{font-size:12px!important;line-height:1.45!important;color:#6d746f!important}
    .si-item strong,.si-road-card strong,.si-news-card strong,.si-company-row strong,.si-post strong{font-size:12px!important;line-height:1.4!important;color:#034c1f!important}
    .si-item p,.si-road-card p,.si-news-card p,.si-post p{font-size:11.5px!important;line-height:1.5!important;color:#5d6660!important}
    .si-meta,.si-source-note{font-size:10px!important;line-height:1.45!important;color:#6d746f!important}
    .si-tag,.si-pill,.si-tab{font-size:10px!important}
    .si-news-card h4,.si-news-card h4 a{font-size:13px!important;line-height:1.42!important;color:#1f2923!important}
    .si-score{font-size:17px!important;color:#034c1f!important}
    .si-platform span{font-size:10px!important}.si-platform strong{font-size:16px!important}
    .si-post,.si-company-row{font-size:11px!important;line-height:1.45!important}
    .si-table th,.si-table td{font-size:11px!important;line-height:1.45!important}
    .live-status-pill{font-size:10.5px!important}
    .live-news-head h2{font-size:18px!important}.live-news-head span{font-size:11px!important}
    .live-news-card h3,.live-news-card h3 a{font-size:13px!important;line-height:1.45!important;color:#1f2923!important}
    .live-meta,.live-card-footer a,.live-card-footer button,.live-disclaimer{font-size:10.5px!important}
    .live-context{font-size:11.5px!important;line-height:1.55!important}
    .live-summary-content{font-size:12px!important;line-height:1.62!important}
    .live-summary-content h2,.live-summary-content h3{font-size:14px!important}
    .live-ai-message{font-size:12px!important;line-height:1.55!important}
    .live-ai-header span{font-size:10px!important}
    .live-ai-form textarea{font-size:12px!important}
    [class*="preview"]{font-weight:700!important}
  `;
  document.head.appendChild(style);
})();
