const BUILD_VERSION = "2026-01-11-02";
const CACHE_NAME = `checkinfra-${BUILD_VERSION}`;

/* =========================================
   ARQUIVOS ESSENCIAIS (ATUALIZADO)
========================================= */
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./avaliacao.html",
  "./manifest.json",
  "./feedback/feedback.html",
  "./feedback/feedback.css",
  "./feedback/feedback.js",
  
  // Assets
  "./assets/logo-checkinfra.png",
  
  // Ícones
  "./icons/favicon.ico",
  "./icons/favicon.svg",
  "./icons/favicon-96x96.png",
  "./icons/web-app-manifest-192x192.png",
  "./icons/web-app-manifest-512x512.png",
  "./icons/apple-touch-icon.png",
  
  // Páginas principais
  "./painel/index.html",
  "./mapa/index.html",
  "./metodiq/index.html"
];

/* =========================================
   INSTALL
========================================= */
self.addEventListener("install", event => {
  console.log("[SW] Install:", CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[SW] Cacheando arquivos essenciais");
      // Cachear apenas os arquivos críticos primeiro
      return cache.addAll([
        "./",
        "./index.html",
        "./manifest.json",
        "./assets/logo-checkinfra.png",
        "./icons/web-app-manifest-192x192.png",
        "./icons/web-app-manifest-512x512.png"
      ]);
    }).then(() => {
      console.log("[SW] Todos os recursos foram cacheados");
      return self.skipWaiting();
    })
  );
});

/* =========================================
   ACTIVATE
========================================= */
self.addEventListener("activate", event => {
  console.log("[SW] Activate - Nova versão:", CACHE_NAME);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Removendo cache antigo:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log("[SW] Claiming clients");
      return self.clients.claim();
    })
  );
});

/* =========================================
   FETCH - Estratégia: Cache First, depois Rede
========================================= */
self.addEventListener("fetch", event => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições do Chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  event.respondWith(
    caches.match(event.request).then(response => {
      // Retorna do cache se encontrado
      if (response) {
        return response;
      }
      
      // Clona a requisição porque ela só pode ser usada uma vez
      const fetchRequest = event.request.clone();
      
      return fetch(fetchRequest).then(response => {
        // Verifica se recebemos uma resposta válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clona a resposta para armazenar no cache
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          // Cachear a nova resposta para esta requisição
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Fallback para páginas específicas se offline
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        
        // Fallback para ícone padrão se ícone não encontrado
        if (event.request.url.includes('favicon') || event.request.url.includes('icon')) {
          return caches.match('./icons/web-app-manifest-192x192.png');
        }
        
        return new Response('Offline - Sem conexão com a internet', {
          status: 503,
          statusText: 'Offline',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});
