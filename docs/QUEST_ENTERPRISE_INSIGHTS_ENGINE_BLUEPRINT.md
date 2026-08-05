# Quest Enterprise Insights Engine — Implementation Blueprint

## Client requirement interpretation

Quest needs an enterprise insights engine rather than another standalone generative-AI notebook. The solution must turn historical primary market research into a governed, reusable and continuously learning institutional asset.

The key requirements are:

1. Cross-project intelligence across all available research by default, with optional selection of one or more projects.
2. Evidence-type controls so users can restrict answers to final reports, PMR transcripts, raw survey data, research instruments, presentations, competitive intelligence or newly uploaded files.
3. User-driven ingestion of new files, followed by classification, project assignment, permission tagging, indexing and inclusion/exclusion from retrieval.
4. SharePoint and other enterprise-data connections with permission-aware, incremental synchronization.
5. Dedicated respondent-level survey analytics rather than document-only analysis.
6. Combined analysis of structured survey data and unstructured qualitative evidence.
7. Evidence-backed answers with citations, confidence, contradictions and coverage gaps.
8. Presentation-ready outputs aligned to Quest templates.
9. Robustness and scalability beyond NotebookLM through metadata, hybrid retrieval, structured-query tools, governance and enterprise connectors.
10. Continuous reuse of historical research to reduce duplicate effort and accelerate KBQ response.

## Frontend capabilities implemented

The prototype now includes:

- An Enterprise Insights Engine replacing the former simple Copilot interface.
- All-project default scope and multi-project selection.
- Evidence-type selection.
- Upload-and-classify workflow for new evidence.
- Repository destination, project, approval and access selection.
- Local simulated indexing and retrieval inclusion.
- Output modes: executive synthesis, evidence table, PowerPoint-ready storyline and research brief.
- Confidence, contradiction, quote and chart controls.
- SharePoint, OneDrive, Google Drive, NotebookLM export, Qualtrics and Power BI/Fabric connector controls.
- A dedicated Survey Analytics Lab.
- Direct browser analysis of CSV, TSV, JSON, XLSX and XLS files.
- Topline, segment, driver and open-ended theme visualizations.
- A governed Knowledge Repository page.
- An enterprise ingestion and architecture narrative.
- Existing competitive-intelligence, project-tracker and dashboard capabilities retained.

## Important prototype boundary

GitHub Pages is a static frontend. The interface demonstrates the complete user workflow, but production document storage, SharePoint authentication, secure file ingestion, model execution, vector indexing, survey statistics, access control and PowerPoint generation require backend services.

Do not place Quest data, access tokens, client secrets or confidential transcripts in a public GitHub repository.

## Production use cases

### 1. Cross-project KBQ synthesis

Example question:

> What unmet needs recur across Health Systems, Physician Groups and interoperability studies, and how strong is the evidence by segment?

Process:

1. User keeps all projects selected or chooses the relevant projects.
2. User selects final reports, transcripts and survey data.
3. The query service translates the business question into retrieval and analysis tasks.
4. Hybrid search retrieves report findings and transcript excerpts.
5. The survey service calculates segment-level metrics and significance.
6. The synthesis service reconciles evidence, contradictions and study context.
7. The answer contains citations, confidence and recommended exhibits.
8. An Evalueserve analyst can review before publication.

Recommended tools:

- Microsoft Entra ID
- Microsoft Graph / SharePoint API
- Azure AI Search or an equivalent hybrid search service
- Azure OpenAI, OpenAI API or another approved enterprise LLM
- Python analytics service using pandas, scipy, statsmodels and survey-specific routines
- PostgreSQL or Azure SQL for project metadata and audit data
- Blob/Object storage for original files and extracted artifacts

### 2. New-file ingestion

Process:

1. User uploads a file or selects it through a connected SharePoint folder.
2. Malware scanning and file validation run first.
3. The extraction service identifies format and extracts text, tables, slide notes, images and metadata.
4. The classification service proposes project, evidence type, method, sample and access tags.
5. The user confirms where the file belongs and whether it should enter retrieval.
6. Duplicate detection compares content hashes and document similarity.
7. Evidence objects are created with source-level lineage.
8. A human-review task is generated when required.
9. The search index is updated incrementally.

Recommended tools:

- Azure Functions, Container Apps or AWS Lambda/ECS
- Microsoft Defender or approved malware scanning
- Azure AI Document Intelligence or equivalent document extraction
- Apache Tika / LibreOffice conversion for broad format coverage
- Python parsers for XLSX, CSV, SPSS, SAS and survey exports
- Event Grid, Service Bus, SQS or Kafka for asynchronous processing

### 3. SharePoint integration

Process:

1. Register an application in Microsoft Entra ID.
2. Obtain Quest approval and admin consent for the required Microsoft Graph permissions.
3. Use delegated access or approved application permissions with site-level restriction.
4. Store tokens in Key Vault or another secrets manager.
5. Enumerate approved sites, libraries and folders.
6. Use Microsoft Graph delta queries and webhooks for incremental changes.
7. Preserve SharePoint permissions in the retrieval index.
8. Revoke indexed access when source access changes.

