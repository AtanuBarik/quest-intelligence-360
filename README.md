# Quest Intelligence 360 — Frontend Prototype

A static, GitHub Pages-ready prototype for a dense competitive intelligence (CI), market intelligence (MI), primary market research (PMR) and evidence-grounded AI workspace designed for Quest Diagnostics.

## Demo access

- Username: `quest@medtech.com`
- Password: `evalueserve`

The credential check is browser-side and is **not secure authentication**. It is only for prototype demonstration.

## Included experiences

- Quest-themed login and role selection
- Executive intelligence hub with KPIs, signals, portfolio health and opportunity map
- Insights Copilot with project, source, response-mode and persona controls
- Competitor alerts, living company profiles and a profile drawer
- Competitive landscape, capability radar and heat map
- News intelligence and social/perception tracking
- PMR project portfolio, interview/survey tracking and evidence library
- Voice-of-expert synthesis, survey analytics and cross-tabs
- All-project tracker, milestone timeline, risk view, methodology and audit pages
- Functional search, navigation, filtering, downloads, file staging and interactive demo AI answers

All displayed metrics, events, quotes and findings are illustrative placeholders and should be replaced with validated Quest/Evalueserve data before client use.

## Run locally

Serve the project through a local HTTP server. The deployment uses small runtime-loaded bundle fragments so it can be maintained safely through the connected GitHub workflow. An internet connection is also required for the Google font and Chart.js CDN references.

For a local web server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Run with Docker

The repository includes a Dockerized Nginx deployment that serves the complete static frontend and all runtime `chunks/`, `integrations/`, assets and data paths.

```bash
docker compose up -d --build
```

Then open:

```text
http://localhost:8080
```

The container exposes a health endpoint at:

```text
http://localhost:8080/healthz
```

To use a different host port:

```bash
QUEST_PORT=8088 docker compose up -d --build
```

For teammate handoff, image export/import instructions, container-registry deployment, and custom-domain reverse-proxy guidance, see [`DEPLOYMENT_DOCKER.md`](DEPLOYMENT_DOCKER.md).

## Host on GitHub Pages

1. Create a new GitHub repository, for example `quest-intelligence-360`.
2. Upload the complete repository contents, including `index.html`, `bootstrap.js`, and `chunks/`.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder, then save.
6. GitHub will display the public Pages URL after deployment.

## Custom-domain / production hosting

The Docker container listens on port 80 internally and is designed to be served from the root of a domain or subdomain, for example:

```text
https://quest360.example.com/
```

Point the domain to the hosting environment and route HTTPS traffic through your organization's approved load balancer, ingress controller, reverse proxy or certificate-management layer to the container.

The current login is still browser-side prototype logic. For an internal or client-sensitive deployment, place the frontend behind approved authentication such as Microsoft Entra ID / corporate SSO, VPN, zero-trust access or another organization-approved gateway.

## Production architecture recommendation

GitHub Pages and the Docker image host only the static frontend. Do not place API keys, agent credentials, transcript files or client secrets in this repository or bake them into the container image.

For production, connect the frontend to an authenticated backend or API gateway that provides:

- Microsoft Entra ID / corporate SSO
- Role-based access control and project permissions
- Secure document ingestion, storage and retrieval
- RAG / search across approved PMR and CI sources
- Connectors to Copilot Studio, approved LLM APIs and enterprise data sources
- Audit logs, human approval workflows and citation provenance
- Rate limiting, monitoring and data-loss prevention

A typical flow is:

`Docker/Nginx frontend → secure API gateway/backend → authentication + retrieval layer → approved AI agent(s) → cited response → frontend`

## Branding note

The prototype uses Quest-inspired colors and text-based prototype marks. Replace the marks with approved, unmodified Quest Diagnostics and Evalueserve logo assets before external distribution, following each company’s brand and trademark guidance.

## Team workspaces (October 2026)

Sign in → choose your team → choose Hub Owner, Contributor or Viewer → enter your dashboard.

Executive Leadership is shown in a full-width row above the three specialist teams. On smaller screens the specialist cards stack. The selected workspace and access level are retained for the current browser session. Use **Change team / access** to revisit either selection.

| Team | Workspace focus |
| --- | --- |
| Executive Leadership | Every existing section and workstream, plus the role-aware assistant |
| Strategy & Business Intelligence | Competitor profiles, alerts, news, strategic PMR and growth opportunities |
| Market and Customer Insights (MACI) | Customer research, experts, surveys, competitor perception and social intelligence |
| Product & Operations Management | Workflow integration, service reliability, adoption, product requirements and delivery |

PMR portfolio charts, Project Tracker, expert and survey views apply the selected team's workstream scope to calculations and exports. Strategy and Operations use My Dashboard. MACI lands in MY HUB: Research & Customer Intelligence Center, retaining the existing PMR, expert, survey and delivery modules. Survey values and PMR synthesis remain labeled as illustrative; tracker reporting dates are displayed.

The Strategy and Operations team assistant retrieves matching objects from `data/pmr-insight-library.json`, limits them to the team's workstreams, and shows their source and demo status. It returns a coverage gap when no evidence matches. It is deterministic keyword retrieval, not a live LLM. Executive Leadership also retains the full original Insights Engine.

The existing public demo login remains available (`quest@medtech.com` / `evalueserve`). Existing role-specific prototype accounts retain their credential-assigned maximum access: Owners can select any user type, Contributors can select Contributor or Viewer, and Viewers remain read-only. Team selection controls relevance, not authorization. Static browser controls do not provide production authentication or server-enforced data isolation; the SSO button remains a placeholder.

