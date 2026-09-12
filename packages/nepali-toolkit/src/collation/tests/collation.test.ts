import { describe, expect, it } from 'vitest';
import { createNepaliCollator } from '../index.js';
import { InvalidCollationError } from '../errors.js';
import { BARNAMALA } from '../table.js';

const CANONICAL = [...BARNAMALA];

describe('collation', () => {
  it('barnamala shuffled sorts to itself (basic)', () => {
    const collator = createNepaliCollator({ backend: 'basic' });
    const shuffled = [...CANONICAL].reverse();
    expect(collator.sort(shuffled)).toEqual(CANONICAL);
  });

  it('क < का < कि < की', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.sort(['की', 'का', 'क', 'कि'])).toEqual(['क', 'का', 'कि', 'की']);
  });

  it('कं < क (lighter primary)', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('कं', 'क')).toBe(-1);
  });

  it('क vs क् primary tie', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('क', 'क्')).toBe(0);
  });

  it('nukta is tertiary-only (base tie, full differs)', () => {
    // NOTE: क+़ NFC-composes to क़ (U+0958), so both sensitivities tie
    // there; ह+़ has no precomposed form and exercises the tertiary level.
    const base = createNepaliCollator({ backend: 'basic', sensitivity: 'base' });
    const full = createNepaliCollator({ backend: 'basic', sensitivity: 'full' });
    expect(base.compare('क़', 'क़')).toBe(0);
    expect(base.compare('ह\u093c', 'ह')).toBe(0);
    expect(full.compare('ह\u093c', 'ह')).not.toBe(0);
  });

  it('हँ vs हं equal at base, differ at full', () => {
    const base = createNepaliCollator({ backend: 'basic', sensitivity: 'base' });
    const full = createNepaliCollator({ backend: 'basic', sensitivity: 'full' });
    expect(base.compare('हँ', 'हं')).toBe(0);
    expect(full.compare('हँ', 'हं')).not.toBe(0);
  });

  it('denormalized ि+क sorts with कि', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.equals('िक', 'कि')).toBe(true);
  });

  it('school: क्ष त्र ज्ञ sort after ह', () => {
    const c = createNepaliCollator({ backend: 'basic', conjuncts: 'school' });
    expect(c.sort(['ज्ञ', 'क', 'ख', 'ग', 'त्र', 'अ'])).toEqual([
      'अ',
      'क',
      'ख',
      'ग',
      'त्र',
      'ज्ञ',
    ]);
    expect(c.compare('ह', 'क्ष')).toBe(-1);
    expect(c.compare('ह', 'त्र')).toBe(-1);
    expect(c.compare('ह', 'ज्ञ')).toBe(-1);
    expect(c.sort(['ज्ञ', 'त्र', 'क्ष'])).toEqual(['क्ष', 'त्र', 'ज्ञ']);
  });

  it('phonetic: conjuncts sort with first consonant', () => {
    const c = createNepaliCollator({ backend: 'basic', conjuncts: 'phonetic' });
    expect(c.sort(['ज्ञ', 'क', 'ख', 'ग', 'त्र', 'अ'])).toEqual([
      'अ',
      'क',
      'ख',
      'ग',
      'ज्ञ',
      'त्र',
    ]);
    expect(c.compare('क', 'क्ष')).toBe(-1);
    expect(c.compare('क्ष', 'ख')).toBe(-1);
  });

  it('numeric digit runs', () => {
    const lex = createNepaliCollator({ backend: 'basic', numeric: false });
    const num = createNepaliCollator({ backend: 'basic', numeric: true });
    expect(lex.sort(['file10', 'file2'])).toEqual(['file10', 'file2']);
    expect(num.sort(['file10', 'file2'])).toEqual(['file2', 'file10']);
    expect(num.sort(['१०', '२'])).toEqual(['२', '१०']);
  });

  it('mixed Nepali/Latin: Latin first', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.sort(['क', 'apple', 'अ'])).toEqual(['apple', 'अ', 'क']);
  });

  it('forced basic works with Intl deleted', () => {
    const realIntl = globalThis.Intl;
    // @ts-expect-error stubbing
    globalThis.Intl = undefined;
    try {
      const c = createNepaliCollator({ backend: 'basic' });
      expect(c.backend).toBe('basic');
      expect(c.sort(['ख', 'क'])).toEqual(['क', 'ख']);
    } finally {
      globalThis.Intl = realIntl;
    }
  });

  it("forced intl throws when trust check fails", () => {
    const realIntl = globalThis.Intl;
    // @ts-expect-error stubbing
    globalThis.Intl = undefined;
    try {
      expect(() => createNepaliCollator({ backend: 'intl' })).toThrow(InvalidCollationError);
    } finally {
      globalThis.Intl = realIntl;
    }
  });

  it('intl vs basic agree on fixed corpus (excluding known divergences)', () => {
    // Agreement corpus: vowels, consonants, matra order, phonetic
    // conjuncts — verified identical under this runtime's Intl.
    const corpus = ['त्र', 'अ', 'का', 'ज्ञ', 'ख', 'कि', 'ग', 'क्ष', 'आ', 'क', 'की', 'ह', 'इ'];
    const basic = createNepaliCollator({ backend: 'basic', conjuncts: 'phonetic' });
    const intl = createNepaliCollator({ backend: 'intl', conjuncts: 'phonetic' });
    expect(basic.sort(corpus)).toEqual(intl.sort(corpus));
    // Explicit divergences (documented, not weaknesses):
    // 1. School conjuncts sort after ह; Intl is phonetic (before ह).
    const school = createNepaliCollator({ backend: 'basic', conjuncts: 'school' });
    expect(school.compare('ह', 'ज्ञ')).toBe(-1);
    expect(intl.compare('ह', 'ज्ञ')).toBe(1);
    // 2. Light marks: basic sorts कं before क; Intl sorts it after.
    const intlFull = createNepaliCollator({ backend: 'intl', conjuncts: 'phonetic', sensitivity: 'full' });
    expect(basic.compare('कं', 'क')).toBe(-1);
    expect(intlFull.compare('कं', 'क')).toBe(1);
    // 3. Latin mixing: basic sorts Latin first; Intl sorts it last.
    expect(basic.sort(['क', 'apple'])).toEqual(['apple', 'क']);
    expect(intl.sort(['क', 'apple'])).toEqual(['क', 'apple']);
  });

  it('non-string inputs throw InvalidCollationError', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    // @ts-expect-error testing
    expect(() => c.compare(1, 'क')).toThrow(InvalidCollationError);
    // @ts-expect-error testing
    expect(() => c.sort(['क', 2])).toThrow(InvalidCollationError);
    // @ts-expect-error testing
    expect(() => c.equals('क', null)).toThrow(InvalidCollationError);
    try {
      // @ts-expect-error testing
      c.compare(1, 'क');
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      expect((error as InvalidCollationError).code).toBe('INVALID_COLLATION');
    }
  });

  it('equals short-circuits identical strings', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.equals('क', 'क')).toBe(true);
  });
});
