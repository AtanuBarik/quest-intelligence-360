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

PMR, expert and survey views apply the selected team's workstream scope to calculations and exports. The team dashboards reuse the existing insight library, survey cohorts and delivery tracker. Survey values and PMR synthesis remain labeled as illustrative; tracker reporting dates are displayed.

The team assistant retrieves matching objects from `data/pmr-insight-library.json`, limits them to the team's workstreams, and shows their source and demo status. It returns a coverage gap when no evidence matches. It is deterministic keyword retrieval, not a live LLM. Executive Leadership also retains the full original Insights Engine.

The existing public demo login remains available (`quest@medtech.com` / `evalueserve`). Existing role-specific prototype accounts retain their credential-assigned maximum access: Owners can select any user type, Contributors can select Contributor or Viewer, and Viewers remain read-only. Team selection controls relevance, not authorization. Static browser controls do not provide production authentication or server-enforced data isolation; the SSO button remains a placeholder.

Changes are loaded by both `index.html` and `scripts/build_pages_materialized.py`. The publication workflow builds `_site` and synchronizes `gh-pages`. The shared release marker is `20261006teams1`.

Validation: all 12 team/user-type combinations checked in a DOM integration harness, including onboarding order, visible modules, PMR scope, assistant evidence matches and no-match behavior, workspace changes and retained executive visibility. JavaScript syntax, JSON data and the materialized build were checked separately.
