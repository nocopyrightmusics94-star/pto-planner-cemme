// Service Worker - Pianificatore Ferie e Permessi C. Emme Impianti S.r.l.
const NOME_CACHE = 'cemme-ferie-cache-v1';
const ASSET_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo-cemme.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(NOME_CACHE).then((cache) => {
      return cache.addAll(ASSET_PRECACHE).catch((err) => {
        console.warn('Errore pre-caching non critico:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomiCache) => {
      return Promise.all(
        nomiCache.map((nome) => {
          if (nome !== NOME_CACHE) {
            return caches.delete(nome);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  // Ignora richieste non HTTP/HTTPS (es. chrome-extension://)
  if (!evento.request.url.startsWith('http')) return;

  evento.respondWith(
    caches.match(evento.request).then((rispostaCache) => {
      if (rispostaCache) {
        return rispostaCache;
      }
      return fetch(evento.request).then((rispostaRete) => {
        if (!rispostaRete || rispostaRete.status !== 200 || rispostaRete.type !== 'basic') {
          return rispostaRete;
        }
        // Cloniamo la risposta per la cache
        const rispostaDaSalvare = rispostaRete.clone();
        caches.open(NOME_CACHE).then((cache) => {
          // Memorizza asset statici
          if (evento.request.url.match(/\.(js|css|png|jpg|svg|woff2)$/)) {
            cache.put(evento.request, rispostaDaSalvare);
          }
        });
        return rispostaRete;
      }).catch(() => {
        // Fallback offline su index.html per navigazioni SPA
        if (evento.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
