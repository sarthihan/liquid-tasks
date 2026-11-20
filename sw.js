// sw.js - Service Worker for Liquid Tasks
const CACHE_NAME = 'liquid-tasks-v1';
const ASSETS_TO_CACHE = [
  './',           // Alias for index.html
  './index.html',
  './manifest.json',
  // Note: CSS/JS are inline in index.html, so caching index.html covers them.
  // If you split files later, add './styles.css', './app.js' here.
];

// 1. Install: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
	caches.open(CACHE_NAME)
	  .then((cache) => {
		console.log('[SW] Caching App Shell');
		return cache.addAll(ASSETS_TO_CACHE);
	  })
	  .then(() => self.skipWaiting()) // Activate immediately
  );
});

// 2. Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
	caches.keys().then((keys) => {
	  return Promise.all(
		keys.filter((key) => key !== CACHE_NAME)
		  .map((key) => caches.delete(key))
	  );
	}).then(() => self.clients.claim()) // Take control immediately
  );
});

// 3. Fetch: Cache First Strategy (Offline First)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Strategy: Cache First, fallback to Network
  event.respondWith(
	caches.match(event.request).then((cachedResponse) => {
	  // Return cached if found
	  if (cachedResponse) {
		return cachedResponse;
	  }

	  // Otherwise fetch from network
	  return fetch(event.request).then((networkResponse) => {
		// Optional: Cache new requests dynamically (e.g. if you add images later)
		// if (networkResponse.ok) { ... cache.put ... }
		return networkResponse;
	  }).catch(() => {
		// Offline Fallback: If it's a navigation request (HTML), return cached index.html
		if (event.request.mode === 'navigate') {
		  return caches.match('./index.html');
		}
		// For other assets, just fail (browser shows default error)
		return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
	  });
	})
  );
});

// Optional: Listen for messages from main thread (e.g. "skipWaiting")
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});