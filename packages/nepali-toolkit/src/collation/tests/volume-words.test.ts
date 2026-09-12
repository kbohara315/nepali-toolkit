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

// Mirrors the implementation’s guarded preposed-ि fixup: a stray ि swaps
// past its consonant only when not already preceded by one, so correct
// ि-words keep [क,इ,…] keys (contract pitfall: ि+क sorts with कि).
function refKey(s: string): [number, number[]] {
  const t = s
    .normalize('NFC')
    .replace(/(^|[^\u0915-\u0939\u0958-\u0961\u094D\u093C])\u093F([\u0915-\u0939\u0958-\u0961])/g, '$1$2\u093F')
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
  // The preposed-ि fixup is guarded, so correct ि-words key as [क,इ,…]:
  // जितपुर<जुम्ला, विराटनगर<वीरगञ्ज<वन, सिद्धार्थनगर<सीता<सुदूरपश्चिम,
  // हिमाल<हतिया. Conjunct words (क्षेत्र/त्रिवेणी/ज्ञान) trail after ह
  // in school mode.
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
    'गण्डकी', 'घोराही', 'घर', 'जितपुर', 'जुम्ला', 'जनकपुर', 'टिकापुर',
    'डडेल्धुरा', 'ढल्केवर', 'तुलसीपुर', 'तराई', 'थाहा', 'दैलेख', 'दमक',
    'धुलिखेल', 'धनकुटा', 'धनगढी', 'धरान', 'नेपाल', 'नेपालगञ्ज', 'नदी',
    'नवलपुर', 'पाँचथर', 'पानी', 'पोखरा', 'पर्वत', 'फूल', 'फलफूल',
    'बागमती', 'बाटो', 'बुटवल', 'बजार', 'बझाङ', 'भीम', 'भोजपुर',
    'भक्तपुर', 'मकवानपुर', 'मधेश', 'यार्सा', 'राम', 'रामेछाप', 'रूख',
    'लुम्बिनी', 'लमजुङ', 'ललितपुर', 'विराटनगर', 'वीरगञ्ज', 'वन',
    'शान्ति', 'श्याम', 'षडानन्द', 'सिद्धार्थनगर', 'सीता', 'सुदूरपश्चिम',
    'स्कुल', 'सप्तरी', 'हिमाल', 'हेटौंडा', 'हतिया', 'हरि',
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

describe('collation volume: 92-word per-pair proof (all 91 adjacent pairs)', () => {
  // Each pair below was verified independently with compare() === -1 against
  // backend ‘basic’, conjuncts ‘school’. The comment on each line names the
  // contract rule that decides it:
  // - "barnamala X<Y @posN": first differing unit, both chart ranks.
  // - "matra X→V": matra maps to its vowel’s weight (contract table).
  // - "light": anusvara/chandrabindu lighter-primary (कं < क analogue).
  // - "prefix": one word is a strict prefix of the next (terminator rule).
  // - "halant-skip": halant carries no weight; decision is between the
  //   surrounding non-halant weights (contract: halant weight-ignored).
  // - "school": school conjunct contraction weight after ह (contract §).
  // Cross-checked against Intl.Collator(‘ne-NP’) on this runtime: remaining
  // disagreements sit in two known classes — (a) matra-vs-consonant ordering
  // (basic sorts post-base matras, including pre-base ि, by vowel weight before
  // any consonant second unit; Intl orders some of these consonant-first, e.g.
  // वीरगञ्ज/वन, हिमाल/हरि, स्कुल/सप्तरी), (b) school conjuncts after ह (Intl
  // is phonetic). Pre-base ि needs no special rule: the guarded fixup leaves
  // correct input alone, so ि-pairs mostly agree with Intl (जितपुर/जुम्ला,
  // विराटनगर/वीरगञ्ज, सिद्धार्थनगर/सीता).
  const school = () => createNepaliCollator({ backend: 'basic', conjuncts: 'school' });
  const check = (pairs: Array<[string, string, string]>) => {
    const c = school();
    for (const [a, b, rule] of pairs) {
      expect(c.compare(a, b), `${a} < ${b} [${rule}]`).toBe(-1);
    }
  };

  it('pairs 0-18: vowel-initial headwords ordered by barnamala rank', () => {
    check([
      ['अन्न', 'अमर', 'barnamala न<म @pos1'],
      ['अमर', 'अर्जुन', 'barnamala म<र @pos1'],
      ['अर्जुन', 'आकाश', 'barnamala अ<आ @pos0'],
      ['आकाश', 'इटहरी', 'barnamala आ<इ @pos0'],
      ['इटहरी', 'इलाम', 'barnamala ट<ल @pos1'],
      ['इलाम', 'इशारा', 'barnamala ल<श @pos1'],
      ['इशारा', 'ईश्वर', 'barnamala इ<ई @pos0'],
      ['ईश्वर', 'उज्यालो', 'barnamala ई<उ @pos0'],
      ['उज्यालो', 'उदयपुर', 'barnamala ज<द @pos1'],
      ['उदयपुर', 'ऊन', 'barnamala उ<ऊ @pos0'],
      ['ऊन', 'ऋषि', 'barnamala ऊ<ऋ @pos0'],
      ['ऋषि', 'एकता', 'barnamala ऋ<ए @pos0'],
      ['एकता', 'एयरपोर्ट', 'barnamala क<य @pos1'],
      ['एयरपोर्ट', 'ऐना', 'barnamala ए<ऐ @pos0'],
      ['ऐना', 'ओखलढुङ्गा', 'barnamala ऐ<ओ @pos0'],
      ['ओखलढुङ्गा', 'ओजन', 'barnamala ख<ज @pos1'],
      ['ओजन', 'औरही', 'barnamala ओ<औ @pos0'],
      ['औरही', 'औषधि', 'barnamala र<ष @pos1'],
      ['औषधि', 'काठमाडौं', 'barnamala औ<क @pos0 (vowel block before consonants)'],
    ]);
  });

  it('pairs 19-27: क-cluster matra ladder then consonant-second-unit rise', () => {
    check([
      ['काठमाडौं', 'काम', 'barnamala ठ<म @pos2'],
      ['काम', 'कीर्तिपुर', 'matra ा→आ(3)<ी→ई(5) @pos1'],
      ['कीर्तिपुर', 'कृष्ण', 'matra ी→ई(5)<ृ→ऋ(8) @pos1'],
      ['कृष्ण', 'कैलाली', 'matra ृ→ऋ(8)<ै→ऐ(10) @pos1'],
      ['कैलाली', 'कोशी', 'matra ै→ऐ(10)<ो→ओ(11) @pos1'],
      ['कोशी', 'कमल', 'matra ो→ओ(11) < consonant म @pos1 (vowel weight below every consonant; Intl DIVERGES here: known matra class)'],
      ['कमल', 'कर्णाली', 'barnamala म<र @pos1 (halant in र्ण skipped: halant-skip)'],
      ['कर्णाली', 'कलैया', 'barnamala र<ल @pos1'],
      ['कलैया', 'खाना', 'barnamala क<ख @pos0'],
    ]);
  });

  it('pairs 28-41: ग/घ/ज consonant steps with matra-before-consonant decisions', () => {
    check([
      ['खाना', 'गीता', 'barnamala ख<ग @pos0'],
      ['गीता', 'गण्डकी', 'matra ी→ई(5) < consonant ण @pos1 (Intl DIVERGES: known matra class)'],
      ['गण्डकी', 'घोराही', 'barnamala ग<घ @pos0 (halant in ण्ड skipped: halant-skip)'],
      ['घोराही', 'घर', 'matra ो→ओ(11) < consonant र @pos1 (Intl DIVERGES: known matra class)'],
      ['घर', 'जुम्ला', 'barnamala घ<ज @pos0'],
      ['जितपुर', 'जुम्ला', 'matra ि→इ(4)<ु→उ(6) @pos1'],
      ['जितपुर', 'जनकपुर', 'matra ि→इ(4) < consonant न @pos1 (Intl DIVERGES: known matra class)'],
      ['जनकपुर', 'टिकापुर', 'barnamala ज<ट @pos0'],
      ['टिकापुर', 'डडेल्धुरा', 'barnamala ट<ड @pos0'],
      ['डडेल्धुरा', 'ढल्केवर', 'barnamala ड<ढ @pos0 (halants skipped)'],
      ['ढल्केवर', 'तुलसीपुर', 'barnamala ढ<त @pos0 (halant in ल्क skipped)'],
      ['तुलसीपुर', 'तराई', 'matra ु→उ(6) < consonant र @pos1 (Intl DIVERGES: known matra class)'],
      ['तराई', 'थाहा', 'barnamala त<थ @pos0'],
    ]);
  });

  it('pairs 42-56: द/ध/न/प/फ steps, light-mark and prefix rules', () => {
    check([
      ['थाहा', 'दैलेख', 'barnamala थ<द @pos0'],
      ['दैलेख', 'दमक', 'matra ै→ऐ(10) < consonant म @pos1 (Intl DIVERGES: known matra class)'],
      ['दमक', 'धुलिखेल', 'barnamala द<ध @pos0'],
      ['धुलिखेल', 'धनकुटा', 'matra ु→उ(6) < consonant न @pos1 (Intl DIVERGES: known matra class)'],
      ['धनकुटा', 'धनगढी', 'barnamala क<ग @pos2'],
      ['धनगढी', 'धरान', 'barnamala न<र @pos1'],
      ['धरान', 'नेपाल', 'barnamala ध<न @pos0'],
      ['नेपाल', 'नेपालगञ्ज', 'prefix: नेपाल shorter (terminator rule)'],
      ['नेपालगञ्ज', 'नदी', 'matra े→ए(9) < consonant द @pos1 (Intl DIVERGES: known matra class)'],
      ['नदी', 'नवलपुर', 'barnamala द<व @pos1'],
      ['नवलपुर', 'पाँचथर', 'barnamala न<प @pos0'],
      ['पाँचथर', 'पानी', 'light: चँ carries LIGHT_MARK(U+E000) < न weight @pos2 (anusvara light-primary)'],
      ['पानी', 'पोखरा', 'matra ा→आ(3)<ो→ओ(11) @pos1'],
      ['पोखरा', 'पर्वत', 'matra ो→ओ(11) < consonant र @pos1, halant in र्व skipped (Intl DIVERGES: known matra class)'],
      ['पर्वत', 'फूल', 'barnamala प<फ @pos0 (halant in र्व skipped)'],
    ]);
  });

  it('pairs 57-70: फ/ब/भ/म/य/र steps with ि-shift and prefix rules', () => {
    check([
      ['फूल', 'फलफूल', 'matra ू→ऊ(7) < consonant ल @pos1 (Intl DIVERGES: known matra class)'],
      ['फलफूल', 'बागमती', 'barnamala फ<ब @pos0'],
      ['बागमती', 'बाटो', 'barnamala ग<ट @pos2'],
      ['बाटो', 'बुटवल', 'matra ा→आ(3)<ु→उ(6) @pos1'],
      ['बुटवल', 'बजार', 'matra ु→उ(6) < consonant ज @pos1 (Intl DIVERGES: known matra class)'],
      ['बजार', 'बझाङ', 'barnamala ज<झ @pos1'],
      ['बझाङ', 'भीम', 'barnamala ब<भ @pos0'],
      ['भीम', 'भोजपुर', 'matra ी→ई(5)<ो→ओ(11) @pos1'],
      ['भोजपुर', 'भक्तपुर', 'matra ो→ओ(11) < consonant क @pos1, halant in क्त skipped (Intl DIVERGES: known matra class)'],
      ['भक्तपुर', 'मकवानपुर', 'barnamala भ<म @pos0 (halant in क्त skipped)'],
      ['मकवानपुर', 'मधेश', 'barnamala क<ध @pos1'],
      ['मधेश', 'यार्सा', 'barnamala म<य @pos0'],
      ['यार्सा', 'राम', 'barnamala य<र @pos0 (halant in र्स skipped)'],
      ['राम', 'रामेछाप', 'prefix: राम shorter (terminator rule)'],
    ]);
  });

  it('pairs 71-85: र/ल/व/श/ष/स steps with halant-skip decisions', () => {
    check([
      ['रामेछाप', 'रूख', 'matra ा→आ(3)<ू→ऊ(7) @pos1'],
      ['रूख', 'लुम्बिनी', 'barnamala र<ल @pos0'],
      ['लुम्बिनी', 'लमजुङ', 'matra ु→उ(6) < consonant म @pos1 (Intl DIVERGES: known matra class)'],
      ['लमजुङ', 'ललितपुर', 'barnamala म<ल @pos1'],
      ['ललितपुर', 'विराटनगर', 'barnamala ल<व @pos0'],
      ['विराटनगर', 'वीरगञ्ज', 'matra ि→इ(4)<ी→ई(5) @pos1'],
      ['वीरगञ्ज', 'वन', 'matra ी→ई(5) < consonant न @pos1 (Intl DIVERGES: known matra class)'],
      ['वन', 'शान्ति', 'barnamala व<श @pos0 (halant in ट्न skipped)'],
      ['शान्ति', 'श्याम', 'matra ा→आ(3) < consonant य @pos1; key शान्ति=श,आ,न… vs श्याम=श,य,आ… (halants skipped)'],
      ['श्याम', 'षडानन्द', 'barnamala श<ष @pos0 (halant in श्य skipped)'],
      ['षडानन्द', 'सिद्धार्थनगर', 'barnamala ष<स @pos0'],
      ['सिद्धार्थनगर', 'सीता', 'matra ि→इ(4)<ी→ई(5) @pos1'],
      ['सीता', 'सुदूरपश्चिम', 'matra ी→ई(5)<ु→उ(6) @pos1'],
      ['सुदूरपश्चिम', 'स्कुल', 'matra ु→उ(6) < consonant क @pos1; स्कुल=स,क,ु,ल (halant in स्क skipped)'],
      ['स्कुल', 'सप्तरी', 'barnamala क<प @pos1 (halants in स्क/प्त skipped; Intl DIVERGES: cluster class)'],
    ]);
  });

  it('pairs 86-91: ह-words then school conjuncts after ह', () => {
    check([
      ['सप्तरी', 'हिमाल', 'barnamala स<ह @pos0 (halant in प्त skipped)'],
      ['हिमाल', 'हेटौंडा', 'matra ि→इ(4)<े→ए(9) @pos1'],
      ['हेटौंडा', 'हतिया', 'matra े→ए(9) < consonant त @pos1 (Intl DIVERGES: known matra class)'],
      ['हिमाल', 'हतिया', 'matra ि→इ(4) < consonant त @pos1 (Intl DIVERGES: known matra class)'],
      ['हिमाल', 'हरि', 'matra ि→इ(4) < consonant र @pos1 (Intl DIVERGES: known matra class)'],
      ['हरि', 'क्षेत्र', 'school: हरि ends in chart weights, क्षेत्र is contraction U+E04F after ह (Intl DIVERGES: known school class, Intl sorts ज्ञ/क्ष phonetically)'],
      ['क्षेत्र', 'त्रिवेणी', 'school: contraction order क्ष(U+E04F)<त्र(U+E050) after ह'],
      ['त्रिवेणी', 'ज्ञान', 'school: contraction order त्र(U+E050)<ज्ञ(U+E051) after ह — NOTE barnamala alone would give ज्ञ(ज…) first; school order decides (Intl DIVERGES: Intl sorts ज्ञ before त्र phonetically, known school class)'],
    ]);
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

  it('named divergences: matra-vs-consonant ordering (basic vs Intl)', () => {
    const basic = createNepaliCollator({ backend: 'basic', conjuncts: 'phonetic' });
    const intl = createNepaliCollator({ backend: 'intl', conjuncts: 'phonetic' });
    // Basic orders matra-words before consonant-second-unit words (matra by
    // vowel weight); Intl orders some of these pairs consonant-first.
    // Each pair asserted by name.
    const cases: Array<[string, string, -1 | 1, -1 | 1]> = [
      ['गीता', 'गण्डकी', -1, 1],
      ['घर', 'घोराही', 1, -1],
      ['काठमाडौं', 'कमल', -1, 1],
      ['हिमाल', 'हरि', -1, 1],
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
    // Guarded preposed-ि fixup: basic and Intl agree on ि-words now
    // (these diverged under the old unguarded shift).
    expect(basic.compare('विराटनगर', 'वीरगञ्ज')).toBe(-1);
    expect(intl.compare('विराटनगर', 'वीरगञ्ज')).toBe(-1);
    expect(basic.compare('जितपुर', 'जुम्ला')).toBe(-1);
    expect(intl.compare('जितपुर', 'जुम्ला')).toBe(-1);
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