Changes are loaded by both `index.html` and `scripts/build_pages_materialized.py`. The publication workflow builds `_site` and synchronizes `gh-pages`. The shared release marker is `20261009maci1`.

Validation: all 12 team/user-type combinations checked in a DOM integration harness, including onboarding order, visible modules, PMR scope, assistant evidence matches and no-match behavior, workspace changes and retained executive visibility. JavaScript syntax, JSON data and the materialized build were checked separately.

### Personalized experience and research agenda

The optional name field provides a greeting, defaulting to **Quest team**. Every workspace names the team and Hub Owner, Contributor or Viewer access, and explains its curation scope. Sign-in restores Executive Hub, MACI MY HUB or My Dashboard as the landing page. Screen and content transitions respect reduced-motion preferences. Loading indicators count completed module or evidence loading steps; the assistant shows a busy state during evidence retrieval.

Strategy and Operations receive three proposed research outputs each; MACI receives the more detailed research agenda in MY HUB. Executives can see all nine alongside all original sections. `data/team-research-agenda.json` links official Quest product context reviewed on October 6, 2026 to relevant PMR, expert, survey and delivery evidence. Analyst questions and proposed outputs are explicitly distinguished from published product facts and completed deliverables. The scope stays within research synthesis, competitive benchmarking, survey analysis, journey assessment and decision briefs.

Product & Operations does not receive the general financial/news Alerts feed. MACI competitor detail pages omit executive/financial scale panels; specialist Methodology & Audit pages focus on evidence quality and relevant research handoffs. Project Tracker totals, records, charts and exports share the team scope. PMR portfolio charts use the same scope and correctly treat an empty search as unfiltered.

Validation covers all 12 team/access combinations, default and supplied names, curated source and agenda counts, dashboard landing, tracker CSV exports, PMR chart counts, assistant coverage gaps, access restrictions and loading progress.

### MACI Research & Customer Intelligence Center — October 9, 2026

MACI uses five MY HUB sections: Research Portfolio, Research Requests, Customer Insights Pulse, Research Evidence Health and MACI Alerts. The portfolio maps six existing workstreams to seven tracker delivery records. Status, ownership, sample totals and historical milestones remain source-backed; missing sponsor units, vendors, fieldwork details and confidential source locations are shown as gaps. Proposed KBQs and next research questions are analyst-authored mappings, not original instruments or commissioned study plans.

`data/maci-research-context.json` supplies 14 reviewed public research/product references, 11 customer research topics, comparability notes, methodology checks and all 18 requested PMR/competitive report types. Public evidence preserves population, geography, fieldwork period, method, sample, question-level base and limitations. Supplier descriptions are context for research questions, never evidence of customer awareness or preference. The original illustrative PMR summaries, expert paraphrases and synthetic survey charts remain accessible and labeled.

The **Quest Research & Customer Insights Partner** produces Research answer → Studies consulted → Quantitative evidence → Qualitative evidence → Segment differences → Agreement / disagreement → Evidence limitations → Research gaps → Sources. Default retrieval excludes illustrative/synthetic findings. Users can explicitly include labeled demo synthesis. No live language model is connected. Executive Leadership retains the original engine and can expand the same MACI Research Partner and full research center.

PMR gains a full project-context library, comparisons by theme/project/persona/geography/year/method and scoped HTML report drafts. Survey Analytics adds published question-specific measures and an instrument-availability catalogue. It does not reconstruct response distributions from means, pool unrelated studies or infer statistical significance. Voice of Experts separates public qualitative context, approved excerpts and persona demonstrations. Competitive Intelligence highlights customer perception gaps and sourced supplier descriptions; MACI omits speculative competitive scoring and strategic/financial scale panels.

Research requests follow New, Under Review, Existing Evidence Found, Approved, In Progress and Completed. Contributors and Hub Owners submit requests and evidence excerpts. Only Hub Owners change request status or approve evidence; Viewers read and export. Evidence approval requires study, KBQ, population, geography, period, method, sample/base, source locator and limitations. Approval here is a local owner review, not enterprise source-system approval. Pending and returned excerpts are excluded from default answers. Topic overlap is a review cue, not duplicate-study proof. Contradiction cues require matching KBQ, stakeholder, geography, period and method with opposing coded positions. Age review defaults to 24 months, with its date basis shown separately from validity.

Requests and excerpts are stored only in this browser's local storage (`quest360-maci-workspace-v1`); there is no cross-device request service or private-source connector. Nothing entered in these forms is committed to GitHub or sent to colleagues. Report downloads are analyst drafts and retain source/context gaps. Original private reports, instruments, transcripts and response-level survey files are required to populate approved customer findings and real customer cross-tabs. MACI alerts reflect supplied records and local workflow changes; missing live study/deliverable event feeds are identified explicitly.

Regression checks:

```bash
python scripts/build_pages_materialized.py
node --test tests/maci-evidence-model.test.cjs
npm install --prefix /tmp/quest-qa jsdom@26.1.0 --no-audit --no-fund
NODE_PATH=/tmp/quest-qa/node_modules node tests/maci-workspace.test.cjs
```

The DOM suite restores all 12 team/access combinations, checks executive visibility, the nine-part research answer, unknown-query behavior, local request/evidence permissions, safe excerpt rendering, 18 scoped report exports, legacy PMR retention, team switching and personalized greetings. These checks also run in the frontend validation workflow. Quest-green styling, responsive grids, keyboard-accessible tabs and reduced-motion transitions extend the existing design.
