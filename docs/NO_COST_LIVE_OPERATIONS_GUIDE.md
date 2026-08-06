# Quest Intelligence 360 — no-cost live operating guide

## Current working architecture

The public GitHub Pages frontend is used for approved or anonymized data, public intelligence, browser-side analytics and demonstrations. Confidential Quest reports, transcripts and respondent-level survey data should remain in SharePoint or on an approved local device.

### Automated in GitHub

- Laboratory news collection and synchronization every six hours
- Validation of live JSON datasets
- Generation of `data/live-operations-status.json`
- GitHub Pages deployment
- JavaScript and JSON validation

### Working in the browser without API credits

- Project tracker CSV/JSON import and export
- Project portfolio charts and filters
- PDF, DOCX, XLSX, CSV, JSON, TXT and Markdown text extraction
- Local browser research repository using IndexedDB
- Keyword-based evidence retrieval across locally indexed files
- Evidence-grounded prompt package generation for ChatGPT Pro or Copilot Studio
- Social-media CSV/JSON import and summary analysis
- Existing browser-side survey analytics

## Data sources

| Section | Primary source | Refresh method |
|---|---|---|
| Executive Hub | Generated project, news, social and health datasets | Automatic plus manual refresh |
| PMR Projects & Reports | `data/project-tracker.json` or local CSV/JSON import | Weekly or on demand |
| Project Tracker | Same shared project dataset | Automatic after data update |
| Alerts & Signals | `laboratory-news-monitor` repository | Every six hours |
| News Intelligence | Laboratory news plus PMR strategic themes | Every six hours for news |
| Social & Perception | `data/social-intelligence.json` plus local platform exports | Manual daily/weekly export without paid APIs |
| Knowledge Repository | IndexedDB local workspace; SharePoint remains system of record | On file upload |
| Insights Engine | Local evidence retrieval plus manual ChatGPT/Copilot synthesis | On demand |
| Survey Analytics Lab | Browser-side dataset processing | On file upload |
| Methodology & Audit | `data/live-operations-status.json` | Daily and whenever core data changes |

## Project tracker update process

1. Open **PMR Projects & Reports**.
2. Select **Upload tracker CSV/JSON**.
3. Upload an export with the same headers as the Quest weekly tracker.
4. Review the KPI cards, charts and project register.
5. Select **Export current CSV** to download the normalized records.
6. The imported version remains in that browser until local storage is cleared.
7. To make an update visible to every user, replace `data/project-tracker.json` in GitHub with the approved normalized version.

## Local research repository process

1. Open **Knowledge Repository**.
2. Select a project and evidence type.
3. Drop approved files into the local workspace.
4. The browser extracts text and stores it in IndexedDB on that device.
5. Search the files by business question or keywords.
6. Open **Insights Engine** and use **Free evidence retrieval mode**.
7. Retrieve evidence, then select **Copy analysis prompt**.
8. Paste the evidence package into SharePoint-connected ChatGPT Pro or an approved Copilot Studio agent.

The local workspace is suitable for demonstrations and individual analyst work. It is not a shared enterprise repository.

## Social-media update process without paid APIs

1. Open **Social & Perception**.
2. Download the CSV template.
3. Enter approved post-level information from LinkedIn, Facebook, X, YouTube, Instagram or another platform export.
4. Upload the CSV or JSON file.
5. The dashboard calculates post volume, companies, platforms, engagement and leading themes.
6. The imported records remain local to that browser.
7. For shared publication, aggregate and validate the data, then update `data/social-intelligence.json`.

## SharePoint operating process

A public GitHub Pages website cannot securely authenticate to a confidential SharePoint library without a server-side application and Microsoft configuration. The free operating model is:

1. Keep source files in SharePoint.
2. Use SharePoint metadata for project, document type, business unit, date, approval and confidentiality.
3. Connect ChatGPT Pro to SharePoint for analyst retrieval, subject to Quest approval.
4. Use Copilot Studio with SharePoint knowledge when the Microsoft tenant permits agent publication.
5. Export only approved, anonymized summaries and metrics to the GitHub dashboard.

## Help required from the user or Microsoft administrator

### Required for internal SharePoint and Copilot use

- Confirm the SharePoint site and libraries that are approved for the pilot.
- Confirm whether the Copilot Studio account can publish agents or is trial-only.
- Obtain Microsoft administrator approval for SharePoint knowledge access.
- Confirm the internal user groups and access permissions.

### Required for data updates

- Provide the latest approved weekly project tracker export.
- Provide one anonymized pilot survey file and its questionnaire/codebook.
- Provide approved sample reports and transcripts for local indexing tests.
- Provide social platform exports or a completed tracking template.
- Confirm which aggregates may be published in the public GitHub repository.

## Production boundary

Do not place confidential reports, raw transcripts, respondent-level survey data, Microsoft credentials, API keys or client secrets in the public repository. A production shared research engine requires authenticated SharePoint access or another approved internal hosting environment.
