(() => {
  'use strict';

  const RELEASE = '20260810f';
  const DATA_URL = `data/strategic-analysis.json?v=${RELEASE}`;
  const COLORS = {
    dark: '#034c1f', green: '#35792a', lime: '#c6d52f', blue: '#00587c',
    teal: '#3995bb', purple: '#80276c', gold: '#c78800', pink: '#e0044e',
    muted: '#5f6d65', line: '#dbe4dd', soft: '#f5f8f5'
  };

  const BENCHMARK_PARAMETERS = [
    { key: 'position', icon: '◎', label: 'Strategic position & business model', note: 'How the company defines where it competes and the role it is trying to own.' },
    { key: 'commercial_strategy', icon: '🤝', label: 'Enterprise, ecosystem & access model', note: 'How it reaches health systems, clinicians, consumers, partners and adjacent channels.' },
    { key: 'portfolio_strategy', icon: '🧬', label: 'Portfolio & advanced diagnostics', note: 'Where the public portfolio is concentrating: specialty testing, oncology, MRD, screening or precision medicine.' },
    { key: 'operational_strategy', icon: '⚙', label: 'Operating network & delivery model', note: 'How laboratories, logistics, automation, capacity and network design support the strategy.' },
    { key: 'technology_strategy', icon: '✦', label: 'Digital, AI & data strategy', note: 'How workflow integration, AI, data assets and software are being used to create differentiation.' },
    { key: 'marketing_strategy', icon: '◉', label: 'Customer value proposition & market message', note: 'The value story used to influence adoption, trust, convenience and clinical preference.' },
    { key: 'current_focus', icon: '↗', label: 'Current strategic priorities', note: 'The near-term priorities most visible in current public disclosures and announcements.' },
    { key: 'future_focus', icon: '→', label: 'Future direction & innovation thesis', note: 'The next strategic horizon implied by investments, partnerships, product roadmaps and public commitments.' }
  ];

  const LENS_FIELDS = {
    overview: [
      ['Strategic position', 'position', '◎'], ['Current priorities', 'current_focus', '↗'],
      ['Portfolio strategy', 'portfolio_strategy', '🧬'], ['Commercial & ecosystem', 'commercial_strategy', '🤝'],
      ['Operations', 'operational_strategy', '⚙'], ['Digital / AI / data', 'technology_strategy', '✦']
    ],
    portfolio: [
      ['Portfolio strategy', 'portfolio_strategy', '🧬'], ['Current priorities', 'current_focus', '↗'],
      ['Future direction', 'future_focus', '→'], ['Customer value proposition', 'marketing_strategy', '◉']
    ],
    commercial: [
      ['Commercial & ecosystem', 'commercial_strategy', '🤝'], ['Customer value proposition', 'marketing_strategy', '◉'],
      ['Business model', 'business_strategy', '◎'], ['Future direction', 'future_focus', '→']
    ],
    technology: [
      ['Digital / AI / data', 'technology_strategy', '✦'], ['Portfolio strategy', 'portfolio_strategy', '🧬'],
      ['Current priorities', 'current_focus', '↗'], ['Future direction', 'future_focus', '→']
    ],
    operations: [
      ['Operating model', 'operational_strategy', '⚙'], ['Business model', 'business_strategy', '◎'],
      ['Commercial & ecosystem', 'commercial_strategy', '🤝'], ['Future direction', 'future_focus', '→']
    ]
  };

  let DATA = null;
  let selectedId = 'quest';

  const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const byId = id => document.getElementById(id);
  const findView = () => document.querySelector('.view[data-view="news"]');
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  function short(value, max = 210) {
    const text = clean(value);
    if (text.length <= max) return text;
    const clipped = text.slice(0, max + 1);
    const cut = clipped.lastIndexOf(' ');
    return `${clipped.slice(0, cut > max * 0.65 ? cut : max).replace(/[,:;\s]+$/, '')}…`;
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
      }).format(new Date(value));
    } catch (_) {
      return String(value || '');
    }
  }

  function companyMark(name) {
    return String(name || '').split(/[\s/]+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'CI';
  }

  function iconForText(text) {
    const value = clean(text).toLowerCase();
    if (/ai|digital|data|software|platform|ehr|automation|model/.test(value)) return '✦';
    if (/oncolog|cancer|mrd|genom|sequenc|biomarker|precision/.test(value)) return '🧬';
    if (/partner|collabor|joint venture|acqui|merger|ecosystem/.test(value)) return '🤝';
    if (/consumer|screen|patient|access|direct-to-consumer/.test(value)) return '◉';
    if (/lab|logistic|facility|network|operation|capacity/.test(value)) return '⚙';
    return '↗';
  }

  function injectStyles() {
    let style = byId('strategicAnalysisV2Styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'strategicAnalysisV2Styles';
      document.head.appendChild(style);
    }
    style.textContent = `
      .sa2-shell{--sa2-dark:${COLORS.dark};--sa2-green:${COLORS.green};--sa2-lime:${COLORS.lime};--sa2-blue:${COLORS.blue};--sa2-line:${COLORS.line};--sa2-muted:${COLORS.muted};color:#26332c}
      .sa2-shell *{box-sizing:border-box}.sa2-shell .page-heading p{font-size:13px;line-height:1.55;max-width:980px}.sa2-status{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.sa2-status .sa-pill{font-size:11px;padding:7px 10px;border:1px solid var(--sa2-line);background:#fff;border-radius:999px;color:var(--sa2-muted)}
      .sa2-toolbar{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin:14px 0}.sa2-toolbar select{min-height:40px;border:1px solid var(--sa2-line);border-radius:9px;background:#fff;padding:8px 11px;font-size:12px;color:#26332c}.sa2-toolbar .sa2-method{margin-left:auto;font-size:11px;color:var(--sa2-muted);display:flex;align-items:center;gap:7px}.sa2-method i{width:8px;height:8px;border-radius:50%;background:var(--sa2-green);display:inline-block}
      .sa2-summary-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 12px}.sa2-summary-tile{border:1px solid var(--sa2-line);border-radius:13px;background:#fff;padding:12px 13px;display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:center;min-height:72px}.sa2-summary-icon{width:34px;height:34px;border-radius:10px;background:#eef5ea;color:var(--sa2-dark);display:grid;place-items:center;font-size:16px;font-weight:800}.sa2-summary-tile b{display:block;font-size:13px;color:var(--sa2-dark);margin-bottom:2px}.sa2-summary-tile span{display:block;font-size:11px;line-height:1.4;color:var(--sa2-muted)}
      .sa2-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}.sa2-panel{background:#fff;border:1px solid var(--sa2-line);border-radius:14px;padding:16px;min-width:0;box-shadow:0 5px 18px rgba(3,76,31,.035)}.sa2-5{grid-column:span 5}.sa2-6{grid-column:span 6}.sa2-7{grid-column:span 7}.sa2-12{grid-column:span 12}.sa2-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.sa2-head h3{margin:3px 0 4px;font-size:16px;line-height:1.3;color:var(--sa2-dark)}.sa2-head p{margin:0;color:var(--sa2-muted);font-size:11.5px;line-height:1.5}.sa2-kicker{font:800 10px Arial;letter-spacing:1.15px;color:var(--sa2-green)}
      .sa2-company-header{display:flex;align-items:center;gap:11px;margin-bottom:12px}.sa2-company-logo{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#eef5e9,#dfead8);border:1px solid #d4e1d2;color:var(--sa2-dark);display:grid;place-items:center;font-size:14px;font-weight:900;letter-spacing:.03em}.sa2-company-header h4{font-size:15px;margin:0;color:var(--sa2-dark)}.sa2-company-header p{font-size:11px;color:var(--sa2-muted);margin:3px 0 0;line-height:1.4}.sa2-priority{margin-left:auto;padding:5px 8px;background:#eef5ea;border-radius:999px;color:var(--sa2-green);font-size:10px;font-weight:800}
      .sa2-profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.sa2-focus-card{border:1px solid #e3eae4;border-radius:11px;padding:11px;background:#fbfdfb}.sa2-focus-card strong{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--sa2-green);text-transform:uppercase;letter-spacing:.035em;margin-bottom:5px}.sa2-focus-card strong i{font-style:normal;font-size:15px}.sa2-focus-card p{margin:0;font-size:12px;line-height:1.52;color:#3e4b43}.sa2-response{margin-top:10px;border-left:4px solid var(--sa2-lime);background:#f8fbf4;border-radius:9px;padding:11px 12px}.sa2-response b{display:block;font-size:11px;color:var(--sa2-dark);margin-bottom:4px}.sa2-response p{margin:0;font-size:12px;line-height:1.5;color:#425046}
      .sa2-watch-list{display:grid;gap:8px}.sa2-watch{border:1px solid #e5e9e5;border-radius:10px;padding:10px 11px;background:#fff}.sa2-watch.critical{border-left:4px solid ${COLORS.pink};background:#fff8fa}.sa2-watch.high{border-left:4px solid ${COLORS.gold};background:#fffdf7}.sa2-watch.opportunity{border-left:4px solid var(--sa2-green);background:#f9fcf7}.sa2-watch strong{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--sa2-dark)}.sa2-watch p{font-size:11.5px;line-height:1.5;color:var(--sa2-muted);margin:5px 0 0}
      .sa2-timeline-wrap{overflow-x:auto;padding:5px 2px 4px}.sa2-timeline{position:relative;display:grid;grid-template-columns:repeat(6,minmax(180px,1fr));gap:0;min-width:1080px;padding:0 0 4px}.sa2-timeline:before{content:'';position:absolute;left:7%;right:7%;top:57px;height:3px;background:linear-gradient(90deg,#d6e3d4,var(--sa2-green),#d6e3d4);border-radius:99px}.sa2-month{position:relative;padding:0 10px}.sa2-month-head{text-align:center;min-height:50px}.sa2-month-head b{display:block;font-size:13px;color:var(--sa2-dark)}.sa2-month-head span{font-size:10px;color:var(--sa2-muted)}.sa2-node{position:relative;z-index:2;width:18px;height:18px;border-radius:50%;margin:0 auto 12px;background:var(--sa2-green);border:4px solid #fff;box-shadow:0 0 0 2px var(--sa2-green)}.sa2-month.continuity .sa2-node{background:#c9d8c4;box-shadow:0 0 0 2px #9fb49a}.sa2-month-card{border:1px solid #e2e9e2;border-radius:11px;background:#fbfdfb;padding:10px;min-height:116px}.sa2-month-card strong{display:flex;gap:6px;align-items:center;font-size:11px;color:var(--sa2-green);margin-bottom:5px}.sa2-month-card p{font-size:11px;line-height:1.48;color:#46534b;margin:0}.sa2-month.continuity .sa2-month-card{background:#f8faf8}.sa2-month.continuity .sa2-month-card strong{color:#71806f}
      .sa2-vector-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.sa2-vector{border:1px solid #e1e8e2;border-radius:11px;padding:11px;background:#fbfdfb}.sa2-vector-top{display:flex;gap:8px;align-items:center}.sa2-vector-icon{width:30px;height:30px;border-radius:9px;background:#eef5ea;display:grid;place-items:center;font-size:14px}.sa2-vector b{font-size:12px;color:var(--sa2-dark);line-height:1.3}.sa2-vector small{display:block;color:var(--sa2-muted);font-size:10.5px;margin-top:3px}.sa2-vector-bar{height:7px;background:#edf1ed;border-radius:999px;overflow:hidden;margin-top:9px}.sa2-vector-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--sa2-green),var(--sa2-lime));border-radius:999px}.sa2-vector-tag{display:inline-block;margin-top:8px;padding:4px 7px;border-radius:999px;background:#eef5ea;color:var(--sa2-green);font-size:10px;font-weight:800}
      .sa2-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.sa2-source{border:1px solid #e2e9e3;border-radius:10px;padding:10px 11px;background:#fff;display:grid;grid-template-columns:34px 1fr auto;gap:9px;align-items:center}.sa2-source-icon{width:34px;height:34px;border-radius:9px;background:#edf4e9;display:grid;place-items:center;color:var(--sa2-dark);font-size:14px}.sa2-source b{display:block;font-size:11.5px;color:#26332c}.sa2-source span{display:block;font-size:10px;color:var(--sa2-muted);margin-top:2px}.sa2-source a{font-size:11px;font-weight:800;color:var(--sa2-blue);text-decoration:none;white-space:nowrap}
      .sa2-benchmark{grid-column:1/-1;margin-top:2px}.sa2-benchmark-note{display:flex;gap:9px;align-items:flex-start;padding:10px 12px;background:#f7faf6;border:1px solid #e0e8df;border-radius:10px;margin-bottom:11px;font-size:11.5px;line-height:1.5;color:#455249}.sa2-benchmark-note i{font-style:normal;font-size:17px}.sa2-benchmark-scroll{overflow:auto;border:1px solid var(--sa2-line);border-radius:11px;max-height:690px}.sa2-benchmark-table{border-collapse:separate;border-spacing:0;min-width:2420px;width:100%;background:#fff}.sa2-benchmark-table th,.sa2-benchmark-table td{border-right:1px solid #e5ebe6;border-bottom:1px solid #e5ebe6;vertical-align:top;text-align:left}.sa2-benchmark-table thead th{position:sticky;top:0;z-index:4;background:var(--sa2-dark);color:#fff;padding:10px;min-width:215px}.sa2-benchmark-table thead th:first-child{left:0;z-index:6;min-width:250px}.sa2-benchmark-table tbody th{position:sticky;left:0;z-index:3;width:250px;min-width:250px;background:#f5f8f5;padding:12px}.sa2-benchmark-table tbody td{padding:12px;min-width:215px;width:215px;font-size:11.5px;line-height:1.52;color:#3f4c44}.sa2-param{display:flex;gap:9px;align-items:flex-start}.sa2-param-icon{width:31px;height:31px;flex:0 0 31px;border-radius:9px;background:#e8f1e5;color:var(--sa2-dark);display:grid;place-items:center;font-size:14px}.sa2-param b{display:block;font-size:12px;color:var(--sa2-dark);margin-bottom:3px}.sa2-param span{display:block;font-size:10.5px;line-height:1.4;color:var(--sa2-muted);font-weight:400}.sa2-bench-company{display:flex;gap:8px;align-items:center}.sa2-bench-mark{width:31px;height:31px;border-radius:8px;background:rgba(255,255,255,.14);display:grid;place-items:center;font-size:10px;font-weight:900}.sa2-bench-company b{font-size:11px;line-height:1.25}.sa2-bench-company a{display:block;color:#dcead7;font-size:9.5px;margin-top:2px;text-decoration:none}.sa2-benchmark-table tr:last-child th,.sa2-benchmark-table tr:last-child td{border-bottom:0}
      .sa2-footer-note{font-size:10.5px;line-height:1.5;color:var(--sa2-muted);margin:10px 0 0}.sa2-empty{padding:20px;border:1px dashed var(--sa2-line);border-radius:10px;text-align:center;color:var(--sa2-muted);font-size:12px}
      @media(max-width:1100px){.sa2-summary-strip{grid-template-columns:repeat(2,1fr)}.sa2-5,.sa2-6,.sa2-7{grid-column:span 12}.sa2-vector-grid{grid-template-columns:repeat(2,1fr)}.sa2-profile-grid{grid-template-columns:1fr}.sa2-source-grid{grid-template-columns:1fr}.sa2-toolbar .sa2-method{width:100%;margin-left:0}}
      @media(max-width:680px){.sa2-summary-strip{grid-template-columns:1fr}.sa2-vector-grid{grid-template-columns:1fr}.sa2-panel{padding:13px}.sa2-head h3{font-size:15px}.sa2-shell .page-heading p{font-size:12px}.sa2-toolbar select{width:100%}}
    `;
  }

  function replaceNavigationText(root = document) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.nodeValue && /News Intelligence/.test(node.nodeValue)) {
        node.nodeValue = node.nodeValue.replaceAll('News Intelligence', 'Strategic Analysis');
      }
    });
  }

  function monthWindow(endValue, count = 6) {
    const parsed = new Date(endValue || Date.now());
    const end = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    const anchor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    const months = [];
    for (let offset = count - 1; offset >= 0; offset -= 1) {
      const date = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - offset, 1));
      months.push({
        key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        label: date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
        full: date.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      });
    }
    return months;
  }

  function eventMatchesMonth(eventDate, month) {
    const value = clean(eventDate);
    if (!value) return false;
    if (value.startsWith(month.key) || value.includes(month.key)) return true;
    const range = value.match(/(20\d{2})-(\d{2})\/(\d{2})/);
    if (range && Number(range[1]) === month.year) {
      return Number(range[2]) === month.month || Number(range[3]) === month.month;
    }
    return false;
  }

  function timelineItems(company) {
    const months = monthWindow(DATA?.metadata?.last_updated, 6);
    const events = Array.isArray(company?.timeline) ? company.timeline : [];
    const continuityFields = ['business_strategy', 'operational_strategy', 'portfolio_strategy', 'commercial_strategy', 'technology_strategy', 'future_focus'];
    return months.map((month, index) => {
      const matches = events.filter(event => eventMatchesMonth(event.date, month));
      if (matches.length) {
        const text = matches.map(item => clean(item.event)).filter(Boolean).join(' ');
        return { ...month, status: 'shift', icon: iconForText(text), title: 'Public strategy activity', text: short(text, 235) };
      }
      const continuity = company?.[continuityFields[index]] || company?.current_focus || company?.position || '';
      return {
        ...month,
        status: 'continuity', icon: '·', title: 'Direction held',
        text: `No material public strategy shift identified in the reviewed source set. Ongoing emphasis: ${short(continuity, 160)}`
      };
    });
  }

  function intensityLabel(value) {
    const n = Number(value || 0);
    if (n >= 85) return 'Strongly scaling';
    if (n >= 70) return 'Scaling';
    if (n >= 55) return 'Building';
    return 'Developing';
  }

  function sourceIcon(type) {
    const value = clean(type).toLowerCase();
    if (/sec|annual|financial|earnings/.test(value)) return '▤';
    if (/investor|presentation/.test(value)) return '▥';
    if (/regulatory|fda|coverage/.test(value)) return '✓';
    return '↗';
  }

  function renderCompanyProfile(company, lens) {
    const fields = LENS_FIELDS[lens] || LENS_FIELDS.overview;
    const cards = fields.map(([label, key, icon]) => `
      <article class="sa2-focus-card">
        <strong><i>${esc(icon)}</i>${esc(label)}</strong>
        <p>${esc(company?.[key] || 'No substantive public statement is available in the current research set.')}</p>
      </article>`).join('');
    return `
      <div class="sa2-company-header">
        <div class="sa2-company-logo">${esc(companyMark(company.name))}</div>
        <div><h4>${esc(company.name)}</h4><p>${esc(company.type || '')}</p></div>
        <span class="sa2-priority">${esc(company.priority || 'Tracked')}</span>
      </div>
      <div class="sa2-profile-grid">${cards}</div>
      <div class="sa2-response"><b>Quest response lens</b><p>${esc(company.quest_response || '')}</p></div>`;
  }

  function renderTimeline(company) {
    return `<div class="sa2-timeline-wrap"><div class="sa2-timeline">${timelineItems(company).map(item => `
      <div class="sa2-month ${item.status === 'continuity' ? 'continuity' : ''}">
        <div class="sa2-month-head"><b>${esc(item.label)}</b><span>${esc(item.year)}</span></div>
        <div class="sa2-node" title="${esc(item.status === 'shift' ? 'Public strategy activity' : 'No material public shift identified')}"></div>
        <div class="sa2-month-card"><strong><span>${esc(item.icon)}</span>${esc(item.title)}</strong><p>${esc(item.text)}</p></div>
      </div>`).join('')}</div></div>`;
  }

  function renderVectors() {
    const patterns = Array.isArray(DATA?.market_patterns) ? DATA.market_patterns.slice(0, 6) : [];
    if (!patterns.length) return '<div class="sa2-empty">No market-direction patterns are available.</div>';
    return `<div class="sa2-vector-grid">${patterns.map(pattern => `
      <article class="sa2-vector">
        <div class="sa2-vector-top"><div class="sa2-vector-icon">${esc(iconForText(pattern.theme))}</div><div><b>${esc(pattern.theme)}</b><small>${esc(pattern.direction || '')}</small></div></div>
        <div class="sa2-vector-bar" aria-label="${esc(intensityLabel(pattern.intensity))}"><i style="width:${Math.max(8, Math.min(100, Number(pattern.intensity || 0)))}%"></i></div>
        <span class="sa2-vector-tag">${esc(intensityLabel(pattern.intensity))}</span>
      </article>`).join('')}</div>`;
  }

  function renderSources(company) {
    const sources = Array.isArray(company?.sources) ? company.sources : [];
    if (!sources.length) return '<div class="sa2-empty">No public evidence links are stored for this company.</div>';
    return `<div class="sa2-source-grid">${sources.map(source => `
      <article class="sa2-source">
        <div class="sa2-source-icon">${esc(sourceIcon(source.type))}</div>
        <div><b>${esc(source.label)}</b><span>${esc(source.type)}</span></div>
        <a href="${esc(source.url)}" target="_blank" rel="noopener">Open ↗</a>
      </article>`).join('')}</div>`;
  }

  function benchmarkStatement(company, parameter) {
    const value = company?.[parameter.key];
    if (value) return short(value, 250);
    return 'No substantive public statement was identified for this parameter in the current reviewed source set.';
  }

  function renderBenchmark() {
    const companies = Array.isArray(DATA?.companies) ? DATA.companies : [];
    const head = companies.map(company => {
      const source = Array.isArray(company.sources) && company.sources[0] ? company.sources[0] : null;
      return `<th><div class="sa2-bench-company"><div class="sa2-bench-mark">${esc(companyMark(company.name))}</div><div><b>${esc(company.name)}</b>${source ? `<a href="${esc(source.url)}" target="_blank" rel="noopener">Public evidence ↗</a>` : ''}</div></div></th>`;
    }).join('');
    const body = BENCHMARK_PARAMETERS.map(parameter => `
      <tr>
        <th><div class="sa2-param"><div class="sa2-param-icon">${esc(parameter.icon)}</div><div><b>${esc(parameter.label)}</b><span>${esc(parameter.note)}</span></div></div></th>
        ${companies.map(company => `<td>${esc(benchmarkStatement(company, parameter))}</td>`).join('')}
      </tr>`).join('');
    return `
      <div class="sa2-benchmark-note"><i>◫</i><div><b>Qualitative benchmark only.</b> Parameters were selected because they recur across current public company strategy materials: enterprise/ecosystem access, advanced diagnostics, operating model, AI/data, customer proposition, current priorities and future direction. The cells contain public-source qualitative statements; no 1–5 score, percentage, ranking or momentum index is used.</div></div>
      <div class="sa2-benchmark-scroll"><table class="sa2-benchmark-table"><thead><tr><th>Benchmark parameter</th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function strategicTemplate() {
    const data = DATA;
    const company = data.companies.find(item => item.id === selectedId) || data.companies[0];
    const last = formatDate(data.metadata.last_updated);
    return `<section class="view sa2-shell" data-view="news" data-strategic-analysis="true" data-strategic-analysis-v2="true">
      <div class="page-heading">
        <div>
          <span class="section-kicker">COMPETITIVE INTELLIGENCE · STRATEGY</span>
          <h1>Strategic Analysis</h1>
          <p>Evidence-led view of Quest and competitor strategy, focused on business direction, portfolio choices, operating models, ecosystem plays, digital/AI moves and month-by-month strategy evolution.</p>
          <div class="sa-status sa2-status"><span class="sa-pill"><b>Last updated:</b> ${esc(last)} IST</span><span class="sa-pill">Current public-source review</span><span class="sa-pill">Official releases · filings · investor materials</span><span class="sa-pill">Qualitative benchmarking</span></div>
        </div>
        <div class="heading-actions"><button class="secondary-button" id="sa2Refresh">↻ Refresh view</button><button class="primary-button" id="sa2Export">↓ Export strategy brief</button></div>
      </div>

      <div class="sa2-toolbar">
        <select id="sa2Company" aria-label="Select company">${data.companies.map(item => `<option value="${esc(item.id)}" ${item.id === company.id ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select>
        <select id="sa2Lens" aria-label="Select strategy lens"><option value="overview">All strategy lenses</option><option value="portfolio">Portfolio & innovation</option><option value="commercial">Commercial & ecosystem</option><option value="technology">Digital / AI / data</option><option value="operations">Operations & network</option></select>
        <span class="sa2-method"><i></i>Benchmark parameters are derived from recurring themes in current public evidence.</span>
      </div>

      <div class="sa2-summary-strip">
        <div class="sa2-summary-tile"><div class="sa2-summary-icon">◫</div><div><b>${data.companies.length} companies</b><span>Quest plus priority laboratory, precision-oncology and MedTech comparators</span></div></div>
        <div class="sa2-summary-tile"><div class="sa2-summary-icon">≡</div><div><b>${BENCHMARK_PARAMETERS.length} qualitative parameters</b><span>Statements only — numeric capability scoring removed</span></div></div>
        <div class="sa2-summary-tile"><div class="sa2-summary-icon">→</div><div><b>Six-month activity flow</b><span>Month-on-month public strategy change or explicit continuity</span></div></div>
        <div class="sa2-summary-tile"><div class="sa2-summary-icon">✓</div><div><b>Evidence linked</b><span>Company source cards connect the analysis back to public materials</span></div></div>
      </div>

      <div class="sa2-grid">
        <article class="sa2-panel sa2-7"><div class="sa2-head"><div><span class="sa2-kicker">COMPANY STRATEGY</span><h3 id="sa2CompanyTitle">${esc(company.name)}</h3><p>Readable strategy profile organized around the selected evidence lens.</p></div></div><div id="sa2CompanyProfile"></div></article>
        <article class="sa2-panel sa2-5"><div class="sa2-head"><div><span class="sa2-kicker">QUEST RESPONSE</span><h3>Threats, watch items and white space</h3><p>Competitive implications remain separate from the removed warning-radar visualization.</p></div></div><div class="sa2-watch-list" id="sa2WatchList"></div></article>

        <article class="sa2-panel sa2-12"><div class="sa2-head"><div><span class="sa2-kicker">STRATEGY EVOLUTION</span><h3>Month-on-month activity flow — last six months</h3><p>Horizontal sequence of public strategy activity for the selected company. Months without a material public shift are marked as continuity rather than filled with invented events.</p></div></div><div id="sa2Timeline"></div></article>

        <article class="sa2-panel sa2-12"><div class="sa2-head"><div><span class="sa2-kicker">MARKET DIRECTION</span><h3>Strategic vectors shaping diagnostics and MedTech competition</h3><p>Compact qualitative infographic; bar length indicates relative signal intensity while the displayed interpretation remains qualitative.</p></div></div><div id="sa2Vectors"></div></article>

        <article class="sa2-panel sa2-12"><div class="sa2-head"><div><span class="sa2-kicker">PUBLIC EVIDENCE</span><h3>Sources for the selected company</h3><p>Annual reports, filings, investor materials, earnings releases and official strategic announcements.</p></div></div><div id="sa2Sources"></div><p class="sa2-footer-note">${esc(data.metadata.scope_note || '')}</p></article>

        <article class="sa2-panel sa2-benchmark"><div class="sa2-head"><div><span class="sa2-kicker">COMPETITIVE BENCHMARK</span><h3>Quest vs. competitors — qualitative public-data strategy matrix</h3><p>Parameters are in rows and companies are in columns. Each cell contains a qualitative public-source strategy statement rather than a numeric score.</p></div></div><div id="sa2Benchmark"></div></article>
      </div>
    </section>`;
  }

  function renderWatchList(company) {
    const warnings = (DATA?.warnings || []).slice(0, 3);
    const opportunities = (DATA?.opportunities || []).slice(0, 3);
    const threat = company?.threat_to_quest && company.id !== 'quest'
      ? `<div class="sa2-watch high"><strong>⚑ Selected-company pressure</strong><p>${esc(company.threat_to_quest)}</p></div>`
      : '';
    const warningHtml = warnings.map(item => `<div class="sa2-watch ${item.severity === 'Critical' ? 'critical' : 'high'}"><strong>${item.severity === 'Critical' ? '!' : '⚑'} ${esc(item.title)}</strong><p>${esc(item.detail)}</p></div>`).join('');
    const opportunityHtml = opportunities.map(item => `<div class="sa2-watch opportunity"><strong>◇ ${esc(item.title)}</strong><p>${esc(item.detail)}</p></div>`).join('');
    return `${threat}${warningHtml}${opportunityHtml}` || '<div class="sa2-empty">No watch items are available.</div>';
  }

  function renderSelectedCompany() {
    if (!DATA) return;
    const company = DATA.companies.find(item => item.id === selectedId) || DATA.companies[0];
    const lens = byId('sa2Lens')?.value || 'overview';
    if (byId('sa2CompanyTitle')) byId('sa2CompanyTitle').textContent = company.name;
    if (byId('sa2CompanyProfile')) byId('sa2CompanyProfile').innerHTML = renderCompanyProfile(company, lens);
    if (byId('sa2WatchList')) byId('sa2WatchList').innerHTML = renderWatchList(company);
    if (byId('sa2Timeline')) byId('sa2Timeline').innerHTML = renderTimeline(company);
    if (byId('sa2Sources')) byId('sa2Sources').innerHTML = renderSources(company);
  }

  function exportBrief() {
    if (!DATA) return;
    const company = DATA.companies.find(item => item.id === selectedId) || DATA.companies[0];
    const lines = [
      `# Strategic Analysis — ${company.name}`,
      `Updated: ${DATA.metadata.last_updated}`,
      '',
      '## Strategic position', company.position || '',
      '', '## Current priorities', company.current_focus || '',
      '', '## Portfolio strategy', company.portfolio_strategy || '',
      '', '## Commercial & ecosystem strategy', company.commercial_strategy || '',
      '', '## Operating model', company.operational_strategy || '',
      '', '## Digital / AI / data strategy', company.technology_strategy || '',
      '', '## Future direction', company.future_focus || '',
      '', '## Quest response lens', company.quest_response || '',
      '', '## Six-month activity flow',
      ...timelineItems(company).map(item => `- ${item.full}: ${item.title} — ${item.text}`)
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quest-strategic-analysis-${company.id}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function wire() {
    byId('sa2Company')?.addEventListener('change', event => {
      selectedId = event.target.value;
      renderSelectedCompany();
    });
    byId('sa2Lens')?.addEventListener('change', renderSelectedCompany);
    byId('sa2Refresh')?.addEventListener('click', () => boot(true));
    byId('sa2Export')?.addEventListener('click', exportBrief);
  }

  function mount() {
    const old = findView();
    if (!old || !DATA) return false;
    const active = old.classList.contains('active');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = strategicTemplate().trim();
    const fresh = wrapper.firstElementChild;
    if (active) fresh.classList.add('active');
    old.replaceWith(fresh);
    wire();
    renderSelectedCompany();
    byId('sa2Vectors').innerHTML = renderVectors();
    byId('sa2Benchmark').innerHTML = renderBenchmark();
    replaceNavigationText(document);
    document.documentElement.dataset.strategicAnalysisRelease = RELEASE;
    return true;
  }

  async function loadData(force = false) {
    const response = await fetch(`${DATA_URL}${force ? `&t=${Date.now()}` : ''}`, { cache: force ? 'no-store' : 'default' });
    if (!response.ok) throw new Error(`Strategic analysis data returned HTTP ${response.status}`);
    DATA = await response.json();
    if (!DATA?.companies?.length) throw new Error('Strategic analysis data contains no companies.');
    if (!DATA.companies.some(item => item.id === selectedId)) selectedId = DATA.companies[0].id;
  }

  async function boot(force = false) {
    injectStyles();
    replaceNavigationText(document);
    try {
      await loadData(force);
    } catch (error) {
      console.error('Strategic Analysis v2 data load failed:', error);
      return;
    }
    let attempts = 0;
    const tryMount = () => {
      attempts += 1;
      if (mount() || attempts > 30) return;
      setTimeout(tryMount, 120);
    };
    tryMount();
  }

  window.addEventListener('quest:layout-refresh', event => {
    if (event.detail?.group === 'strategic' && DATA) setTimeout(mount, 40);
  });
  document.addEventListener('click', event => {
    const target = event.target?.closest?.('.nav-item,[data-view],a,button');
    if (target && /Strategic Analysis|News Intelligence/i.test(target.textContent || '')) setTimeout(() => {
      if (DATA) mount();
    }, 80);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot(), { once: true });
  else boot();
})();