Recommended permissions should be minimized and confirmed with Quest security. Prefer `Sites.Selected` or equivalent restricted-site access rather than tenant-wide access.

### 4. Raw survey analysis

Supported analytical scenarios:

- Topline distributions
- Cross-tabulations
- Weighting
- Statistical significance tests
- Derived variables and recodes
- Driver analysis
- Segmentation
- MaxDiff or conjoint modules where appropriate
- Open-ended coding and sentiment
- Integration with interview evidence

Process:

1. Ingest respondent data, codebook, questionnaire and weighting variables.
2. Normalize variable names, labels and value codes.
3. Validate respondent counts, missingness, routing and outliers.
4. Apply weights and filters.
5. Execute the requested analysis through deterministic code.
6. Send only calculated outputs and limited supporting rows to the LLM for interpretation.
7. Link the narrative back to exact variables, bases and statistical tests.
8. Triangulate with qualitative evidence from related projects.

Recommended tools:

- Python: pandas, numpy, scipy, statsmodels, scikit-learn
- R for specialist survey weighting and advanced research methods where preferred
- Displayr/Q or Qualtrics APIs where Quest already licenses them
- DuckDB or a warehouse for efficient respondent-level querying

### 5. Transcript and qualitative synthesis

Process:

1. Split transcripts by speaker turn and question context rather than fixed-size chunks only.
2. Preserve respondent type, organization, segment, interview date, project and question metadata.
3. Create coded themes and verbatim evidence objects.
4. Retrieve by business question, theme and stakeholder segment.
5. Distinguish prevalence from illustrative evidence.
6. Prevent one articulate respondent from being treated as majority opinion.
7. Show sample coverage and contradictory perspectives.

Recommended tools:

- Speaker-aware transcript parser
- Project ontology / knowledge graph
- Hybrid keyword and semantic retrieval
- Human-coded themes where high-stakes interpretation is involved

### 6. Combined structured and unstructured analysis

Process:

1. The planner determines whether the question requires documents, transcripts, survey calculations or all three.
2. Structured queries run against survey datasets.
3. Retrieval runs against reports and transcripts.
4. A fusion layer maps both outputs to common concepts, segments and KBQs.
5. The synthesis model explains alignment, tension and evidence gaps.
6. The final answer separates quantitative findings from qualitative interpretation.

### 7. Presentation-ready outputs

Output scenarios:

- One-page executive summary
- Evidence table
- Research brief
- PowerPoint storyline
- Chart pack
- Competitor profile
- Opportunity matrix
- Leadership email or briefing note

Process:

1. User chooses the output type.
2. The engine creates a structured content model, not just prose.
3. A template service maps headlines, evidence, citations and charts into Quest-approved layouts.
4. Charts are generated from deterministic data outputs.
5. All sources are included in slide notes or an appendix.
6. A review workflow validates figures and wording before download.

Recommended tools:

- PptxGenJS, python-pptx or approved Microsoft Graph/PowerPoint automation
- Quest master templates stored in a governed template library
- Chart service using Python, Power BI or Vega

## Recommended target architecture

1. **Experience layer:** React/Next.js or the current frontend design implemented in an enterprise web app.
2. **Identity layer:** Microsoft Entra ID SSO and role-based access control.
3. **API gateway:** authenticated endpoints, rate limits and audit headers.
4. **Connector layer:** SharePoint, OneDrive, Google Drive, Qualtrics, Power BI and CI sources.
5. **Ingestion layer:** queues, extraction workers, OCR where required, metadata classification and deduplication.
6. **Storage layer:** original files, extracted artifacts, relational metadata and audit logs.
7. **Intelligence layer:** hybrid search, structured survey query service, ontology and optional knowledge graph.
8. **Orchestration layer:** query planner, retrieval, analytics tools, synthesis and validation.
9. **Output layer:** citations, charts, reports and PowerPoint generation.
10. **Governance layer:** permissions, approval, retention, monitoring, prompt/model versions and human review.

## What Quest / Evalueserve needs to provide

1. Approved SharePoint site/folder list and sample folder structure.
2. Microsoft Entra ID and Graph API security decision.
3. User roles and access matrix.
4. Representative files for each format: PPTX, PDF, DOCX, transcripts, XLSX/CSV/SPSS survey exports and questionnaires.
5. Project taxonomy and required metadata fields.
6. Quest PowerPoint master templates and preferred executive-output formats.
7. A set of representative KBQs and expected gold-standard answers.
8. Survey-analysis methods, weighting rules and significance conventions.
9. Data residency, retention, confidentiality and model-provider requirements.
10. Approval on whether Evalueserve or Quest hosts the production platform.

## Pilot recommendation

Start with three representative projects:

- One qualitative-only study
- One mixed qualitative and quantitative study
- One historical or cross-functional study

Include one SharePoint library, 20–50 transcripts, two final reports, one respondent-level survey dataset and one Quest template. Evaluate the pilot on answer accuracy, citation validity, survey calculation accuracy, turnaround time, analyst-edit effort and stakeholder usefulness.
