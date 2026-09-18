(() => {
  'use strict';

  const video = document.getElementById('citizenBgVideo');
  const networkStatus = document.getElementById('networkStatus');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getNetwork = () => {
    if (!navigator.onLine) return { label: 'Không có kết nối', source: '' };
    // When the browser cannot expose a radio type, preserve the rich visual
    // experience requested by the owner instead of incorrectly downgrading it.
    if (!connection) return { label: 'Đang nhận diện', source: video?.dataset.fullSrc || '' };

    const type = connection.type || '';
    const effectiveType = connection.effectiveType || '';
    const downlink = Number(connection.downlink || 0);
    const rtt = Number(connection.rtt || 0);
    const isWifi = type === 'wifi';
    const isCellular = type === 'cellular';
    // The Network Information API has no true 5G label. This threshold is
    // intentionally conservative, so normal 4G stays on the 720p asset.
    const isLikely5G = isCellular && effectiveType === '4g' && downlink >= 20 && rtt > 0 && rtt <= 60;
    const saver = connection.saveData ? ' · Tiết kiệm dữ liệu' : '';

    if (connection.saveData) return { label: 'Tiết kiệm dữ liệu', source: '' };
    if (isWifi) return { label: `Wi‑Fi${saver}`, source: video?.dataset.fullSrc || '' };
    if (isLikely5G) return { label: `Di động rất nhanh (ước lượng 5G)${saver}`, source: video?.dataset.fullSrc || '' };
    if (isCellular && effectiveType === '4g') return { label: `4G${saver}`, source: video?.dataset['4gSrc'] || '' };
    if (isCellular && effectiveType === '3g') return { label: `3G${saver}`, source: video?.dataset.liteSrc || '' };
    if (isCellular && (effectiveType === '2g' || effectiveType === 'slow-2g')) return { label: `Mạng yếu (${effectiveType.toUpperCase()})${saver}`, source: '' };
    if (isCellular) return { label: `Mạng di động${saver}`, source: video?.dataset.liteSrc || '' };
    if (type === 'ethernet') return { label: `Ethernet${saver}`, source: video?.dataset.fullSrc || '' };
    return { label: `Đang nhận diện${saver}`, source: video?.dataset.fullSrc || '' };
  };

  const applyNetworkState = () => {
    const network = getNetwork();
    if (networkStatus) {
      networkStatus.querySelector('span').textContent = `Mạng hiện tại: ${network.label}`;
      networkStatus.title = network.label;
    }
    if (!video || reducedMotion || !network.source || video.getAttribute('src') === network.source) return;

    const loadBackground = () => {
      video.src = network.source;
      video.load();
      video.play().catch(() => {});
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadBackground, { timeout: 1200 });
    } else {
      window.setTimeout(loadBackground, 500);
    }
  };

  applyNetworkState();
  connection?.addEventListener?.('change', applyNetworkState);
  window.addEventListener('online', applyNetworkState);
  window.addEventListener('offline', applyNetworkState);
})();
