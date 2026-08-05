# Competitor Profiles Expansion

Updated: 05 August 2026

## Competitors included

1. Labcorp
2. ARUP Laboratories
3. Mayo Clinic Laboratories
4. Sonic Healthcare USA
5. Eurofins Scientific
6. Exact Sciences
7. Guardant Health
8. Tempus AI
9. Natera
10. NeoGenomics Laboratories
11. Myriad Genetics
12. QIAGEN

## User experience

- Search by competitor, capability, product, customer segment, or geography.
- Filter by competitor type and strategic priority.
- Mark profiles as favorites.
- Export the profile index as CSV.
- Select competitors for side-by-side comparison.
- Open every profile as a detailed interactive intelligence page.
- Navigate back to the profile index without leaving the application.

## Detailed profile sections

Every profile contains the following structured modules:

1. Company overview: background, history, headquarters, milestones, mission, leadership, workforce, locations, financial position, profitability, and investment capacity.
2. Target audience and market: customer segments, served industries, geographies, market position, share indicators, and whitespace opportunities.
3. Products, services, and pricing: portfolio, differentiators, technical capabilities, pricing model, bundles, innovation cadence, R&D, and intellectual property signals.
4. Marketing, communication, and distribution: positioning, messages, marketing channels, digital presence, sales channels, logistics, and partner networks.
5. Customer and market insights: perception, sentiment, loyalty, retention, customer journey, touchpoints, and friction points.
6. Operational and organizational capabilities: operating model, supply chain, scalability, talent, culture, leadership quality, partnerships, acquisitions, and market-entry moves.
7. Competitive benchmarking: SWOT, weighted Competitive Profile Matrix, Porter’s Five Forces, value-chain analysis, capability scores, and strategic implications for Quest.
8. Tools and data sources: annual reports, SEC filings, company websites, press releases, public financial data, digital analytics, social listening, industry databases, and expert-network validation recommendations.

## Evidence treatment

- Publicly disclosed facts are presented separately from directional analytical estimates.
- Private-company financials and market-share indicators are labeled when they are not publicly disclosed.
- Each profile includes clickable source links and an evidence/source register.
- Strategic scores, sentiment, retention, and some digital-performance measures are directional placeholders pending licensed-data and primary-research validation.

## Technical integration

The module is loaded through `integrations/competitor-intelligence-profiles/loader.js`. The loader reconstructs the compressed application and profile-data bundles in the browser, validates the JSON payload, creates a temporary data URL, and mounts the expanded experience over the existing `competitors` view.
