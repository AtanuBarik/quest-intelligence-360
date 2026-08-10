(() => {
  'use strict';
  if (document.getElementById('questReadabilityOverrides')) return;
  const style = document.createElement('style');
  style.id = 'questReadabilityOverrides';
  style.textContent = `
    .si-head h3,.panel-head h3{font-size:16px!important;font-weight:700!important}
    .si-head p,.panel-head p{font-size:13px!important;line-height:1.5!important;color:#6d746f!important}
    .si-item strong,.si-road-card strong,.si-news-card strong,.si-company-row strong,.si-post strong{font-size:13px!important;line-height:1.45!important;color:#034c1f!important}
    .si-item p,.si-road-card p,.si-news-card p,.si-post p{font-size:12.5px!important;line-height:1.55!important;color:#5d6660!important}
    .si-meta,.si-source-note{font-size:11px!important;line-height:1.5!important;color:#6d746f!important}
    .si-tag,.si-pill,.si-tab{font-size:11px!important}
    .si-news-card h4,.si-news-card h4 a{font-size:14px!important;line-height:1.45!important;color:#1f2923!important}
    .si-score{font-size:18px!important;color:#034c1f!important}
    .si-platform span{font-size:11px!important}.si-platform strong{font-size:17px!important}
    .si-post,.si-company-row{font-size:12px!important;line-height:1.5!important}
    .si-table th,.si-table td{font-size:12px!important;line-height:1.5!important}
    .live-status-pill{font-size:12px!important}
    .live-news-head h2{font-size:19px!important}.live-news-head span{font-size:12px!important}
    .live-news-card h3,.live-news-card h3 a{font-size:15px!important;line-height:1.48!important;color:#1f2923!important}
    .live-meta,.live-card-footer a,.live-card-footer button,.live-disclaimer{font-size:11.5px!important}
    .live-context{font-size:12.5px!important;line-height:1.58!important}
    .live-summary-content{font-size:14px!important;line-height:1.68!important}
    .live-summary-content h2,.live-summary-content h3{font-size:15px!important}
    .live-ai-message{font-size:13px!important;line-height:1.58!important}
    .live-ai-header span{font-size:11px!important}
    .live-ai-form textarea{font-size:13px!important}
    [class*="preview"]{font-weight:700!important}
  `;
  document.head.appendChild(style);

  if (!document.getElementById('qFrontendContentCleanupLoader')) {
    const script = document.createElement('script');
    script.id = 'qFrontendContentCleanupLoader';
    script.src = 'integrations/frontend-content-cleanup.js?v=20260810a';
    script.defer = true;
    document.head.appendChild(script);
  }
})();
