import { describe, expect, it } from 'vitest';
import { createNepaliCollator } from '../index.js';
import { InvalidCollationError } from '../errors.js';

describe('collation volume: mark torment', () => {
  // Systematic matra matrix. Per contract, matras map to their vowel's
  // weight (barnamala order आ<इ<ई<उ<ऊ<ए<ऐ<ओ<ौ) and light marks
  // (ं/ः) are lighter-primary than the bare base. Verified actual: every
  // base orders [ं, ः, bare, ा, ि, ी, ु, ू, े, ै, ो, ौ].
  const BASES = ['क', 'त', 'प', 'म', 'स', 'ह'];
  const SUFFIXES = ['', 'ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः'];

  it.each(BASES)('matra matrix for base %s', (base) => {
    const c = createNepaliCollator({ backend: 'basic' });
    const forms = SUFFIXES.map((s) => base + s);
    const sorted = c.sort([...forms].reverse());
    // ं/ः tie at base (shared light-primary weight); stable sort keeps
    // their input-relative order, so pin them as a set + tie, and the
    // remaining 10 forms as an exact sequence.
    expect(c.compare(`${base}ं`, `${base}ः`)).toBe(0);
    expect([...sorted.slice(0, 2)].sort()).toEqual([`${base}ः`, `${base}ं`].sort());
    expect(sorted.slice(2)).toEqual([
      base, `${base}ा`, `${base}ि`, `${base}ी`, `${base}ु`, `${base}ू`,
      `${base}े`, `${base}ै`, `${base}ो`, `${base}ौ`,
    ]);
  });

  it('anusvara vs visarga vs bare: कं < कः < क (base); कं < कँ < कः < क (full)', () => {
    const base = createNepaliCollator({ backend: 'basic', sensitivity: 'base' });
    // Contract: anusvara/chandrabindu/visarga share one lighter-primary
    // weight (कं ≡ कः at base) below the terminator (both < क). Stable
    // sort keeps the tied pair in input order, both before क.
    expect(base.sort(['क', 'कः', 'कं'])).toEqual(['कः', 'कं', 'क']);
    expect(base.compare('कं', 'कः')).toBe(0);
    expect(base.compare('कं', 'क')).toBe(-1);
    expect(base.compare('कः', 'क')).toBe(-1);
    const full = createNepaliCollator({ backend: 'basic', sensitivity: 'full' });
    // Full sensitivity adds secondary marks (ं=a < ँ=b < ः=c).
    expect(full.sort(['क', 'कः', 'कँ', 'कं'])).toEqual(['कं', 'कँ', 'कः', 'क']);
  });

  it('halant-final vs bare: tie at base AND full (क ≡ क्)', () => {
    const base = createNepaliCollator({ backend: 'basic', sensitivity: 'base' });
    const full = createNepaliCollator({ backend: 'basic', sensitivity: 'full' });
    expect(base.compare('क', 'क्')).toBe(0);
    expect(full.compare('क', 'क्')).toBe(0);
    expect(base.equals('क', 'क्')).toBe(true);
    // Tie pair stays adjacent at the head, before का.
    const sorted = base.sort(['का', 'क्', 'क']);
    expect(sorted[2]).toBe('का');
    expect([...sorted.slice(0, 2)].sort()).toEqual(['क', 'क्']);
  });

  it('preposed-ि denormalized forms equal कि-forms for 5+ bases', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    for (const base of ['क', 'त', 'प', 'म', 'स']) {
      expect(c.equals(`ि${base}`, `${base}ि`), base).toBe(true);
      expect(c.compare(`ि${base}`, `${base}ि`), base).toBe(0);
    }
  });
});

