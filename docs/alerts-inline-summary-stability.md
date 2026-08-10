# Alerts & Signals inline ChatGPT summaries

Release 20260810e consolidates Alerts summary rendering into one stable layer. The current synchronized feed has a persistent ChatGPT summary cache, cards display summaries inline, and the previous popup/DOM-mutation summary enhancer is no longer loaded by the Alerts group. The resilience module is data-only so it cannot compete with the visible feed renderer.
