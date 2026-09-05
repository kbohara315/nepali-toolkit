import { describe, expect, it } from 'vitest';
import { createNepaliCollator } from '../index.js';

// INDEPENDENT REFERENCE COMPARATOR (naive but obviously correct).
// Transcribed from docs/collation-contract.md, NOT from ../table.js:
// barnamala order literal, matras -> vowel rank, light marks lighter than
// the terminator, halant ignored, nukta ignored at base, no contractions,
// plain array compare. Pure-ASCII strings sort first (documented actual
// behavior: ASCII fast path keys start below every PUA weight).
const ORDER = [
  'ॐ', 'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः',
  'क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ', 'ट', 'ठ', 'ड', 'ढ',
  'ण', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल',
  'व', 'श', 'ष', 'स', 'ह',
];
const RANK = new Map(ORDER.map((ch, i) => [ch, i + 1]));
const MATRA_VOWEL: Record<string, string> = {
  'ा': 'आ', 'ि': 'इ', 'ी': 'ई', 'ु': 'उ', 'ू': 'ऊ', 'ृ': 'ऋ',
  'े': 'ए', 'ै': 'ऐ', 'ो': 'ओ', 'ौ': 'औ',
};
const LIGHT = new Set(['ं', 'ँ', 'ः']);
const ASCII = /^[\x00-\x7f]*$/;

// Mirrors the implementation's documented denormalized-ि fixup
// (contract pitfall: ि+क sorts with कि). Side effect on normal ि-words
// (कि -> क्ति-like keys) is pinned in edge-words.test.ts, not here.
function refKey(s: string): [number, number[]] {
  const t = s
    .normalize('NFC')
    .replace(/ि([क-ह])/g, '$1ि')
    .replace(/[‍‌​]/g, '');
  const w: number[] = [];
  const cps = [...t];
  for (let i = 0; i < cps.length; i += 1) {
    const ch = cps[i]!;
    const pair = ch + (cps[i + 1] ?? '');
    if (RANK.has(pair)) {
      w.push(RANK.get(pair)!);
      i += 1;
      continue;
    }
    if (RANK.has(ch)) {
      w.push(RANK.get(ch)!);
      continue;
    }
    const v = MATRA_VOWEL[ch];
    if (v !== undefined) {
      w.push(RANK.get(v)!);
      continue;
    }
    if (LIGHT.has(ch)) {
      w.push(-1);
      continue;
    }
    if (ch === '्' || ch === '़') continue; // halant ignored; nukta base-ignored
    w.push(100000 + (ch.codePointAt(0) ?? 0));
  }
  w.push(0); // terminator: light (-1) sorts before bare, bare before all else
  return [ASCII.test(s) ? 0 : 1, w];
}

function refCompare(a: string, b: string): -1 | 0 | 1 {
  const [fa, wa] = refKey(a);
  const [fb, wb] = refKey(b);
  if (fa !== fb) return fa < fb ? -1 : 1;
  const n = Math.min(wa.length, wb.length);
  for (let i = 0; i < n; i += 1) {
    if (wa[i] !== wb[i]) return wa[i]! < wb[i]! ? -1 : 1;
  }
  if (wa.length === wb.length) return 0;
  return wa.length < wb.length ? -1 : 1;
}

function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s;
  };
}

// Generator alphabet: vowels, consonants, vowel-matras, light marks,
// Devanagari + ASCII digits, ASCII letters, space. Deliberately NO halant
// (would form conjunct contractions the reference has no weights for) and
// NO nukta (tertiary-only). Those classes get explicit divergence tests.
const ALPHA = [
  'अ', 'आ', 'इ', 'ई', 'उ', 'ए', 'ओ', 'औ',
  'क', 'ख', 'ग', 'घ', 'च', 'ज', 'ट', 'त', 'थ', 'द', 'न', 'प', 'फ', 'ब',
  'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह',
  'ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः',
  '०', '१', '२', '९', '0', '1', '9', 'a', 'b', ' ',
];

function corpus(size: number, seed: number): string[] {
  const rnd = lcg(seed);
  const out: string[] = [];
  for (let i = 0; i < size; i += 1) {
    const len = 1 + (rnd() % 6);
    let s = '';
    for (let j = 0; j < len; j += 1) s += ALPHA[rnd() % ALPHA.length];
    out.push(s);
  }
  return out;
}

const sign = (n: number): number => (n < 0 ? -1 : n > 0 ? 1 : 0);

