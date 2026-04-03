/* ============================================================
   DocSecur — Service Worker
   Gestion du mode hors ligne avec cache et synchronisation
   ============================================================ */

const CACHE_NAME    = 'docsecur-v1';
const API_CACHE     = 'docsecur-api-v1';
const STATIC_CACHE  = 'docsecur-static-v1';

// Ressources statiques à mettre en cache à l'installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
];

// Routes API à mettre en cache (lecture seule, GET uniquement)
const CACHEABLE_API_ROUTES = [
  '/api/patient/dossier',
  '/api/patient/prescriptions',
  '/api/patient/resultats',
  '/api/patient/vaccination',
  '/api/patient/rendez-vous',
  '/api/notifications',
];

// ─── Installation ────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[DocSecur SW] Mise en cache des ressources statiques');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[DocSecur SW] Certaines ressources statiques non mises en cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── Activation — nettoyage des anciens caches ───────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE && name !== STATIC_CACHE)
          .map((name) => {
            console.log('[DocSecur SW] Suppression ancien cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch — stratégie hybride ───────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et les requêtes cross-origin non-API
  if (request.method !== 'GET') {
    // Pour les mutations hors ligne, stocker dans la sync queue
    if (!navigator.onLine) {
      event.respondWith(queueOfflineMutation(request));
    }
    return;
  }

  // Ressources statiques : Cache First
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Routes API : Network First avec fallback cache
  if (isCacheableApiRoute(url)) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // Navigation (React SPA) : retourner index.html du cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }
});

// ─── Stratégie : Cache First ─────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Ressource indisponible hors ligne.', { status: 503 });
  }
}

// ─── Stratégie : Network First avec fallback cache ───────────
async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[DocSecur SW] Hors ligne — retour du cache pour', request.url);
      return cached;
    }
    // Réponse JSON vide indiquant le mode hors ligne
    return new Response(
      JSON.stringify({ offline: true, message: 'Données en cache non disponibles.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ─── File d'attente hors ligne (Background Sync) ─────────────
const SYNC_QUEUE_KEY = 'docsecur-sync-queue';

async function queueOfflineMutation(request) {
  const body = await request.clone().text().catch(() => '');
  const item = {
    url:     request.url,
    method:  request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now(),
  };

  // Stocker dans IndexedDB via cache API (simplifié)
  const cache = await caches.open('docsecur-sync-queue');
  await cache.put(
    new Request(`sync-${Date.now()}`),
    new Response(JSON.stringify(item))
  );

  // Demander une synchronisation dès que la connexion revient
  if ('sync' in self.registration) {
    self.registration.sync.register('docsecur-sync').catch(() => {});
  }

  return new Response(
    JSON.stringify({ queued: true, message: 'Action enregistrée. Sera synchronisée au retour de la connexion.' }),
    { status: 202, headers: { 'Content-Type': 'application/json' } }
  );
}

// ─── Background Sync ─────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'docsecur-sync') {
    event.waitUntil(synchroniserFile());
  }
});

async function synchroniserFile() {
  const cache = await caches.open('docsecur-sync-queue');
  const keys  = await cache.keys();

  for (const key of keys) {
    const response = await cache.match(key);
    if (!response) continue;

    const item = await response.json().catch(() => null);
    if (!item) continue;

    try {
      await fetch(item.url, {
        method:  item.method,
        headers: item.headers,
        body:    item.body || undefined,
      });
      await cache.delete(key);
      console.log('[DocSecur SW] Synchronisé:', item.url);
    } catch (err) {
      console.warn('[DocSecur SW] Sync échoué pour', item.url, err);
    }
  }
}

// ─── Push Notifications ──────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title   = data.title   ?? 'DocSecur';
  const options = {
    body:    data.body    ?? 'Vous avez une nouvelle notification.',
    icon:    '/logo192.png',
    badge:   '/favicon.ico',
    tag:     data.tag     ?? 'docsecur-notif',
    data:    data.url     ?? '/',
    actions: [
      { action: 'open',   title: 'Ouvrir' },
      { action: 'close',  title: 'Fermer' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
        const existing = list.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return clients.openWindow(url);
      })
    );
  }
});

// ─── Helpers ─────────────────────────────────────────────────
function isStaticAsset(url) {
  return (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf)$/) ||
    STATIC_ASSETS.includes(url.pathname)
  );
}

function isCacheableApiRoute(url) {
  return CACHEABLE_API_ROUTES.some((route) => url.pathname.startsWith(route));
}
