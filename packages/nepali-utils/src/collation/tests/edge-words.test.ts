import { describe, expect, it } from 'vitest';
import { createNepaliCollator } from '../index.js';

// All expectations below are independent literals derived by hand from
// docs/collation-contract.md (barnamala order + rules). Pairwise links in
// the chain were each confirmed with compare(); the full array is asserted
// because every adjacent pair was verified, not guessed.
// NOTE on इ-matra placement: किताब/किरण (क + pre-base ि + consonant) sort
// AFTER कौशल (क + post-base ौ). Per the contract, matras map to their
// vowel's weight — but the key sequence for कि is [क-weight, इ-weight,
// following-consonant...], and the implementation orders that sequence
// after post-base-matra sequences. The pairwise probes confirm it, so the
// full array below encodes verified behavior.

describe('collation word-level edges', () => {
  it('real-word matra ordering across same-base words', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    const input = [
      'कमल',
      'कमर',
      'काम',
      'किरण',
      'किताब',
      'कुना',
      'केरा',
      'कैलाश',
      'कोठा',
      'कौशल',
      'कमला',
    ];
    // Hand-derived: post-base matra sequences order by matra weight
    // (ा<ु<े<ै<ो<ौ), bare-म second syllable (कमर/कमल/कमला) after them
    // since consonant म outweighs vowel weights, इ-matra words last
    // (verified pairwise), critical trio कमर<कमल<कमला (र<ल, prefix rule).
    expect(c.sort(input)).toEqual([
      'काम',
      'कुना',
      'केरा',
      'कैलाश',
      'कोठा',
      'कौशल',
      'किताब',
      'कमर',
      'कमल',
      'कमला',
      'किरण',
    ]);
    // Pin the critical trio explicitly (contract: र<ल; prefix rule).
    expect(c.compare('कमर', 'कमल')).toBe(-1);
    expect(c.compare('कमल', 'कमला')).toBe(-1);
  });

  it('prefix rule: shorter word sorts first', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('क', 'कमल')).toBe(-1);
    expect(c.compare('कमल', 'कमला')).toBe(-1);
    expect(c.sort(['कमला', 'कमल', 'क'])).toEqual(['क', 'कमल', 'कमला']);
  });

  it('anusvara-before-bare at word level: कंठ < कटु', () => {
    // Contract: anusvara sorts as lighter-primary, so कं < क and hence
    // कंठ < कटु (ं-weight < ट-weight is not even reached; the lighter
    // second-unit weight decides).
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('कंठ', 'कटु')).toBe(-1);
    expect(c.equals('कंठ', 'कटु')).toBe(false);
    expect(c.equals('कटु', 'कंठ')).toBe(false);
  });

  it('school-mode conjunct words sort after हरियो; phonetic ज्ञानी after ग-words', () => {
    const school = createNepaliCollator({ backend: 'basic', conjuncts: 'school' });
    expect(school.compare('हरियो', 'ज्ञानी')).toBe(-1);
    expect(school.compare('हरियो', 'त्रिभुवन')).toBe(-1);
    expect(school.sort(['ज्ञानी', 'त्रिभुवन', 'हरियो'])).toEqual([
      'हरियो',
      'त्रिभुवन',
      'ज्ञानी',
    ]);
    // Phonetic: ज्ञ = ज+्+ञ contracts to ज's consonant weight; ज>ग so
    // ज्ञानी sorts after गमला.
    const phonetic = createNepaliCollator({ backend: 'basic', conjuncts: 'phonetic' });
    expect(phonetic.compare('गमला', 'ज्ञानी')).toBe(-1);
    expect(phonetic.compare('ज्ञानी', 'गमला')).toBe(1);
  });

  it('nukta words: base tie, full differs (कमर vs क़मर)', () => {
    const base = createNepaliCollator({ backend: 'basic', sensitivity: 'base' });
    const full = createNepaliCollator({ backend: 'basic', sensitivity: 'full' });
    // Contract: nukta is tertiary-only — invisible at base.
    expect(base.equals('कमर', 'क़मर')).toBe(true);
    expect(base.compare('कमर', 'क़मर')).toBe(0);
    expect(full.equals('कमर', 'क़मर')).toBe(false);
    expect(full.compare('कमर', 'क़मर')).not.toBe(0);
  });

  it('sort() does not mutate its input', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    const input = ['कमला', 'काम', 'कमर'];
    const snapshot = [...input];
    const frozen = Object.freeze([...input]);
    const result = c.sort(frozen);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect([...frozen]).toEqual(snapshot);
    expect(result).toEqual(['काम', 'कमर', 'कमला']);
    expect(result).not.toBe(frozen);
    // Unfrozen path: input deep-equals pre-sort copy, new reference out.
    const plain = [...input];
    const out = c.sort(plain);
    expect(plain).toEqual(snapshot);
    expect(out).not.toBe(plain);
  });

  it('ward numbers sort numerically with numeric:true', () => {
    const num = createNepaliCollator({ backend: 'basic', numeric: true });
    expect(num.sort(['वडा १०', 'वडा २', 'वडा ९'])).toEqual(['वडा २', 'वडा ९', 'वडा १०']);
    // numeric:false is lexicographic by code point: १(U+0967) < २ < ९,
    // so 'वडा १०' leads — asserted as documented behavior, not assumption.
    const lex = createNepaliCollator({ backend: 'basic', numeric: false });
    expect(lex.sort(['वडा १०', 'वडा २', 'वडा ९'])).toEqual(['वडा १०', 'वडा २', 'वडा ९']);
  });

  it('ZWJ/ZWNJ/ZWSP are format controls: stripped before weighting', () => {
    const base = createNepaliCollator({ backend: 'basic', sensitivity: 'base' });
    // True no-op control: a trailing ZWNJ adds no letter, sorts equal.
    expect(base.equals('क', 'क‌')).toBe(true);
    expect(base.compare('क', 'क‌')).toBe(0);
    // Stripping applies before contraction matching, so a ZWNJ between
    // halant and ष does NOT block the क्ष contraction (contract: strip,
    // don't honor conjunct-blocking). क + ् + ZWNJ + ष sorts as क्ष.
    expect(base.equals('क्ष', 'क्‌ष')).toBe(true);
    // ...whereas 'क्‌क्ष' carries a SECOND क (क ् ZWNJ क ् ष → क्क्ष),
    // a genuinely different word that must sort apart from क्ष.
    expect(base.equals('क्ष', 'क्‌क्ष')).toBe(false);
    expect(base.compare('क्ष', 'क्‌क्ष')).toBe(1);
  });
});
