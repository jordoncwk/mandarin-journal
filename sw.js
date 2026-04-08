const CACHE = 'mandarin-journal-v7';
const BASE = '/mandarin-journal';

const SHELL = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/css/styles.css',
  BASE + '/js/app.js',
  BASE + '/js/router.js',
  BASE + '/js/db.js',
  BASE + '/js/sync.js',
  BASE + '/js/config.js',
  BASE + '/js/pinyin.js',
  BASE + '/js/hanzi.js',
  BASE + '/js/tts.js',
  BASE + '/js/search.js',
  BASE + '/js/journal.js',
  BASE + '/js/form.js',
  BASE + '/js/detail.js',
  BASE + '/js/flashcard.js',
  BASE + '/data/hanzidb.json',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
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
