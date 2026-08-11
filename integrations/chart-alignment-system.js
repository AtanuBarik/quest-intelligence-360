(() => {
  'use strict';

  const RELEASE = '20260810u';
  let scheduled = 0;

  function installStyles() {
    if (document.getElementById('questChartAlignmentSystem')) return;
    const style = document.createElement('style');
    style.id = 'questChartAlignmentSystem';
    style.textContent = `
      :root{--q-chart-text:#5f6b63;--q-chart-line:#dfe6e0;--q-chart-ink:#034c1f}
      canvas{display:block!important;max-width:100%!important;margin-left:auto!important;margin-right:auto!important}
      .chart-wrap,.si-chart,.live-chart,[class*="chart-wrap"],[class*="chart-box"]{position:relative;min-width:0}
      .chart-wrap>canvas,.si-chart>canvas,.live-chart>canvas{display:block!important;margin-inline:auto!important}

      .voe-donutwrap,.pmrf-donutwrap,.sa-donutwrap{align-items:center!important;justify-content:center!important;min-width:0!important}
      .voe-donutbox,.pmrf-donutbox,.sa-donutbox{position:relative!important;display:grid!important;place-items:center!important;flex:0 0 auto!important;margin-inline:auto!important}
      .voe-donutcenter,.pmrf-center,.sa-center{position:absolute!important;left:50%!important;top:50%!important;right:auto!important;bottom:auto!important;inset:auto!important;transform:translate(-50%,-50%)!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;width:62%!important;min-width:0!important;height:auto!important;margin:0!important;padding:0!important;text-align:center!important;line-height:1!important;pointer-events:none!important}
      .voe-donutcenter small,.pmrf-center span,.sa-center small{display:block!important;margin:6px 0 0!important;padding:0!important;line-height:1.15!important;text-align:center!important;white-space:nowrap!important}
      .voe-legend,.pmrf-legend,.sa-legend{min-width:0!important;align-content:center!important}
      .voe-leg,.pmrf-leg,.sa-leg{min-width:0!important}
      .voe-leg span,.pmrf-leg span,.sa-leg span{min-width:0!important;overflow-wrap:anywhere!important;line-height:1.3!important}

      .voe-scatter-wrap,.pmra-scatter-wrap{padding:18px 24px 36px 52px!important;overflow:visible!important}
      .sa-scatter{margin:18px 24px 36px 52px!important}
      .voe-scatter,.pmra-scatter,.sa-scatter{position:relative!important;overflow:visible!important;isolation:isolate!important;min-height:280px!important}
      .voe-scatter:before,.pmra-scatter:before,.sa-scatter:before{left:-44px!important;top:50%!important;transform:translateY(-50%) rotate(180deg)!important;line-height:1.15!important;white-space:nowrap!important}
      .voe-scatter:after,.pmra-scatter:after,.sa-scatter:after{right:0!important;bottom:-27px!important;line-height:1.15!important;white-space:nowrap!important}
      .voe-point,.pmra-point,.sa-point{transform:translate(var(--q-chart-nudge-x,0px),var(--q-chart-nudge-y,0px))!important;transition:transform .12s ease,box-shadow .12s ease!important;border:2px solid #fff!important;box-sizing:border-box!important;line-height:1!important;text-align:center!important;z-index:2}
      .voe-point[data-q-collision-group],.pmra-point[data-q-collision-group],.sa-point[data-q-collision-group]{box-shadow:0 0 0 3px rgba(255,255,255,.9),0 0 0 6px rgba(3,76,31,.08)!important}

      .qef-bubble-wrap{min-width:0!important}
      .qef-bubble-svg{display:block!important;width:100%!important;max-width:100%!important;margin-inline:auto!important;overflow:visible!important}
      .qef-legend{justify-content:center!important;row-gap:8px!important}

      @media(max-width:900px){
        .voe-donutwrap,.pmrf-donutwrap,.sa-donutwrap{grid-template-columns:1fr!important}
        .voe-donutbox,.pmrf-donutbox,.sa-donutbox{margin-bottom:8px!important}
      }
      @media(max-width:620px){
        .voe-scatter-wrap,.pmra-scatter-wrap{padding:18px 14px 38px 46px!important}
        .sa-scatter{margin:18px 14px 38px 46px!important}
        .voe-point,.sa-point{width:26px!important;height:26px!important;margin:-13px 0 0 -13px!important;font-size:7.5px!important}
        .pmra-point{width:20px!important;height:20px!important;margin:-10px 0 0 -10px!important;font-size:8px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function patchChartLite() {
    const Chart = window.Chart;
    const proto = Chart && Chart.prototype;
    if (!proto || proto.__questAlignmentPatched) return;
    proto.__questAlignmentPatched = true;

    ['_doughnut','_radar'].forEach(name => {
      const original = proto[name];
      if (typeof original !== 'function') return;
      proto[name] = function(ctx, area) {
        const radialArea = area ? { ...area, x: Math.max(12, area.x - 16) } : area;
        return original.call(this, ctx, radialArea);
      };
    });
  }

  function parsePercent(value) {
    const n = parseFloat(String(value || '').replace('%',''));
    return Number.isFinite(n) ? n : 50;
  }

  function spreadScatter(container, pointSelector) {
    if (!container || container.offsetWidth < 80 || container.offsetHeight < 80) return;
    const points = Array.from(container.querySelectorAll(pointSelector));
    if (points.length < 2) {
      points.forEach(point => {
        point.style.removeProperty('--q-chart-nudge-x');
        point.style.removeProperty('--q-chart-nudge-y');
        point.removeAttribute('data-q-collision-group');
      });
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const items = points.map((point, index) => {
      point.style.setProperty('--q-chart-nudge-x','0px');
      point.style.setProperty('--q-chart-nudge-y','0px');
      point.removeAttribute('data-q-collision-group');
      const left = parsePercent(point.style.left);
      const bottom = parsePercent(point.style.bottom);
      const size = Math.max(point.offsetWidth || 22, point.offsetHeight || 22, 20);
      return { point, index, x: width * left / 100, y: height - (height * bottom / 100), size };
    });

    const visited = new Set();
    const groups = [];
    for (const item of items) {
      if (visited.has(item.index)) continue;
      const group = [];
      const queue = [item];
      visited.add(item.index);
      while (queue.length) {
        const current = queue.shift();
        group.push(current);
        for (const other of items) {
          if (visited.has(other.index)) continue;
          const dx = current.x - other.x;
          const dy = current.y - other.y;
          const minDistance = (current.size + other.size) / 2 + 7;
          if (Math.hypot(dx, dy) < minDistance) {
            visited.add(other.index);
            queue.push(other);
          }
        }
      }
      groups.push(group);
    }

    groups.filter(group => group.length > 1).forEach(group => {
      const count = group.length;
      const largest = Math.max(...group.map(item => item.size));
      const radius = Math.min(24, Math.max(12, largest * (count > 4 ? .72 : .58)));
      group.forEach((item, i) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i / count);
        let dx = Math.cos(angle) * radius;
        let dy = Math.sin(angle) * radius;
        const half = item.size / 2 + 2;
        const targetX = item.x + dx;
        const targetY = item.y + dy;
        if (targetX < half) dx += half - targetX;
        if (targetX > width - half) dx -= targetX - (width - half);
        if (targetY < half) dy += half - targetY;
        if (targetY > height - half) dy -= targetY - (height - half);
        item.point.style.setProperty('--q-chart-nudge-x', `${Math.round(dx)}px`);
        item.point.style.setProperty('--q-chart-nudge-y', `${Math.round(dy)}px`);
        item.point.dataset.qCollisionGroup = String(count);
        item.point.style.zIndex = String(3 + i);
      });
    });
  }

  function normalizeCustomCharts(root = document) {
    root.querySelectorAll('.voe-scatter').forEach(node => spreadScatter(node,'.voe-point'));
    root.querySelectorAll('.pmra-scatter').forEach(node => spreadScatter(node,'.pmra-point'));
    root.querySelectorAll('.sa-scatter').forEach(node => spreadScatter(node,'.sa-point'));
  }

  function refreshCanvasCharts() {
    try {
      if (!window.Chart?.instances) return;
      Object.values(window.Chart.instances).forEach(chart => {
        try {
          if (typeof chart.resize === 'function') chart.resize();
          else if (typeof chart.update === 'function') chart.update('none');
        } catch (_) {}
      });
    } catch (_) {}
  }

  function attachResizeObservers(root = document) {
    if (!window.ResizeObserver) return;
    root.querySelectorAll('.voe-scatter,.pmra-scatter,.sa-scatter').forEach(container => {
      if (container.dataset.qChartResizeObserved === 'true') return;
      container.dataset.qChartResizeObserved = 'true';
      const selector = container.classList.contains('voe-scatter') ? '.voe-point' : container.classList.contains('pmra-scatter') ? '.pmra-point' : '.sa-point';
      const observer = new ResizeObserver(() => spreadScatter(container, selector));
      observer.observe(container);
    });
  }

  function apply(root = document) {
    installStyles();
    patchChartLite();
    normalizeCustomCharts(root);
    attachResizeObservers(root);
    refreshCanvasCharts();
    document.documentElement.dataset.chartAlignmentRelease = RELEASE;
  }

  function schedule(delay = 40) {
    window.clearTimeout(scheduled);
    scheduled = window.setTimeout(() => apply(document), delay);
  }

  function boot() {
    apply(document);
    const observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => mutation.addedNodes && mutation.addedNodes.length)) schedule(60);
    });
    observer.observe(document.body, { childList:true, subtree:true });
    window.addEventListener('resize', () => schedule(80), { passive:true });
    window.addEventListener('quest:module-loaded', () => schedule(70));
    window.addEventListener('quest:layout-refresh', () => schedule(70));
    window.addEventListener('quest:chart-engine-ready', () => schedule(30));
    document.addEventListener('click', event => {
      if (event.target.closest('.nav-item,[data-view],button,a,select')) schedule(120);
    }, { capture:true, passive:true });
    [250,700,1500].forEach(delay => window.setTimeout(() => apply(document), delay));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
