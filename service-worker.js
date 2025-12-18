const BUILD_VERSION = "2025-12-18-02";
const CACHE_NAME = `checkinfra-${BUILD_VERSION}`;

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./avaliacao.html",
  "./manifest.json",
  "./mapa/escolas.js",
  "./js/avaliacao.js"
];

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE_NAME).then(c=>c.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k!==CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
