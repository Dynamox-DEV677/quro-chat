const CACHE_VERSION = 'quro-v57';
const STATIC_CACHE = CACHE_VERSION + '-static';
const DYNAMIC_CACHE = CACHE_VERSION + '-dynamic';

// Core app shell — cache-first
const APP_SHELL = [
  '/',
  '/index.html',
  '/huddleicon.png',
  '/manifest.json'
];

// CSS/JS modules — stale-while-revalidate
const MODULE_PATTERN = /\/(css|js)\//;

// Font files — cache-first (rarely change)
const FONT_PATTERN = /fonts\.(googleapis|gstatic)\.com/;

// API/realtime — network-only (never cache)
const API_PATTERN = /supabase\.co|cdn\.jsdelivr/;

// Install — precache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => !k.startsWith(CACHE_VERSION)).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — strategy-based caching
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // API calls — network only, never cache
  if (API_PATTERN.test(url)) return;

  // Fonts — cache-first (long-lived)
  if (FONT_PATTERN.test(url)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // CSS/JS modules — stale-while-revalidate
  if (MODULE_PATTERN.test(new URL(url).pathname)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(c => c.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // HTML (navigation) — network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Everything else — network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(c => c.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Quro', {
        body: data.body || 'You have new messages',
        icon: '/huddleicon.png',
        badge: '/huddleicon.png',
        tag: 'quro-' + Date.now(),
        data: { url: data.url || '/' }
      })
    );
  } catch (e) {}
});

// Notification click — focus or open app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
