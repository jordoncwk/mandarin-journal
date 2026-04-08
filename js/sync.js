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
      const resp = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'upsertEntry', entry }),
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
    for (const entry of remote) {
      const localEntry = localMap[entry.id];
      if (!localEntry || entry.updatedAt > localEntry.updatedAt) {
        await saveEntry(entry);
      }
    }
  } catch (_) {
    // silent — try again on next launch
  }
}
