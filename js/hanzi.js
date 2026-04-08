let _db = null;

async function loadDB() {
  if (_db) return _db;
  // Test environment injects _hanziTestDB to avoid fetch
  if (typeof globalThis._hanziTestDB !== 'undefined') {
    _db = globalThis._hanziTestDB;
    return _db;
  }
  const resp = await fetch('./data/hanzidb.json');
  _db = await resp.json();
  return _db;
}

export async function decompose(characters) {
  const db = await loadDB();
  return [...characters]
    .map(char => ({ char, components: db[char] || [] }))
    .filter(r => r.components.length > 0);
}