describe('collation volume: digit/symbol soup', () => {
  it('Devanagari digits order by code point; ASCII digits sort before Devanagari', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    // Documented actual: no cross-script unification — ASCII block
    // (U+003x) precedes Devanagari digits (U+0966+) by code-point weight.
    expect(c.sort(['९', '०', '५', '१'])).toEqual(['०', '१', '५', '९']);
    expect(c.sort(['९', '9', '०', '0'])).toEqual(['0', '9', '०', '९']);
    expect(c.compare('०', '0')).toBe(1);
    expect(c.compare('९', '9')).toBe(1);
  });

  it('ward numbers: numeric vs lexicographic', () => {
    const num = createNepaliCollator({ backend: 'basic', numeric: true });
    expect(num.sort(['वडा १०', 'वडा ०९', 'वडा २', 'वडा १'])).toEqual([
      'वडा १',
      'वडा २',
      'वडा ०९',
      'वडा १०',
    ]);
    const lex = createNepaliCollator({ backend: 'basic', numeric: false });
    // Lexicographic: by Devanagari digit code points (१<२<९...).
    expect(lex.sort(['वडा १०', 'वडा २', 'वडा ९'])).toEqual([
      'वडा १०',
      'वडा २',
      'वडा ९',
    ]);
  });

  it('hyphen/space/danda sort after bare by code-point weight (documenting)', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    // Documented actual (not contract correctness): inside mixed strings,
    // space (U+0020) < hyphen (U+002D) < danda (U+0964) by code-point
    // weight; the bare prefix sorts first via the terminator rule.
    expect(c.sort(['क।', 'क-क', 'क क', 'क'])).toEqual(['क', 'क क', 'क-क', 'क।']);
    expect(c.compare('क क', 'कक')).toBe(1);
    expect(c.compare('क-क', 'कक')).toBe(1);
    expect(c.compare('क।', 'क')).toBe(1);
  });
});

describe('collation volume: robustness', () => {
  it('50-char strings compare correctly', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('क'.repeat(50), `${'क'.repeat(49)}ख`)).toBe(-1);
    expect(c.equals('क'.repeat(50), 'क'.repeat(50))).toBe(true);
  });

  it('lone matra and lone halant sort before क (documenting)', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    // 'ा' carries only the light vowel weight आ < क; '्' is stripped to an
    // empty key, so both precede any letter.
    expect(c.compare('ा', 'क')).toBe(-1);
    expect(c.compare('्', 'क')).toBe(-1);
  });

  it('empty vs space vs ZWSP-only strings', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.sort(['क', '', 'अ'])).toEqual(['', 'अ', 'क']);
    // Pure-ASCII space sorts with the ASCII block, before Devanagari.
    expect(c.sort(['क', ' ', 'अ'])).toEqual([' ', 'अ', 'क']);
    // ZWSP-only strips to an empty key, which still sorts before every
    // letter — but it does NOT equal '': '' takes the ASCII fast path
    // (key '\x01...') while ZWSP-only takes the PUA path (key TERMINATOR).
    expect(c.equals('​', '')).toBe(false);
    expect(c.compare('', '​')).toBe(-1);
    expect(c.sort(['क', '​', 'अ'])).toEqual(['​', 'अ', 'क']);
  });

  it('non-string inputs throw INVALID_COLLATION on every method', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    for (const bad of [null, undefined, 123, {}]) {
      for (const fn of [
        // @ts-expect-error exercising invalid input
        () => c.compare(bad, 'क'),
        // @ts-expect-error exercising invalid input
        () => c.equals('क', bad),
        // @ts-expect-error exercising invalid input
        () => c.sort(['क', bad]),
      ]) {
        try {
          fn();
          expect.unreachable(`expected throw for ${String(bad)}`);
        } catch (error) {
          expect(error).toBeInstanceOf(TypeError);
          expect(error).toBeInstanceOf(InvalidCollationError);
          expect((error as InvalidCollationError).code).toBe('INVALID_COLLATION');
        }
      }
    }
  });

  it('astral char (emoji) sorts deterministically after Devanagari (documenting)', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    // Documented actual: non-BMP code points fall through to pass-through
    // weights above every barnamala weight — emoji always sorts last.
    expect(c.compare('ह', '😀')).toBe(-1);
    expect(c.sort(['ह', '😀', 'अ'])).toEqual(['अ', 'ह', '😀']);
    expect(c.sort(['😀', '😀', 'अ'])).toEqual(['अ', '😀', '😀']);
  });
});
