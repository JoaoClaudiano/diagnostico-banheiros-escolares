/* =========================================
   CHECKINFRA — SERVICE WORKER
   Versionamento por build
========================================= */

const BUILD_VERSION = "2025-12-18-02";
const CACHE_NAME = `checkinfra-${BUILD_VERSION}`;

const FILES_TO_CACHE = [
  "./",
  "./avaliacao.html",
  "./manifest.json",

  // JS essenciais
  "./js/avaliacao-offline.js",

  // dados
  "./mapa/escolas.js"
];

/* ===== INSTALL ===== */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

/* ===== ACTIVATE ===== */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => k !== CACHE_NAME && caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ===== FETCH ===== */
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});
