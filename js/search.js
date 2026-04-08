export function searchEntries(entries, query) {
  if (!query || !query.trim()) return entries;
  const q = query.toLowerCase().trim();
  return entries.filter(e =>
    (e.characters || '').includes(q) ||
    (e.pinyin || '').toLowerCase().includes(q) ||
    (e.english || '').toLowerCase().includes(q) ||
    (e.notes || '').toLowerCase().includes(q)
  );
}
