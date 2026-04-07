import { convertPinyin } from '../js/pinyin.js';

test('converts single syllable with tone 1', () => {
  expect(convertPinyin('ma1')).toBe('mā');
});

test('converts single syllable with tone 2', () => {
  expect(convertPinyin('ma2')).toBe('má');
});

test('converts single syllable with tone 3', () => {
  expect(convertPinyin('ma3')).toBe('mǎ');
});

test('converts single syllable with tone 4', () => {
  expect(convertPinyin('ma4')).toBe('mà');
});

test('tone 5 (neutral) leaves vowel unchanged', () => {
  expect(convertPinyin('ma5')).toBe('ma');
});

test('converts multi-syllable string', () => {
  expect(convertPinyin('ni3 hao3')).toBe('nǐ hǎo');
});

test('a or e takes the mark over other vowels', () => {
  expect(convertPinyin('dui4')).toBe('duì');
  expect(convertPinyin('gui4')).toBe('guì');
});

test('ou: o takes the mark', () => {
  expect(convertPinyin('gou3')).toBe('gǒu');
});

test('last vowel gets mark when no a/e/ou', () => {
  expect(convertPinyin('liu2')).toBe('liú');
});

test('handles v as ü', () => {
  expect(convertPinyin('lv4')).toBe('lǜ');
});

test('real sentence', () => {
  expect(convertPinyin('wo3 shi4 xue2 sheng1')).toBe('wǒ shì xué shēng');
});

test('leaves non-numbered text unchanged', () => {
  expect(convertPinyin('hello')).toBe('hello');
});
