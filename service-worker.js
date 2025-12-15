const CACHE_NAME = "checkinfra-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./avaliacao.html",

  // Subpáginas
  "./mapa/index.html",
  "./painel/index.html",

  // Manifest e ícones
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",

  // Assets reais
  "./assets/logo-checkinfra.png"
];

// Instalação
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Cacheando arquivos do CheckInfra");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Intercepta requisições
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