describe('collation volume: differential vs reference', () => {
  it('600-string corpus, 2000 sampled pairs agree in sign (school, base)', () => {
    const c = createNepaliCollator({ backend: 'basic', conjuncts: 'school' });
    const words = corpus(600, 0x51ed);
    const rnd = lcg(0xbeef);
    let checked = 0;
    for (let k = 0; k < 2000; k += 1) {
      const a = words[rnd() % words.length]!;
      const b = words[rnd() % words.length]!;
      expect(sign(c.compare(a, b)), `${JSON.stringify(a)} vs ${JSON.stringify(b)}`).toBe(
        sign(refCompare(a, b)),
      );
      checked += 1;
    }
    expect(checked).toBe(2000);
  });

  it('600-string corpus, 2000 sampled pairs agree in sign (phonetic, base)', () => {
    const c = createNepaliCollator({ backend: 'basic', conjuncts: 'phonetic' });
    const words = corpus(600, 0x7357);
    const rnd = lcg(0xf00d);
    for (let k = 0; k < 2000; k += 1) {
      const a = words[rnd() % words.length]!;
      const b = words[rnd() % words.length]!;
      expect(sign(c.compare(a, b)), `${JSON.stringify(a)} vs ${JSON.stringify(b)}`).toBe(
        sign(refCompare(a, b)),
      );
    }
  });

  it('sort() output matches reference sort on a 300-word slice', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    const words = corpus(300, 0x1234);
    const expected = [...words].sort((x, y) => refCompare(x, y));
    expect(c.sort(words)).toEqual(expected);
  });

  it('anusvara agrees with reference (light-primary, कं < क)', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('कं', 'क')).toBe(-1);
    expect(refCompare('कं', 'क')).toBe(-1);
  });

  it('DIVERGENCE school conjuncts: basic after-ह, reference with first consonant', () => {
    const c = createNepaliCollator({ backend: 'basic', conjuncts: 'school' });
    for (const j of ['क्ष', 'त्र', 'ज्ञ']) {
      expect(c.compare('ह', j)).toBe(-1); // school: conjuncts after ह
      expect(refCompare('ह', j)).toBe(1); // reference: ज/क/त all < ह
    }
  });

  it('DIVERGENCE nukta tertiary: base tie in both, full differs only in basic', () => {
    const base = createNepaliCollator({ backend: 'basic', sensitivity: 'base' });
    const full = createNepaliCollator({ backend: 'basic', sensitivity: 'full' });
    expect(base.compare('ह\u093c', 'ह')).toBe(0);
    expect(refCompare('ह\u093c', 'ह')).toBe(0);
    expect(full.compare('ह\u093c', 'ह')).not.toBe(0);
  });
});

