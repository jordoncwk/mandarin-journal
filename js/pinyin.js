const TONES = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
};

function applyTone(syllable, toneNum) {
  const tone = parseInt(toneNum, 10) - 1; // 0-indexed, 4 = neutral
  // Normalise v → ü
  const s = syllable.toLowerCase().replace(/v/g, 'ü');

  // Rule 1: a or e always takes the mark
  if (/[ae]/.test(s)) {
    return s.replace(/[ae]/, m => TONES[m][tone]);
  }
  // Rule 2: ou — o takes the mark
  if (s.includes('ou')) {
    return s.replace('o', TONES['o'][tone]);
  }
  // Rule 3: last vowel takes the mark
  const vowels = ['a', 'e', 'i', 'o', 'u', 'ü'];
  for (let i = s.length - 1; i >= 0; i--) {
    if (vowels.includes(s[i])) {
      return s.slice(0, i) + TONES[s[i]][tone] + s.slice(i + 1);
    }
  }
  return s;
}

export function convertPinyin(input) {
  return input.replace(/([a-züv]+)([1-5])/gi, (_match, syllable, tone) =>
    applyTone(syllable, tone)
  );
}
