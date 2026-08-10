(() => {
  'use strict';

  const RELEASE = '20260810g';
  const NOTE_TEXT = 'Parameters were selected because they recur across current public company strategy materials: enterprise/ecosystem access, advanced diagnostics, operating model, AI/data, customer proposition, current priorities and future direction.';
  let timer = null;

  function injectStyles() {
    let style = document.getElementById('strategicAnalysisFinalFixStyles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'strategicAnalysisFinalFixStyles';
      document.head.appendChild(style);
    }
    style.textContent = `
      .sa2-benchmark-table tbody th{
        background:#eef5ea !important;
        color:#173b24 !important;
      }
      .sa2-benchmark-table tbody th .sa2-param b{
        color:#034c1f !important;
        font-size:12px !important;
        line-height:1.35 !important;
      }
      .sa2-benchmark-table tbody th .sa2-param span{
        color:#53645a !important;
        font-size:11px !important;
        line-height:1.45 !important;
      }
      .sa2-benchmark-table tbody th .sa2-param-icon{
        background:#dfead8 !important;
        color:#034c1f !important;
        border:1px solid #cadac4 !important;
      }
      .sa2-benchmark-table thead th:first-child{
        background:#034c1f !important;
        color:#fff !important;
      }
      .sa2-toolbar select{
        cursor:pointer;
      }
    `;
  }

  function apply() {
    injectStyles();
    const shell = document.querySelector('.sa2-shell[data-strategic-analysis-v2="true"]');
    if (!shell) return false;

    const company = shell.querySelector('#sa2Company');
    const lens = shell.querySelector('#sa2Lens');

    // The v2 renderer has a document-level click handler that looks for the nearest
    // [data-view] ancestor. Marking the controls themselves as inert view targets keeps
    // dropdown clicks from causing the entire Strategic Analysis page to remount.
    if (company) company.dataset.view = 'strategic-control';
    if (lens) lens.dataset.view = 'strategic-control';

    const note = shell.querySelector('.sa2-benchmark-note > div');
    if (note) note.innerHTML = `<b>Qualitative benchmark only.</b> ${NOTE_TEXT}`;

    document.documentElement.dataset.strategicAnalysisFinalFixRelease = RELEASE;
    return Boolean(company && lens && note);
  }

  function schedule() {
    if (timer) clearInterval(timer);
    let attempts = 0;
    timer = setInterval(() => {
      attempts += 1;
      if (apply() || attempts >= 40) {
        clearInterval(timer);
        timer = null;
      }
    }, 75);
  }

  window.addEventListener('quest:module-loaded', event => {
    if (/strategic-analysis/i.test(event.detail?.path || '')) schedule();
  });
  window.addEventListener('quest:layout-refresh', event => {
    if (event.detail?.group === 'strategic') setTimeout(schedule, 80);
  });
  document.addEventListener('click', event => {
    const nav = event.target?.closest?.('.nav-item,a,button');
    if (nav && /Strategic Analysis|News Intelligence/i.test(nav.textContent || '')) setTimeout(schedule, 120);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
})();
