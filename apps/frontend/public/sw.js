const CACHE_NAME = 'bridge-v1';
const urlsToCache = [
  '/',
  '/events',
  '/new',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncResults());
  }
});

async function syncResults() {
  // Sync any queued results when back online
  const queue = await getQueuedResults();
  for (const result of queue) {
    try {
      await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
    } catch (e) {
      console.error('Failed to sync result:', e);
    }
  }
}

async function getQueuedResults() {
  // Get from IndexedDB or localStorage
  return JSON.parse(localStorage.getItem('queuedResults') || '[]');
} 