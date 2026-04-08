import { GAS_URL } from './config.js';
import { getSyncQueue, removeFromSyncQueue, saveEntry, listEntries } from './db.js';

export async function initSync() {
  window.addEventListener('online', () => {
    pullFromSheets().then(flushQueue);
  });
  if (navigator.onLine && GAS_URL) {
    await pullFromSheets();
    await flushQueue();
  }
}

async function flushQueue() {
  if (!GAS_URL || !navigator.onLine) return;
  const queue = await getSyncQueue();
  for (const entry of queue) {
    try {
      const action = entry._deleted ? 'deleteEntry' : 'upsertEntry';
      const resp = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, entry }),
      });
      const result = await resp.json();
      if (result.ok) await removeFromSyncQueue(entry.id);
    } catch (_) {
      break; // network failed — retry on next online event
    }
  }
}

async function pullFromSheets() {
  if (!GAS_URL || !navigator.onLine) return;
  try {
    const resp = await fetch(`${GAS_URL}?action=getAll`);
    const { ok, entries: remote } = await resp.json();
    if (!ok || !remote) return;
    const local = await listEntries();
    const localMap = Object.fromEntries(local.map(e => [e.id, e]));
    let changed = false;
    for (const entry of remote) {
      if (entry._deleted) continue;
      const localEntry = localMap[entry.id];
      if (!localEntry || entry.updatedAt > localEntry.updatedAt) {
        await saveEntry(entry);
        changed = true;
      }
    }
    if (changed) window.dispatchEvent(new CustomEvent('sync-complete'));
  } catch (_) {
    // silent — try again on next launch
  }
}
