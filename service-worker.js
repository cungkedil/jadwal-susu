const CACHE_NAME = 'v1';
const ASSETS = [
  './',
  '/jadwal-susu/index.html',
  '/jadwal-susu/style.css',
  '/jadwal-susu/title.css',
  '/jadwal-susu/main.js',
  '/jadwal-susu/manifest.json',
  '/jadwal-susu/icons/icon-192.png',
  '/jadwal-susu/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  // clean up old caches here
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
