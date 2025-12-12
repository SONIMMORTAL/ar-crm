const CACHE_NAME = 'crm-checkin-v1';
const URLS_TO_CACHE = [
    '/checkin',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached response or network fetch
            // For API calls, we prefer network. For static, cache.
            return response || fetch(event.request);
        })
    );
});
