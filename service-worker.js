/* =========================================
   CHECKINFRA — SERVICE WORKER
   Versionamento automático por build
========================================= */

// 🔁 ATUALIZE APENAS ESTA LINHA A CADA DEPLOY
const BUILD_VERSION = "2025-12-17-01"; 
// Exemplo: YYYY-MM-DD-XX

const CACHE_NAME = `checkinfra-${BUILD_VERSION}`;

/* =========================================
   ARQUIVOS ESSENCIAIS
========================================= */
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./avaliacao.html",
  "./analise-espacial.html",
  "./manifest.json",
  "./mapa/escolas.js"
   "./painel/index.html"
];

/* =========================================
   INSTALL
========================================= */
self.addEventListener("install", event => {
  console.log("[SW] Install:", CACHE_NAME);

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[SW] Cacheando arquivos");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting(); // força ativação imediata
});

/* =========================================
   ACTIVATE — LIMPA CACHES ANTIGOS
========================================= */
self.addEventListener("activate", event => {
  console.log("[SW] Activate");

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Removendo cache antigo:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

/* =========================================
   FETCH — CACHE FIRST COM FALLBACK
========================================= */
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
