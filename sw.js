const CACHE_NAME = 'everivault-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

// Install: cache core files
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML/API, cache fallback offline
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Skip Supabase and external API calls (always network)
  if (req.url.includes('supabase.co') || req.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then(res => {
        // Cache successful same-origin GETs
        if (res && res.status === 200 && req.url.startsWith(self.location.origin)) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        }
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
  );
});