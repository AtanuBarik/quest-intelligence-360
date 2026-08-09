# Quest Enterprise Insights Engine — ChatGPT Workspace Agent bridge

## Goal

Allow the Quest Enterprise Insights Engine frontend to submit a user question together with the selected project scope, evidence filters and output configuration, then display a ChatGPT Workspace Agent answer without placing an OpenAI API key in the browser.

## Important platform constraint

The Workspace Agents API can be used to trigger a published ChatGPT Workspace Agent with a Workspace Agent access token. The trigger is asynchronous. At present, the trigger does not provide a retrievable response payload/run result through the same API, so the Quest frontend cannot simply trigger the agent and poll OpenAI every two minutes for the answer.

Do not automate or scrape an authenticated chatgpt.com browser session. Do not put any Workspace Agent access token, OpenAI credential, Microsoft credential or other secret in GitHub Pages JavaScript.

## Recommended supported architecture

1. **Quest frontend**
   - Collects the user question.
   - Collects the current project selections.
   - Collects evidence-type filters.
   - Collects output configuration (Executive synthesis / Evidence table / PowerPoint-ready storyline / Research brief plus the selected evidence/coverage options).
   - POSTs that request to a secure Quest backend.

2. **Secure Quest backend / Cloudflare Worker**
   - Creates a unique `request_id`.
   - Stores the request and status (`queued`, `running`, `complete`, `failed`).
   - Holds the Workspace Agent access token as a server-side secret.
   - Triggers the published Workspace Agent through its API-trigger channel.
   - Never exposes the token to GitHub Pages.

3. **ChatGPT Workspace Agent**
   - Receives the question and filter payload.
   - Uses its configured apps/tools (for example SharePoint, Google Drive or a custom Quest MCP server) subject to workspace permissions.
   - Produces the answer in the requested format.
   - Must be instructed to call a custom tool such as `quest_publish_answer` before completing.

4. **Quest answer callback tool / custom MCP**
   - Accepts `request_id`, answer, citations, confidence, contradictions/gaps, recommended charts/exhibits and completion status.
   - Writes the result back to the Quest backend.
   - Uses authenticated server-to-server access and least-privilege permissions.

5. **Quest frontend result check**
   - Polls the Quest backend, not ChatGPT, for `/insights/requests/{request_id}`.
   - A 120-second interval is supported if that cadence is required, though a shorter poll or server-sent events can provide a better user experience.
   - If there is no pending user question, there is no agent trigger and no polling work beyond normal idle UI behavior.

## Suggested request contract

```json
{
  "request_id": "uuid-generated-server-side",
  "question": "User's question",
  "project_scope": ["project-id-1", "project-id-2"],
  "evidence_types": ["final_reports", "pmr_transcripts", "survey_data"],
  "output": {
    "format": "executive_synthesis",
    "include_verbatim_transcript_evidence": true,
    "show_confidence_contradictions_coverage": true,
    "recommend_charts_and_slide_exhibits": true
  },
  "requested_by": "authenticated-user-id"
}
```

## Suggested answer callback contract

```json
{
  "request_id": "uuid-generated-server-side",
  "status": "complete",
  "answer_markdown": "...",
  "citations": [
    {
      "source": "...",
      "project": "...",
      "locator": "..."
    }
  ],
  "confidence": "high",
  "contradictions_or_gaps": ["..."],
  "recommended_exhibits": ["..."]
}
```

## Workspace Agent setup required

1. Use an eligible ChatGPT Business / Enterprise / Edu workspace with Workspace Agents enabled by the admin.
2. Create and publish a Workspace Agent dedicated to Quest Enterprise Insights Engine requests.
3. Add an API trigger channel to the agent.
4. Create a Workspace Agent access token with the minimum required scope.
5. Add the required data apps and/or a custom remote MCP tool.
6. Add the `quest_publish_answer` write tool and constrain it to the Quest callback endpoint.
7. In the agent instructions, require the final answer to be posted through `quest_publish_answer` using the supplied `request_id`.

## Recommended backend implementation

The existing project already uses Cloudflare Worker infrastructure, so a Worker is a practical place to host the bridge. A minimal implementation normally needs:

- `POST /insights/requests` — authenticate user, validate filters, persist request, trigger agent.
- `GET /insights/requests/:id` — return current status/result to the Quest frontend.
- `POST /insights/agent-callback` — receive the Workspace Agent's final answer through the custom MCP/action tool.
- Durable storage such as D1/KV depending on retention/audit requirements.
- Rate limiting, request ownership checks and audit logging.

## Recommended behavior

Prefer event-driven submission when the user presses **Generate answer** instead of waking the agent every two minutes. If product requirements require two-minute checks, keep the two-minute polling between the Quest frontend and the Quest backend; do not repeatedly trigger the Workspace Agent for the same request.

## Security notes

- Secrets stay server-side only.
- Enforce Quest Hub Owner / Contributor / Viewer permissions at the backend, not only in browser JavaScript.
- Restrict the agent to the selected projects/evidence types where the connected app/tool supports such constraints.
- Preserve source citations and request/response audit metadata.
- Do not send source documents to services that are not approved for their classification.
