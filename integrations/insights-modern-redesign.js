/* Compatibility entry point. Persona rendering replaces the legacy DOM-moving layout.
   Moving the active chat form between layouts caused lost input and stale responses. */
(() => {
  'use strict';
  const apply=()=>window.QuestPersona?.renderAssistant();
  window.QuestInsightsUnifiedLayout={apply,release:'20261012persona1'};
  window.addEventListener('quest:workspace-change',apply);
})();
