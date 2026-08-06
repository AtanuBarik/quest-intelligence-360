# Quest Intelligence 360 local companion

This companion runs only on `127.0.0.1` and adds persistent local storage to the Quest Intelligence 360 frontend. It requires Python 3 and no paid API, database server or cloud credit.

## What it does

- Serves the Quest frontend locally.
- Stores original uploaded files under `local-data/uploads`.
- Stores metadata and extracted text in `local-data/quest-local.db` using SQLite.
- Supports persistent local search from the **Microsoft & local data** panel.
- Can monitor a locally synchronized SharePoint folder and index new files.
- Can cache the current GitHub Pages frontend for later offline demonstrations.

## Windows

1. Extract the package.
2. Double-click `local-companion\run-windows.bat`.
3. The browser opens at `http://127.0.0.1:8765/?local=1`.
4. Open **Microsoft & local data** and upload approved files.

To monitor a locally synchronized SharePoint folder, open Command Prompt in the extracted folder and run:

```bat
py -3 local-companion\server.py --cache-frontend --watch-folder "C:\Users\YOURNAME\Evalueserve\Quest Intelligence"
```

## macOS or Linux

```sh
chmod +x local-companion/run-macos-linux.sh
./local-companion/run-macos-linux.sh
```

With a synchronized SharePoint folder:

```sh
./local-companion/run-macos-linux.sh --watch-folder "$HOME/SharePoint/Quest Intelligence"
```

## File processing

The browser extracts text from PDF, DOCX and XLSX files when uploaded through the dashboard and sends the extracted text to the companion. The server can independently extract text from TXT, CSV, JSON, HTML, Markdown, DOCX, PPTX and XLSX files. PDFs discovered only through a watched folder are retained and indexed by metadata unless they are uploaded through the dashboard.

## SharePoint and Copilot Studio

- Keep confidential source documents in SharePoint.
- Use an authenticated Copilot Studio agent for SharePoint knowledge.
- In the dashboard, open **Microsoft & local data** and paste the exact iframe `src` from Copilot Studio if your chosen web channel supports your authentication configuration.
- Do not select **No authentication** for an agent that can access confidential SharePoint material.

## Power Automate free operating pattern

Use standard SharePoint and Outlook connectors:

1. Recurrence trigger.
2. Read approved files or list items from the Quest Intelligence SharePoint site.
3. Create a nonconfidential JSON or CSV dashboard export in a `Dashboard Exports` folder.
4. Synchronize that folder to the demonstration computer with OneDrive.
5. Run the local companion with `--watch-folder` pointed to the synchronized folder.
6. The dashboard can search and use those exports without credentials in browser code.

## Security

- The server binds only to the local computer (`127.0.0.1`).
- No uploaded file is committed to GitHub.
- Delete `local-data` to remove all locally stored files and indexes.
- Do not use the public GitHub Pages site to upload confidential material unless the local companion reports that it is connected and the upload is made from the local panel.
