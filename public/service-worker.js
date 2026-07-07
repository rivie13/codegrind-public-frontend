// 1. Bumped version to v2 to instantly purge old corrupted text files from client browsers
const GAME_ASSETS_CACHE = 'codegrind-game-assets-v2';
const BLOB_STORAGE_HOST = 'codegrindpublicmedia.blob.core.windows.net';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== GAME_ASSETS_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // 2. Allow either same-origin OR requests headed to your Azure Blob Storage
  const isAllowedOrigin = 
    requestUrl.origin === self.location.origin || 
    requestUrl.hostname === BLOB_STORAGE_HOST;

  if (!isAllowedOrigin) {
    return;
  }

  const path = requestUrl.pathname;
  const isGameAsset =
    path.includes('/city-v2/') ||
    path.includes('/audio/') ||
    path.endsWith('.tmj') ||
    path.endsWith('.json') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.mp3') ||
    path.endsWith('.ogg');

  if (!isGameAsset) {
    return;
  }

  event.respondWith(
    caches.open(GAME_ASSETS_CACHE).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Request cross-origin assets with CORS mode enabled so Phaser's WebGL
        // context can safely read the images.
        const fetchOptions =
          requestUrl.hostname === BLOB_STORAGE_HOST ? { mode: 'cors' } : {};

        return fetch(request, fetchOptions)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            console.warn('[ServiceWorker] Game asset fetch failed:', request.url, err);
            return Response.error();
          });
      });
    })
  );
});