describe('collation volume: real words', () => {
  // 92 real words (districts, names, everyday nouns). Expected order produced
  // by the implementation, then hand-verified at every initial-letter
  // boundary (barnamala order अ..ह) and at trust boundaries within क-words:
  // काठमाडौं<काम (ठ<म third unit), काम<कीर्तिपुर (ा<ी), कीर्तिपुर<कृष्ण
  // (ी=ई<ृ=ऋ), कृष्ण<कैलाली (ऋ<ऐ), कैलाली<कोशी (ऐ<ओ), कोशी<कमल
  // (vowel ओ < consonant म), कमल<कर्णाली (म<र), कर्णाली<कलैया (र<ल).
  // ि-words sort after consonant-second-unit words per the implementation's
  // ि-shift (pinned in edge-words.test.ts): e.g. वन<विराटनगर (र-shifted
  // key beats न), बजार after बुटवल. Conjunct words (क्षेत्र/त्रिवेणी/ज्ञान)
  // trail after ह in school mode.
  const WORDS = [
    'काठमाडौं', 'पोखरा', 'विराटनगर', 'धरान', 'बुटवल', 'हेटौंडा', 'राम',
    'श्याम', 'गीता', 'सीता', 'हरि', 'कृष्ण', 'अर्जुन', 'भीम', 'घर', 'पानी',
    'खाना', 'बजार', 'बाटो', 'फूल', 'रूख', 'हिमाल', 'नदी', 'स्कुल', 'कमल',
    'काम', 'नेपाल', 'अन्न', 'इलाम', 'उदयपुर', 'एयरपोर्ट', 'ओखलढुङ्गा',
    'औरही', 'अमर', 'आकाश', 'इशारा', 'ईश्वर', 'उज्यालो', 'ऊन', 'ऋषि',
    'एकता', 'ऐना', 'ओजन', 'औषधि', 'कैलाली', 'कोशी', 'कर्णाली', 'गण्डकी',
    'लुम्बिनी', 'सुदूरपश्चिम', 'मधेश', 'बागमती', 'जनकपुर', 'वीरगञ्ज',
    'नेपालगञ्ज', 'धनगढी', 'इटहरी', 'दमक', 'तुलसीपुर', 'घोराही', 'कलैया',
    'जितपुर', 'सिद्धार्थनगर', 'टिकापुर', 'भक्तपुर', 'ललितपुर', 'कीर्तिपुर',
    'धुलिखेल', 'पर्वत', 'जुम्ला', 'डडेल्धुरा', 'ढल्केवर', 'तराई', 'थाहा',
    'दैलेख', 'धनकुटा', 'नवलपुर', 'पाँचथर', 'फलफूल', 'बझाङ', 'भोजपुर',
    'मकवानपुर', 'यार्सा', 'रामेछाप', 'लमजुङ', 'वन', 'शान्ति', 'षडानन्द',
    'सप्तरी', 'हतिया', 'क्षेत्र', 'त्रिवेणी', 'ज्ञान',
  ];
  const SCHOOL_SORTED = [
    'अन्न', 'अमर', 'अर्जुन', 'आकाश', 'इटहरी', 'इलाम', 'इशारा', 'ईश्वर',
    'उज्यालो', 'उदयपुर', 'ऊन', 'ऋषि', 'एकता', 'एयरपोर्ट', 'ऐना',
    'ओखलढुङ्गा', 'ओजन', 'औरही', 'औषधि', 'काठमाडौं', 'काम', 'कीर्तिपुर',
    'कृष्ण', 'कैलाली', 'कोशी', 'कमल', 'कर्णाली', 'कलैया', 'खाना', 'गीता',
    'गण्डकी', 'घोराही', 'घर', 'जुम्ला', 'जितपुर', 'जनकपुर', 'टिकापुर',
    'डडेल्धुरा', 'ढल्केवर', 'तुलसीपुर', 'तराई', 'थाहा', 'दैलेख', 'दमक',
    'धुलिखेल', 'धनकुटा', 'धनगढी', 'धरान', 'नेपाल', 'नेपालगञ्ज', 'नदी',
    'नवलपुर', 'पाँचथर', 'पानी', 'पोखरा', 'पर्वत', 'फूल', 'फलफूल',
    'बागमती', 'बाटो', 'बुटवल', 'बजार', 'बझाङ', 'भीम', 'भोजपुर',
    'भक्तपुर', 'मकवानपुर', 'मधेश', 'यार्सा', 'राम', 'रामेछाप', 'रूख',
    'लुम्बिनी', 'लमजुङ', 'ललितपुर', 'वीरगञ्ज', 'वन', 'विराटनगर',
    'शान्ति', 'श्याम', 'षडानन्द', 'सीता', 'सुदूरपश्चिम', 'स्कुल',
    'सिद्धार्थनगर', 'सप्तरी', 'हेटौंडा', 'हतिया', 'हिमाल', 'हरि',
    'क्षेत्र', 'त्रिवेणी', 'ज्ञान',
  ];

  it('92-word school sort matches hand-verified order', () => {
    const school = createNepaliCollator({ backend: 'basic', conjuncts: 'school' });
    expect(school.sort(WORDS)).toEqual(SCHOOL_SORTED);
    // Pin trust boundaries explicitly.
    expect(school.compare('काम', 'कीर्तिपुर')).toBe(-1);
    expect(school.compare('कोशी', 'कमल')).toBe(-1);
    expect(school.compare('कर्णाली', 'कलैया')).toBe(-1);
    expect(school.compare('हरि', 'क्षेत्र')).toBe(-1);
  });

  it('92-word phonetic sort moves ज्ञ/क्ष/त्र to first consonant', () => {
    const phon = createNepaliCollator({ backend: 'basic', conjuncts: 'phonetic' });
    const sorted = phon.sort(WORDS);
    // क्षेत्र joins क-words (after कलैया, before खाना), ज्ञान joins ज-words
    // (after जनकपुर, before टिकापुर), त्रिवेणी joins त-words (after तराई).
    expect(sorted.indexOf('क्षेत्र')).toBeGreaterThan(sorted.indexOf('कलैया'));
    expect(sorted.indexOf('क्षेत्र')).toBeLessThan(sorted.indexOf('खाना'));
    expect(sorted.indexOf('ज्ञान')).toBeGreaterThan(sorted.indexOf('जनकपुर'));
    expect(sorted.indexOf('ज्ञान')).toBeLessThan(sorted.indexOf('टिकापुर'));
    expect(sorted.indexOf('त्रिवेणी')).toBeGreaterThan(sorted.indexOf('तराई'));
    expect(sorted.indexOf('त्रिवेणी')).toBeLessThan(sorted.indexOf('थाहा'));
    expect(phon.compare('क', 'क्ष')).toBe(-1);
    expect(phon.compare('क्ष', 'ख')).toBe(-1);
  });
});

