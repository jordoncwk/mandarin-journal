const CACHE = 'mandarin-journal-v1';

const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/app.js',
  '/js/router.js',
  '/js/db.js',
  '/js/sync.js',
  '/js/config.js',
  '/js/pinyin.js',
  '/js/hanzi.js',
  '/js/tts.js',
  '/js/search.js',
  '/js/journal.js',
  '/js/form.js',
  '/js/detail.js',
  '/js/flashcard.js',
  '/data/hanzidb.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for GAS API calls
  if (e.request.url.includes('script.google.com')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({ ok: false, error: 'offline' }), {
        headers: { 'Content-Type': 'application/json' },
      }))
    );
    return;
  }
  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
