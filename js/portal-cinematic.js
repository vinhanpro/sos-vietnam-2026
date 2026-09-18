/* Finite, decorative intro. No authentication state or operational writes. */
(() => {
  'use strict';
  const portal = document.getElementById('cosmicPortalView');
  const scene = document.getElementById('portalCinematicScene');
  if (!portal || !scene) return;
  const play = document.getElementById('cinematicPlay');
  const skip = document.getElementById('cinematicSkip');
  const replay = document.getElementById('cinematicReplay');
  const status = document.getElementById('cinematicStatus');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ns = 'http://www.w3.org/2000/svg';
  let animations = [];
  let ready = false;
  let loading = false;
  let finished = false;
  let paused = false;
  let generation = 0;
  let geography;
  let camera;
  let globe;
  let frame = 0;
  let globeNotice = '';
  let seen = false;
  try { seen = sessionStorage.getItem('sos-cinematic-seen-v1') === '1'; } catch { /* Storage can be unavailable in private browsing. */ }

  const visible = () => getComputedStyle(portal).display !== 'none' && !document.hidden;
  const element = (tag, attributes = {}, text) => {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    if (text) node.textContent = text;
    return node;
  };
  const mercator = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI;
  const point = ([lon, lat]) => [(lon - 99) * 46, (mercator(25.5) - mercator(lat)) * 46];

  function buildGeography(data) {
    if (!Array.isArray(data.features) || !data.features.length) throw new Error('No geography');
    geography = document.createElement('div');
    geography.className = 'cinematic-geography';
    const svg = element('svg', { viewBox: '0 0 900 950', preserveAspectRatio: 'xMidYMid meet' });
    const defs = element('defs');
    const gradient = element('linearGradient', { id: 'cinematicLand', x1: '0', x2: '1', y1: '0', y2: '1' });
    gradient.append(element('stop', { offset: '0', 'stop-color': '#30545a' }), element('stop', { offset: '.55', 'stop-color': '#1a333d' }), element('stop', { offset: '1', 'stop-color': '#a08046' }));
    defs.append(gradient); svg.append(defs);
    camera = element('g');
    for (let lon = 99; lon <= 119; lon += 2) {
      const x = point([lon, 20])[0];
      camera.append(element('path', { d: `M${x} 0V950`, class: 'cinematic-grid' }));
    }
    for (let lat = 6; lat <= 26; lat += 2) {
      const y = point([100, lat])[1];
      camera.append(element('path', { d: `M0 ${y}H900`, class: 'cinematic-grid' }));
    }
    let count = 0;
    for (const feature of data.features) {
      const geometry = feature.geometry;
      const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
      const d = polygons.map(polygon => polygon.map(ring => ring.map((coordinate, index) => {
        const [x, y] = point(coordinate);
        if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Invalid coordinate');
        return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
      }).join('') + 'Z').join('')).join('');
      if (d) { camera.append(element('path', { d, class: 'cinematic-land', 'fill-rule': 'evenodd' })); count++; }
    }
    if (!count) throw new Error('No polygons');
    for (const [name, lon, lat] of [['Hà Nội', 105.83, 21.03], ['Huế', 107.58, 16.46], ['TP. Hồ Chí Minh', 106.7, 10.78]]) {
      const [x, y] = point([lon, lat]);
      camera.append(element('circle', { cx: x, cy: y, r: 3, class: 'cinematic-city' }), element('text', { x: x + 10, y: y - 9, class: 'cinematic-label' }, name));
    }
    // Labels indicate general archipelago locations, not surveyed boundaries.
    for (const [name, lon, lat] of [['QĐ. Hoàng Sa', 111.4, 16.6], ['QĐ. Trường Sa', 112.5, 9.8]]) {
      const [x, y] = point([lon, lat]);
      camera.append(element('text', { x, y, class: 'cinematic-label' }, name));
    }
    camera.append(element('text', { x: 555, y: 340, class: 'cinematic-country' }, 'VIỆT NAM'));
    svg.append(camera); geography.append(svg); scene.append(geography);
  }

  function updateControls() {
    play.disabled = !ready || finished || reduced.matches;
    skip.disabled = !ready || finished;
    replay.disabled = !ready || reduced.matches || !globe;
    play.textContent = paused ? 'Tiếp tục cảnh' : 'Tạm dừng cảnh';
    scene.dataset.state = !ready ? 'loading' : finished ? 'finished' : paused ? 'paused' : visible() ? 'playing' : 'suspended';
  }

  function stopAtEnd() {
    generation++;
    cancelAnimationFrame(frame); frame = 0;
    animations.forEach(animation => animation.cancel());
    animations = [];
    geography.style.opacity = '1';
    camera.style.transform = 'none';
    scene.classList.add('is-ready');
    finished = true; paused = false;
    status.textContent = reduced.matches ? 'Đã giảm chuyển động · bản đồ minh họa' : globeNotice || 'Việt Nam · bản đồ minh họa, không dùng để dẫn đường';
    try { sessionStorage.setItem('sos-cinematic-seen-v1', '1'); } catch { /* Nonessential preference. */ }
    updateControls();
  }

  function begin() {
    generation++;
    const run = generation;
    animations.forEach(animation => animation.cancel());
    animations = [];
    finished = false; paused = false;
    scene.classList.add('is-ready');
    if (reduced.matches || typeof camera.animate !== 'function') { stopAtEnd(); return; }
    geography.style.opacity = '0';
    camera.style.transformOrigin = '450px 475px';
    const options = { duration: 10000, fill: 'forwards', easing: 'cubic-bezier(.45,0,.2,1)' };
    animations = [
      geography.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: .65 }, { opacity: 1, offset: .95 }, { opacity: 1 }], options),
      camera.animate([{ transform: 'scale(.58) rotate(-8deg)' }, { transform: 'scale(1) rotate(0deg)' }], options)
    ];
    status.textContent = globeNotice || 'Three.js 3D · quỹ đạo → Việt Nam · có thể chọn đơn vị ngay';
    animations[0].finished.then(() => { if (run === generation) stopAtEnd(); }).catch(() => {});
    syncVisibility();
  }

  async function load() {
    if (ready || loading || !visible()) return;
    loading = true;
    status.textContent = 'Đang chuẩn bị bản đồ minh họa…';
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 12000);
    try {
      const response = await fetch('/assets/vn-provinces.geojson', { signal: abort.signal });
      if (!response.ok) throw new Error('Geography unavailable');
      const data = await response.json();
      buildGeography(data);
      if (!reduced.matches) {
        try {
          const { createCinematicGlobe } = await import('./cinematic-globe.js');
          globe = await createCinematicGlobe(scene, data, () => {
            globe = null;
            globeNotice = 'Đồ họa 3D bị gián đoạn · đã chuyển sang bản đồ tĩnh';
            if (ready) stopAtEnd();
          });
        } catch {
          globeNotice = 'Không tải được đồ họa 3D trên thiết bị này · đang hiển thị bản đồ tĩnh';
        }
      }
      ready = true;
      if (seen || reduced.matches || !globe) stopAtEnd(); else begin();
    } catch {
      scene.dataset.state = 'unavailable';
      status.textContent = 'Chưa tải được bản đồ minh họa. Nền ảnh vẫn hiển thị; đăng nhập không bị ảnh hưởng.';
    } finally { clearTimeout(timeout); loading = false; }
  }

  function syncVisibility() {
    if (!ready) { load(); return; }
    cancelAnimationFrame(frame); frame = 0;
    animations.forEach(animation => visible() && !paused ? animation.play() : animation.pause());
    if (visible() && !paused && !finished && globe) frame = requestAnimationFrame(drawGlobe);
    updateControls();
  }
  function drawGlobe() {
    if (!visible() || paused || finished || !globe) return;
    const time = Number(animations[0]?.currentTime) || 0;
    globe.render(Math.min(1, time / 7500));
    scene.dataset.progress = String(Math.round(time));
    frame = requestAnimationFrame(drawGlobe);
  }
  play.addEventListener('click', () => { paused = !paused; syncVisibility(); });
  skip.addEventListener('click', stopAtEnd);
  replay.addEventListener('click', begin);
  reduced.addEventListener('change', () => { if (ready && reduced.matches) stopAtEnd(); });
  document.addEventListener('visibilitychange', syncVisibility);
  new MutationObserver(syncVisibility).observe(portal, { attributes: true, attributeFilter: ['style', 'class'] });
  window.addEventListener('resize', () => globe?.resize(), { passive: true });
  window.addEventListener('pagehide', event => {
    cancelAnimationFrame(frame);
    animations.forEach(animation => animation.pause());
    if (!event.persisted) globe?.dispose();
  });
  window.addEventListener('pageshow', syncVisibility);

  // Existing DIV agency triggers retain their click binding; add keyboard parity.
  portal.querySelectorAll('.cosmic-bubble-item').forEach(bubble => {
    bubble.setAttribute('role', 'button'); bubble.tabIndex = 0;
    bubble.setAttribute('aria-label', `Đăng nhập ${bubble.dataset.name}`);
    bubble.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); bubble.click(); }
    });
  });
  load();
})();
