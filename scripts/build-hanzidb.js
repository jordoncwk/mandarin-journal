import { readFileSync, writeFileSync } from 'fs';

// IDS (Ideographic Description Sequence) operators
const IDS_OPS = new Set(['⿰','⿱','⿲','⿳','⿴','⿵','⿶','⿷','⿸','⿹','⿺','⿻']);

function isCJK(char) {
  const cp = char.codePointAt(0);
  return (cp >= 0x2E80 && cp <= 0x2EFF) ||   // CJK Radicals Supplement
         (cp >= 0x4E00 && cp <= 0x9FFF) ||   // CJK Unified
         (cp >= 0x3400 && cp <= 0x4DBF) ||   // CJK Extension A
         (cp >= 0x20000 && cp <= 0x2A6DF);   // CJK Extension B
}

function extractComponents(decomposition) {
  if (!decomposition || decomposition === '？') return [];
  return [...decomposition].filter(c => !IDS_OPS.has(c) && isCJK(c));
}

const lines = readFileSync('./scripts/dictionary.txt', 'utf-8').trim().split('\n');
const result = {};

for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    const components = extractComponents(entry.decomposition);
    if (components.length > 0) {
      result[entry.character] = components;
    }
  } catch (_) {
    // skip malformed lines
  }
}

writeFileSync('./data/hanzidb.json', JSON.stringify(result));
console.log(`Built data/hanzidb.json with ${Object.keys(result).length} characters`);
