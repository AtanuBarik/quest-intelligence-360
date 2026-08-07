(() => {
  'use strict';

  const jsParts = ['chunk-00.b64','chunk-01.b64','chunk-02.b64','chunk-03.b64','chunk-04.b64','chunk-05.b64'];
  const dataParts = ['data-00.b64','data-01.b64','data-02.b64','data-03.b64'];
  const RELEASE = '2026-08-07a';

  async function inflateBase64(paths, base) {
    const responses = await Promise.all(paths.map(name => fetch(new URL(`${name}?v=${RELEASE}`, base), { cache: 'no-store' })));
    const failed = responses.find(response => !response.ok);
    if (failed) throw new Error(`Unable to load competitor intelligence bundle (${failed.status})`);
    const encoded = (await Promise.all(responses.map(response => response.text()))).join('').replace(/\s+/g, '');
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  }

  function detectRoute() {
    if (document.querySelector('.view[data-view="competitors"]')) return 'competitors';
    if (document.querySelector('.view[data-view="profiles"]')) return 'profiles';
    return 'competitors';
  }

  function currentView(route) {
    return document.querySelector(`.view[data-view="${route}"]`);
  }

  function isExpanded(route) {
    const view = currentView(route);
    if (!view) return false;
    if (view.dataset.expanded === '1' || view.dataset.competitorIntelligence === 'true') return true;
    if (view.querySelector('.cp-card, .ci-profile-card, [data-competitor-profile-id]')) return true;
    return view.querySelectorAll('.competitor-card').length > 4;
  }

  function patchRoute(source, route) {
    if (route === 'competitors') return source;
    return source
      .replaceAll('data-view="competitors"', `data-view="${route}"`)
      .replaceAll("data-view='competitors'", `data-view='${route}'`)
      .replaceAll("'competitors'", `'${route}'`)
      .replaceAll('"competitors"', `"${route}"`);
  }

  function removeLegacyDrawer() {
    const drawer = document.getElementById('profileDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer) drawer.remove();
    if (backdrop) backdrop.remove();
    document.body.classList.remove('drawer-open');
    document.body.style.overflow = '';
  }

  async function applyDailyRefresh(dataText, loaderBase) {
    let parsed;
    try {
      parsed = JSON.parse(dataText);
    } catch (_) {
      return { dataText, refresh: null };
    }

    let refresh;
    try {
      const url = new URL(`../../data/competitor-daily-refresh.json?v=${Date.now()}`, loaderBase);
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return { dataText, refresh: null };
      refresh = await response.json();
    } catch (_) {
      return { dataText, refresh: null };
    }

    const refreshById = new Map((refresh.competitors || []).map(item => [String(item.id || '').toLowerCase(), item]));
    const refreshByName = new Map((refresh.competitors || []).map(item => [String(item.name || '').toLowerCase(), item]));
    const profiles = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.profiles)
        ? parsed.profiles
        : Array.isArray(parsed.competitors)
          ? parsed.competitors
          : [];

    profiles.forEach(profile => {
      const key = String(profile.id || '').toLowerCase();
      const name = String(profile.name || '').toLowerCase();
      const current = refreshById.get(key) || refreshByName.get(name);
      if (!current) return;
      const patch = current.profile_patch || {};
      Object.entries(patch).forEach(([field, value]) => {
        if (field === 'sources' && Array.isArray(value)) {
          const existing = Array.isArray(profile.sources) ? profile.sources : [];
          const merged = [...existing, ...value].filter((item, index, all) => {
            const url = Array.isArray(item) ? item[1] : '';
            return url && all.findIndex(other => Array.isArray(other) && other[1] === url) === index;
          });
          profile.sources = merged;
        } else if (value !== null && value !== undefined && value !== '') {
          profile[field] = value;
        }
      });
      profile.last_updated_at = current.last_updated_at;
      profile.last_checked_at = current.last_checked_at;
      profile.refresh_status = current.refresh_status;
      profile.latest_developments = current.latest_developments || [];
      profile.verified_fields = current.verified_fields || {};
      profile.daily_changes = current.changes || { added: [], removed: [], modified: [] };
    });

    window.__QUEST_COMPETITOR_REFRESH__ = refresh;
    return { dataText: JSON.stringify(parsed), refresh };
  }

  function showLoadError(error, route) {
    console.error('Competitor Intelligence Profiles integration failed:', error);
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const view = currentView(route) || currentView(detectRoute());
      if (view && !view.querySelector('[data-cp-load-error]')) {
        const warning = document.createElement('div');
        warning.dataset.cpLoadError = 'true';
        warning.style.cssText = 'margin:12px 0;padding:12px 14px;border:1px solid #efc5d2;border-radius:10px;background:#fff4f7;color:#8e2647;font:600 12px/1.4 Arial,sans-serif';
        warning.textContent = `Expanded competitor profiles could not load: ${error.message}. Please refresh the page.`;
        view.prepend(warning);
        window.clearInterval(timer);
      }
      if (attempts > 120) window.clearInterval(timer);
    }, 100);
  }

  async function loadFallback(route, loaderBase) {
    if (isExpanded(route)) return;
    const fallbackUrl = new URL(`../competitor-profile-expansion/competitor-expansion.js?v=${RELEASE}`, loaderBase);
    const response = await fetch(fallbackUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Fallback profile module returned ${response.status}`);
    let source = await response.text();
    const profileBase = new URL('../competitor-profile-expansion/', loaderBase).href;
    source = source
      .replace("const base=new URL('.',document.currentScript.src);", `const base=new URL('${profileBase}');`)
      .replace("const base = new URL('.', document.currentScript.src);", `const base = new URL('${profileBase}');`)
      .replaceAll('data-view="profiles"', `data-view="${route}"`)
      .replaceAll("data-view='profiles'", `data-view='${route}'`)
      .replaceAll("'profiles'", `'${route}'`)
      .replaceAll('"profiles"', `"${route}"`);
    const script = document.createElement('script');
    script.dataset.integration = 'competitor-profile-fallback';
    script.textContent = `${source}\nwindow.__QUEST_COMPETITOR_PROFILES_VERSION__='${RELEASE}-fallback';\n//# sourceURL=competitor-profile-fallback.js`;
    document.body.appendChild(script);
  }

  async function boot() {
    let dataUrl;
    const loaderBase = new URL('.', document.currentScript.src);
    const route = detectRoute();
    try {
      removeLegacyDrawer();
      const [source, rawDataText] = await Promise.all([
        inflateBase64(jsParts, loaderBase),
        inflateBase64(dataParts, loaderBase),
      ]);
      const refreshed = await applyDailyRefresh(rawDataText, loaderBase);
      const dataText = refreshed.dataText;
      JSON.parse(dataText);
      dataUrl = URL.createObjectURL(new Blob([dataText], { type: 'application/json' }));

      let patchedSource = patchRoute(source, route).replace(
        "const DATA_URL = 'data/competitor-profiles-expanded.json';",
        `const DATA_URL = '${dataUrl}';`
      );

      const script = document.createElement('script');
      script.dataset.integration = 'competitor-intelligence-profiles';
      script.textContent = `${patchedSource}\nwindow.__QUEST_COMPETITOR_PROFILES_VERSION__='${RELEASE}';\n//# sourceURL=competitor-intelligence-profiles.js`;
      document.body.appendChild(script);
      window.dispatchEvent(new CustomEvent('quest:competitor-refresh-loaded', { detail: refreshed.refresh || {} }));

      window.setTimeout(async () => {
        try {
          if (!isExpanded(route)) await loadFallback(route, loaderBase);
          removeLegacyDrawer();
        } catch (fallbackError) {
          showLoadError(fallbackError, route);
        }
      }, 2200);

      window.setTimeout(() => {
        if (dataUrl) URL.revokeObjectURL(dataUrl);
      }, 300000);
    } catch (error) {
      if (dataUrl) URL.revokeObjectURL(dataUrl);
      try {
        await loadFallback(route, loaderBase);
        removeLegacyDrawer();
      } catch (fallbackError) {
        showLoadError(new Error(`${error.message}; ${fallbackError.message}`), route);
      }
    }
  }

  boot();
})();
