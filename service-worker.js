// service-worker.js
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("v1").then((cache) => {
      return cache.addAll([
        '/jadwal-susu/',
        '/jadwal-susu/index.html',
        '/jadwal-susu/style.css',
        '/jadwal-susu/title.css',
        '/jadwal-susu/main.js',
        '/jadwal-susu/manifest.json',
        '/jadwal-susu/icons/icon-192.png',
        '/jadwal-susu/icons/icon-512.png'
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
