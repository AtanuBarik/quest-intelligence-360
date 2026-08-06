# Microsoft, SharePoint and Copilot setup for Quest Intelligence 360

## Confirmed environment

- Copilot Studio agent: **Quest Insights Engine**
- Publishing available in Teams and Microsoft 365
- Power Automate standard connectors available: SharePoint, Office 365 Outlook and RSS
- Quest Intelligence SharePoint site created
- Confidential reports, transcripts and raw survey data remain in SharePoint

## 1. Connect SharePoint to ChatGPT Pro

This connection must be completed by the signed-in user because Microsoft OAuth and tenant consent cannot be performed from the public frontend.

1. Open ChatGPT.
2. Open **Settings → Apps**.
3. Find **SharePoint** and select **Connect**.
4. Sign in with the Evalueserve Microsoft account that can access the Quest Intelligence site.
5. Return to **Settings → Apps → SharePoint**.
6. Select **Enable sync**.
7. Wait for the initial index to complete.
8. Test with:
   - `List the projects available in the Quest Intelligence SharePoint site.`
   - `Identify the latest approved final reports, transcripts and survey datasets. Cite every file used.`
   - `Compare findings across selected projects and use only approved final reports and transcripts.`

ChatGPT remains a separate authenticated analyst workspace. The GitHub Pages frontend does not receive or store the Microsoft credentials.

## 2. Use the published Copilot Studio agent securely

For confidential SharePoint knowledge, use the authenticated **Teams** or **Microsoft 365 Copilot** channel.

1. Open Copilot Studio → Channels.
2. Open **Teams + Microsoft 365**.
3. Copy the `See agent in Microsoft 365` or Teams link.
4. In Quest Intelligence 360, open **Microsoft & local data**.
5. Select **Set Teams / Microsoft 365 link** and paste it.
6. Select **Open secure agent** whenever the authenticated research assistant is needed.

The default Copilot Studio iframe channel requires **No authentication**. Use it only for a separate nonconfidential demonstration agent. Do not enable No authentication on the SharePoint-enabled confidential agent.

## 3. Make approved outputs visible in the dashboard

A public browser cannot securely read the private SharePoint library. Use an approved export bridge.

### Recommended SharePoint structure

Create a folder named `Dashboard Exports` and a list named `Approved Insights`.

Suggested `Approved Insights` columns:

- Insight ID
- Title
- Executive summary
- Project
- Evidence types
- Source citations
- Confidence
- Approval status
- Approved by
- Approved date
- Business unit
- Confidentiality
- Dashboard section

### Power Automate flow A — approved insight export

1. Trigger: **When an item is created or modified** in `Approved Insights`.
2. Condition: `Approval status` equals `Approved` and `Confidentiality` permits dashboard use.
3. Action: **Get items** from `Approved Insights` with the same approved filter.
4. Action: **Select** the dashboard fields.
5. Action: **Compose** a JSON object with `generated_at` and `items`.
6. Action: **Create file** or **Update file** in `Dashboard Exports/approved-insights.json`.
7. Action: Send an Outlook confirmation to the owner.

### Power Automate flow B — weekly project tracker export

1. Trigger: Recurrence, every Monday or after the tracker is updated.
2. Read the SharePoint Project Register or Excel tracker.
3. Select the approved dashboard fields.
4. Create `Dashboard Exports/project-tracker.json`.
5. Send a completion email.

### Power Automate flow C — news digest

1. Trigger: Recurrence every six hours or daily.
2. Use RSS standard connectors and/or read the synchronized laboratory-news output.
3. De-duplicate by URL or article ID.
4. Save the approved digest in SharePoint.
5. Send the Outlook digest.

## 4. Local synchronized-folder bridge

1. Synchronize the SharePoint `Dashboard Exports` folder to the demonstration computer using OneDrive.
2. Download the Quest local demo package.
3. Start the local companion with the synchronized folder:

```bat
py -3 local-companion\server.py --cache-frontend --watch-folder "C:\Users\YOURNAME\Evalueserve\Quest Intelligence - Dashboard Exports"
```

The companion indexes new approved exports and locally uploaded files. The original files and the SQLite index remain under `local-data` on that computer.

## 5. Local file processing

The local companion provides persistent storage without a paid API:

- Original files: `local-data/uploads`
- Metadata and extracted text: `local-data/quest-local.db`
- Local endpoint: `http://127.0.0.1:8765`
- Supported uploads: PDF, DOCX, PPTX, XLSX, CSV, JSON, TXT, Markdown and HTML
- Search: keyword-based local evidence retrieval

This small local companion is the only additional component needed for the zero-cost demonstration. A separate full application is not required.

## 6. Production boundary

A future shared production deployment would require an authenticated server-side application, Microsoft Entra registration and permission-aware retrieval. The no-cost local model intentionally avoids placing SharePoint tokens, Copilot secrets or confidential source files in GitHub or browser JavaScript.
