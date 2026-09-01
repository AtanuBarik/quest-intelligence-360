(() => {
  'use strict';
  const RELEASE='20260901layout1';
  // Compatibility shim: current competitive intelligence is consumed by the
  // established Aug-30 presentation modules. Do not replace their DOM/layout.
  document.documentElement.dataset.competitiveIntelligenceRelease=RELEASE;
  document.documentElement.dataset.competitiveIntelligenceMode='legacy-design-current-data';
  window.dispatchEvent(new CustomEvent('quest:competitive-data-layer-ready',{detail:{release:RELEASE}}));
})();
