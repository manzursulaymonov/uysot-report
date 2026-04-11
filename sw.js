const CACHE_NAME = 'uysot-v18';
const STATIC_ASSETS = [
  './',
  'index.html',
  'styles.css',
  'executive-obsidian.css',
  'themes.css',
  'core.js',
  'app.js',
  'pages.js',
  'config.js',
  'manifest.json',
  'icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Install: cache all static assets (bypass HTTP cache for local files)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(STATIC_ASSETS.map(url => {
        const opts = url.startsWith('http') ? {} : {cache: 'reload'};
        return fetch(url, opts).then(r => cache.put(url, r));
      }));
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first for data (CSV/API), cache-first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Sheets CSV and API calls: network-first, fallback to cache
  if (url.hostname.includes('google') || url.hostname.includes('allorigins') || url.hostname.includes('generativelanguage')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Google Fonts CSS/woff2: cache-first (they rarely change)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Static assets: network-first, fallback to cache
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok && (url.origin === self.location.origin || url.hostname.includes('cdnjs') || url.hostname.includes('cdn.sheetjs'))) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
