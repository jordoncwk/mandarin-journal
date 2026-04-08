import { searchEntries } from '../js/search.js';

const entries = [
  { id: '1', characters: '你好', pinyin: 'nǐ hǎo', english: 'Hello', notes: 'greeting' },
  { id: '2', characters: '谢谢', pinyin: 'xiè xie', english: 'Thank you', notes: 'polite' },
  { id: '3', characters: '水', pinyin: 'shuǐ', english: 'Water', notes: 'basic vocab' },
];

test('empty query returns all entries', () => {
  expect(searchEntries(entries, '')).toHaveLength(3);
});

test('null query returns all entries', () => {
  expect(searchEntries(entries, null)).toHaveLength(3);
});

test('matches Chinese characters', () => {
  const result = searchEntries(entries, '你好');
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('1');
});

test('matches pinyin (case insensitive)', () => {
  const result = searchEntries(entries, 'XIE');
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('2');
});

test('matches English (case insensitive)', () => {
  const result = searchEntries(entries, 'water');
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('3');
});

test('matches notes field', () => {
  const result = searchEntries(entries, 'polite');
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('2');
});

test('returns empty array when no match', () => {
  expect(searchEntries(entries, 'zzznomatch')).toHaveLength(0);
});
