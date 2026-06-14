const CACHE_NAME = 'toolvanta-static-v4';
const CORE_ASSETS = [
  './',
  './index.html',
  './tools/index.html',
  './categories.html',
  './about.html',
  './contact.html',
  './privacy-policy.html',
  './terms-of-service.html',
  './cookie-policy.html',
  './manifest.json',
  './assets/css/styles.css',
  './assets/js/main.js',
  './assets/js/data.js',
  './assets/js/tool.js',
  './assets/img/favicon.svg',
  './tools/word-counter/',
  './tools/json-formatter/',
  './tools/password-generator/',
  './tools/ai-prompt-generator/',
  './tools/serp-snippet-preview/',
  './tools/utm-url-builder/',
  './tools/qr-code-generator/',
  './tools/image-resizer/',
  './categories/seo/',
  './categories/text/',
  './categories/developer/'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        return caches.match(request).then(cached => cached || caches.match('./index.html'));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached || caches.match('./index.html'));
      return cached || network;
    })
  );
});
