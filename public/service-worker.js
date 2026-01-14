const CACHE_NAME = 'sparky-ai-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/vite.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', event => {
  // Activate immediately after install
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Always go to network for API calls that match known patterns
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return; // let browser handle network
  }

  // Handle SPA navigation requests: serve index.html if offline
  if (event.request.mode === 'navigate' ||
      (event.request.method === 'GET' && event.request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            return cache.match('/index.html');
          });
      })
    );
    return;
  }

  // For other assets: try cache first, fall back to network and update cache
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              try { cache.put(event.request, networkResponse.clone()); } catch (e) { /* opaque responses may throw */ }
            }
            return networkResponse;
          })
          .catch(() => response);

        return response || fetchPromise;
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    self.clients?.claim?.();
    const cacheWhitelist = [CACHE_NAME];
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        if (!cacheWhitelist.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      })
    );
  })());
});