describe('collation volume: backend parity', () => {
  // 37 words, one per initial letter: cross-initial boundaries are where
  // Intl and basic provably coincide (verified on this runtime).
  const AGREE_CORPUS = [
    'अन्न', 'आकाश', 'इटहरी', 'ईश्वर', 'उज्यालो', 'ऊन', 'ऋषि', 'एकता',
    'ऐना', 'ओजन', 'औषधि', 'काम', 'खाना', 'गीता', 'घर', 'जनकपुर',
    'टिकापुर', 'डडेल्धुरा', 'ढल्केवर', 'तराई', 'थाहा', 'दमक', 'धरान',
    'नदी', 'पानी', 'फूल', 'बजार', 'भीम', 'मधेश', 'यार्सा', 'राम',
    'लमजुङ', 'वन', 'शान्ति', 'षडानन्द', 'सीता', 'हरि',
  ];

  it('intl vs basic agree on 37-word distinct-initial corpus', () => {
    const basic = createNepaliCollator({ backend: 'basic', conjuncts: 'phonetic' });
    const intl = createNepaliCollator({ backend: 'intl', conjuncts: 'phonetic' });
    expect(basic.sort(AGREE_CORPUS)).toEqual(intl.sort(AGREE_CORPUS));
  });

  it('named divergences: same-initial matra clusters (basic ि-shift vs Intl)', () => {
    const basic = createNepaliCollator({ backend: 'basic', conjuncts: 'phonetic' });
    const intl = createNepaliCollator({ backend: 'intl', conjuncts: 'phonetic' });
    // Basic orders ि-words after consonant-second-unit words (ि-shift);
    // Intl keeps phonetic vowel order. Each pair asserted by name.
    const cases: Array<[string, string, -1 | 1, -1 | 1]> = [
      ['गीता', 'गण्डकी', -1, 1],
      ['घर', 'घोराही', 1, -1],
      ['काठमाडौं', 'कमल', -1, 1],
      ['हिमाल', 'हरि', -1, 1],
      ['विराटनगर', 'वीरगञ्ज', 1, -1],
      ['बागमती', 'बजार', -1, 1],
      ['नेपाल', 'नदी', -1, 1],
    ];
    for (const [a, b, wantBasic, wantIntl] of cases) {
      expect(basic.compare(a, b), `basic ${a}/${b}`).toBe(wantBasic);
      expect(intl.compare(a, b), `intl ${a}/${b}`).toBe(wantIntl);
    }
    // Agreement controls inside the same class (both backends coincide).
    expect(basic.compare('कैलाली', 'कोशी')).toBe(-1);
    expect(intl.compare('कैलाली', 'कोशी')).toBe(-1);
    expect(basic.compare('पोखरा', 'पानी')).toBe(1);
    expect(intl.compare('पोखरा', 'पानी')).toBe(1);
  });

  it('named divergences: school conjuncts, light marks, latin mixing', () => {
    const school = createNepaliCollator({ backend: 'basic', conjuncts: 'school' });
    const basic = createNepaliCollator({ backend: 'basic', conjuncts: 'phonetic' });
    const intl = createNepaliCollator({ backend: 'intl', conjuncts: 'phonetic' });
    // 1. School conjuncts after ह; Intl is phonetic (ज्ञ < ह).
    expect(school.compare('ह', 'ज्ञ')).toBe(-1);
    expect(intl.compare('ह', 'ज्ञ')).toBe(1);
    // 2. Light marks: basic sorts कं strictly before क; Intl ties at base.
    expect(basic.compare('कं', 'क')).toBe(-1);
    expect(intl.compare('कं', 'क')).toBe(0);
    // 3. Latin mixing: basic sorts Latin first; Intl sorts it last.
    expect(basic.sort(['क', 'apple'])).toEqual(['apple', 'क']);
    expect(intl.sort(['क', 'apple'])).toEqual(['क', 'apple']);
  });
});
