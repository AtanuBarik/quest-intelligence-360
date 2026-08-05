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

## Host on GitHub Pages

1. Create a new GitHub repository, for example `quest-intelligence-360`.
2. Upload the complete repository contents, including `index.html`, `bootstrap.js`, and `chunks/`.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder, then save.
6. GitHub will display the public Pages URL after deployment.

## Production architecture recommendation

GitHub Pages can host only the static frontend. Do not place API keys, agent credentials, transcript files or client secrets in this repository.

For production, connect the frontend to an authenticated backend or API gateway that provides:

- Microsoft Entra ID / corporate SSO
- Role-based access control and project permissions
- Secure document ingestion, storage and retrieval
- RAG / search across approved PMR and CI sources
- Connectors to Copilot Studio, approved LLM APIs and enterprise data sources
- Audit logs, human approval workflows and citation provenance
- Rate limiting, monitoring and data-loss prevention

A typical flow is:

`GitHub Pages frontend → secure API gateway/backend → authentication + retrieval layer → approved AI agent(s) → cited response → frontend`

## Branding note

The prototype uses Quest-inspired colors and text-based prototype marks. Replace the marks with approved, unmodified Quest Diagnostics and Evalueserve logo assets before external distribution, following each company’s brand and trademark guidance.
