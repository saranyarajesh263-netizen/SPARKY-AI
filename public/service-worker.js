const CACHE_NAME = 'sparky-ai-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/vite.svg',
  '/services/geminiService.ts',
  '/services/notesStorage.ts',
  '/components/BottomNav.tsx',
  '/components/CreateScreen.tsx',
  '/components/HomeScreen.tsx',
  '/components/NotesScreen.tsx',
  '/components/PlayScreen.tsx',
  '/components/SettingsScreen.tsx',
  '/components/Toast.tsx',
  '/components/icons.tsx'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For API calls, always go to the network.
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
      return fetch(event.request);
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Return from cache if found.
        const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
        });

        // Return from cache, or wait for network
        return response || fetchPromise;
      });
    })
  );
});


// Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
