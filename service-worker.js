const CACHE_NAME = 'toolvanta-static-v16';
const CORE_ASSETS = [
  './',
  './index.html',
  './404.html',
  './offline.html',
  './tools/index.html',
  './categories.html',
  './about.html',
  './contact.html',
  './cookies/',
  './terms/',
  './privacy/',
  './privacy-policy.html',
  './terms-of-service.html',
  './cookie-policy.html',
  './editorial-standards.html',
  './content-update-policy.html',
  './authors/index.html',
  './authors/toolvanta-editorial-team/',
  './authors/technical-review/',
  './resources/index.html',
  './resources/best-free-seo-tools/',
  './resources/best-text-tools-for-writers/',
  './resources/best-developer-tools-for-json-and-encoding/',
  './resources/json-formatter-vs-json-validator/',
  './resources/best-ai-prompt-tools/',
  './resources/how-to-write-better-ai-prompts/',
  './resources/free-online-calculators/',
  './resources/word-counter-for-students/',
  './use-cases/index.html',
  './use-cases/bloggers/',
  './use-cases/developers/',
  './use-cases/students/',
  './use-cases/marketers/',
  './use-cases/youtubers/',
  './use-cases/small-businesses/',
  './compare/index.html',
  './compare/word-counter-vs-character-counter/',
  './compare/json-formatter-vs-json-minifier/',
  './compare/base64-encoder-vs-url-encoder/',
  './compare/serp-snippet-preview-vs-meta-tag-analyzer/',
  './compare/ai-prompt-generator-vs-ai-blog-outline-generator/',
  './changelog.html',
  './learn/index.html',
  './learn/what-is-an-ai-prompt/',
  './learn/what-is-keyword-density/',
  './learn/what-is-json-formatting/',
  './resources/ai-prompt-generator-guide/',
  './resources/ai-email-writer-guide/',
  './resources/ai-blog-outline-generator-guide/',
  './resources/meta-tag-analyzer-guide/',
  './resources/keyword-density-checker-guide/',
  './resources/json-formatter-guide/',
  './resources/password-generator-guide/',
  './resources/image-resizer-guide/',
  './compare/meta-tag-analyzer-vs-title-tag-checker/',
  './compare/keyword-density-checker-vs-word-frequency-counter/',
  './compare/password-generator-vs-uuid-generator/',
  './compare/image-resizer-vs-image-compressor/',
  './search-index.json',
  './manifest.json',
  './assets/css/styles.css?v=15',
  './assets/js/main.js?v=15',
  './assets/js/data.js?v=13',
  './assets/js/tool.js?v=14',
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
      .then(keys => Promise.all(keys.filter(key => key.startsWith('toolvanta-static-') && key !== CACHE_NAME).map(key => caches.delete(key))))
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
        return caches.match(request).then(cached => cached || caches.match('./offline.html'));
      })
    );
    return;
  }

  if (url.pathname.endsWith('/search-index.json') || url.pathname.endsWith('/sitemap.xml') || url.pathname.endsWith('/robots.txt')) {
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match(request))
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
      }).catch(() => cached || caches.match('./offline.html'));
      return cached || network;
    })
  );
});







