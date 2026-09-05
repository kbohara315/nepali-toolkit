import { describe, expect, it } from 'vitest';
import { createNepaliCollator } from '../index.js';
import { InvalidCollationError } from '../errors.js';

describe('collation case folding', () => {
  it('base ties across ASCII case, full distinguishes (nukta-level scheme)', () => {
    const base = createNepaliCollator({ backend: 'basic', sensitivity: 'base' });
    const full = createNepaliCollator({ backend: 'basic', sensitivity: 'full' });
    expect(base.compare('Apple', 'apple')).toBe(0);
    expect(base.equals('Apple', 'apple')).toBe(true);
    expect(full.compare('Apple', 'apple')).not.toBe(0);
    expect(full.equals('Apple', 'apple')).toBe(false);
  });

  it('base sort groups case variants adjacently (stable input order kept)', () => {
    const base = createNepaliCollator({ backend: 'basic', sensitivity: 'base' });
    expect(base.sort(['banana', 'Apple', 'apple'])).toEqual(['Apple', 'apple', 'banana']);
  });

  it('full sort orders uppercase before lowercase (tertiary code-point order)', () => {
    const full = createNepaliCollator({ backend: 'basic', sensitivity: 'full' });
    expect(full.sort(['apple', 'Apple'])).toEqual(['Apple', 'apple']);
  });

  it('embedded Latin in mixed-script strings folds too', () => {
    const base = createNepaliCollator({ backend: 'basic', sensitivity: 'base' });
    const full = createNepaliCollator({ backend: 'basic', sensitivity: 'full' });
    expect(base.compare('Hari', 'hari')).toBe(0);
    expect(full.compare('Hari', 'hari')).not.toBe(0);
    // Devanagari-first ordering unchanged by folding (h still above every letter).
    expect(base.sort(['Hari घर', 'राम घर'])).toEqual(['राम घर', 'Hari घर']);
  });

  it('numeric runs still compare numerically across case', () => {
    const num = createNepaliCollator({ backend: 'basic', numeric: true });
    expect(num.compare('File10', 'file2')).toBe(1);
    expect(num.sort(['File10', 'file2'])).toEqual(['file2', 'File10']);
  });
});

describe('collation ignorePunctuation', () => {
  it('opt-in: hyphen/space/danda tie with the bare form', () => {
    const c = createNepaliCollator({ backend: 'basic', ignorePunctuation: true });
    expect(c.equals('क-क', 'कक')).toBe(true);
    expect(c.equals('क क', 'कक')).toBe(true);
    expect(c.equals('घर।', 'घर')).toBe(true);
    expect(c.equals('घर॥', 'घर')).toBe(true);
    expect(c.sort(['क-क', 'ख', 'कक'])).toEqual(['क-क', 'कक', 'ख']);
  });

  it('default (opt-out) preserves v1 weighted behavior', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('कक', 'क-क')).toBe(-1);
    expect(c.compare('घर', 'घर।')).toBe(-1);
  });

  it('intl backend accepts the option (or throws only for missing Intl)', () => {
    try {
      const c = createNepaliCollator({
        backend: 'intl',
        conjuncts: 'phonetic',
        ignorePunctuation: true,
      });
      expect(c.backend).toBe('intl');
      expect(c.compare('a-b', 'ab')).toBe(0);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidCollationError);
    }
  });
});
