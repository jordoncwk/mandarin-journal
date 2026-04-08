import 'fake-indexeddb/auto';
import {
  saveEntry, getEntry, listEntries, deleteEntry,
  addToSyncQueue, getSyncQueue, removeFromSyncQueue,
} from '../js/db.js';

const sample = {
  id: 'test-1',
  characters: '你好',
  pinyin: 'nǐ hǎo',
  english: 'Hello',
  notes: '',
  tags: ['greetings'],
  radicals: [],
  createdAt: '2026-04-08T10:00:00.000Z',
  updatedAt: '2026-04-08T10:00:00.000Z',
};

test('saveEntry then getEntry returns the entry', async () => {
  await saveEntry(sample);
  const result = await getEntry('test-1');
  expect(result.characters).toBe('你好');
});

test('listEntries returns saved entries newest first', async () => {
  const older = { ...sample, id: 'old-1', createdAt: '2026-04-07T10:00:00.000Z', updatedAt: '2026-04-07T10:00:00.000Z' };
  await saveEntry(older);
  const list = await listEntries();
  expect(list[0].id).toBe('test-1'); // newer first
});

test('saveEntry with same id overwrites', async () => {
  const updated = { ...sample, english: 'Hi' };
  await saveEntry(updated);
  const result = await getEntry('test-1');
  expect(result.english).toBe('Hi');
});

test('deleteEntry removes entry', async () => {
  await deleteEntry('test-1');
  const result = await getEntry('test-1');
  expect(result).toBeUndefined();
});

test('syncQueue: add then get then remove', async () => {
  const entry = { ...sample, id: 'sync-1' };
  await addToSyncQueue(entry);
  const queue = await getSyncQueue();
  expect(queue.some(e => e.id === 'sync-1')).toBe(true);
  await removeFromSyncQueue('sync-1');
  const after = await getSyncQueue();
  expect(after.some(e => e.id === 'sync-1')).toBe(false);
});
