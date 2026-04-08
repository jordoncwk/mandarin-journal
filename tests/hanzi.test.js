import { decompose } from '../js/hanzi.js';
import { readFileSync } from 'fs';

// Load the real hanzidb.json for tests
const db = JSON.parse(readFileSync('./data/hanzidb.json', 'utf-8'));

// Inject into globalThis so hanzi.js can use it without fetch
globalThis._hanziTestDB = db;

test('decomposes 明 into 日 and 月', async () => {
  const result = await decompose('明');
  expect(result).toHaveLength(1);
  expect(result[0].char).toBe('明');
  expect(result[0].components).toContain('日');
  expect(result[0].components).toContain('月');
});

test('decomposes multiple characters', async () => {
  const result = await decompose('你好');
  expect(result.length).toBeGreaterThanOrEqual(1);
  const chars = result.map(r => r.char);
  expect(chars).toContain('你');
});

test('character with no breakdown returns empty components', async () => {
  const result = await decompose('一');
  // 一 has no components — it should either be absent or have empty components
  const entry = result.find(r => r.char === '一');
  if (entry) expect(entry.components).toHaveLength(0);
  else expect(result.filter(r => r.char === '一')).toHaveLength(0);
});
