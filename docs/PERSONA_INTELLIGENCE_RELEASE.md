# Quest Intelligence 360: role-based intelligence

Release: **20261012persona1**. Public capability sources reviewed **12 October 2026**.

## Experience

Existing login, team selection and account-capped access selection remain. Team relevance and access level are independent. Every team lands in MY HUB. Original Executive demo analytics remain explicitly accessible.

| Team | Default hub | Advisor interpretation |
|---|---|---|
| Executive Leadership | Executive pulse, strategic decisions, market context, evidence gaps, research portfolio | Answer, evidence, enterprise implication, options, limitations, next decision |
| Strategy & BI | Market pulse, competitor watch, opportunity/risk, assumptions, strategic research | Finding, evidence, market implication, Quest implication, risk/opportunity, next investigation |
| MACI | Existing full research center: portfolio, requests, customer pulse, evidence health, alerts | Existing nine-part research partner with methods, populations, quant/qual, agreement and sources |
| Product & Operations | Need radar, opportunity pipeline, workflow journey, capability comparison, roadmap gaps | Problem, evidence, affected segments, capability context/gap, implications, validation |

Common additions: Decisions & Opportunities, Customer Experience Intelligence and Reports & Deliverables. Existing PMR, survey and expert tools are retained; non-MACI teams receive curated summaries before expandable original tools. Strategy retains full CI. Product gets capability-focused competitor context. Existing research datasets have not been removed.

Reports are downloadable **HTML drafts**, with sources, dates, scope and limitations, not finished client reports or generated PowerPoint files. Legacy portfolio/persona syntheses remain downloadable in Executive/MACI all-workstream scope.

## Public research enrichment

The comparison separates data scope from documented functions. It does not infer customer preference, market share, pricing, ROI or competitive superiority from vendor descriptions.

- [Quest Comprehensive Insights](https://www.questdiagnostics.com/laboratory-managers/lab-performance-optimization/lab-analytics-stewardship/quest-comprehensive-insights): core lab, Quest and third-party laboratory analytics context.
- [Quest Essential Insights](https://www.questdiagnostics.com/laboratory-managers/lab-performance-optimization/lab-analytics-stewardship/quest-essential-insights): Quest reference-testing volume, spend and quality indicators.
- [Labcorp Insight Analytics](https://www.labcorp.com/data/insight-analytics): outpatient population, stewardship and community-health context.
- [ARUP AnalyticsDx Sendout](https://www.aruplab.com/consulting/analytics/analyticsdx-sendout): ARUP sendout testing visibility.

These are **supplier descriptions**, not independent performance findings. Full URLs and review dates are in `data/persona-intelligence.json`. Existing public research metadata retain their original dates in `data/maci-research-context.json`. The tracker is explicitly labeled **3 August 2026**, not live status.

Five analyst hypotheses cover integrated workflow intelligence, reference-testing visibility, segment-specific value, result communication and adoption friction. Each includes the problem, segment, options, validation, dependency and source context. They are **not approved Quest initiatives**.

## Evidence and prototype boundaries

Default new dashboards and advisors exclude synthetic survey means and illustrative PMR claims. Counts indicate evidence coverage, not numeric confidence. Source-specific survey bases are retained without pooling unrelated studies. The original demo modules keep their labels.

Hub Owners review local stages; Contributors add local drafts; Viewers read and export. Advancing beyond Validating requires an applicable locally approved customer excerpt. Viewer presentation excludes unapproved cards regardless of team. Local approval is not enterprise approval.

Workflow/evidence records use browser-local storage; nothing is synchronized, emailed or published. Do not enter confidential data into this public prototype.

Advisors use bounded retrieval and different structured response templates, **not a connected live generative model**. SSO presentation is not a configured enterprise identity integration. Production still needs server-side identity, source authorization, persistent workflow and audit logging. See [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

## Implementation and QA

`team-workspaces.js` controls presentation relevance and navigation. `persona-intelligence.js` owns new views, scoped responses and local workflows. The original MACI research engine remains. Legacy chat layout adapters no longer move or replace the active form, avoiding lost input and stale responses.

The bootstrap, materializer and lazy loader use the same release marker. Existing Pages deployment builds `_site`, publishes to `gh-pages`, then triggers native Pages deployment.

Run `node tests/test_persona_contract.mjs`, build with `python scripts/build_pages_materialized.py`, serve `_site`, then run `python tests/test_persona_browser.py`. The PR workflow validates all 12 team/access combinations, downloads, scope guards, opportunity evidence gates, keyboard tabs, mobile overflow, escaping and team-switch reset. Artifacts include screenshots and draft exports for seven days.

Tabs follow the [W3C ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). Native dialogs support focus containment and Escape. This is not a claim of a full accessibility audit.
