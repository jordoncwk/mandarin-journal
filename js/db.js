const DB_NAME = 'mandarin-journal';
const DB_VERSION = 1;

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(storeName, mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function getAll(storeName) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(storeName, 'readonly');
    const req = t.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export function saveEntry(entry) {
  return tx('entries', 'readwrite', store => store.put(entry));
}

export function getEntry(id) {
  return tx('entries', 'readonly', store => store.get(id));
}

export function deleteEntry(id) {
  return tx('entries', 'readwrite', store => store.delete(id));
}

export function listEntries() {
  return getAll('entries').then(rows =>
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export function addToSyncQueue(entry) {
  return tx('syncQueue', 'readwrite', store => store.put(entry));
}

export function getSyncQueue() {
  return getAll('syncQueue');
}

export function removeFromSyncQueue(id) {
  return tx('syncQueue', 'readwrite', store => store.delete(id));
}

export function queueDeletion(id) {
  return tx('syncQueue', 'readwrite', store =>
    store.put({ id, _deleted: true, updatedAt: new Date().toISOString() })
  );
}
