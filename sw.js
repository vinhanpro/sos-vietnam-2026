// SOS Việt Nam 2026 — Service Worker (PWA Install & Offline Cache Baseline)
const CACHE_NAME = 'sos-vietnam-v2026-09-04-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/map.css',
  '/css/tactical-responsive.css',
  '/js/app.js',
  '/manifest.json',
  '/assets/icons/logo-bocongan.png',
  '/assets/icons/logo-police-round-an.png',
  '/assets/icons/logo-police-round-192.png',
  '/assets/icons/logo-police-round-512.png',
  '/assets/icons/favicon.png',
  '/assets/icons/logo-command.png',
  '/assets/icons/logo-police.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Cache prefetch non-blocking notice:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Let network handle dynamic API/websocket calls directly
  if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
