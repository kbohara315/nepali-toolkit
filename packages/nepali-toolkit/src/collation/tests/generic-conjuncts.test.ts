import { describe, expect, it } from 'vitest';
import { createNepaliCollator } from '../index.js';

// Non-contracted C+halant+C clusters (स्त्र, श्र, द्य, क्र, द्ध …) carry no
// dedicated contraction weight: the halant is skipped and the consonants
// weigh in sequence. Expectations below pin that mechanism — derived from
// barnamala order (…त थ द ध न… …ब भ म य र…) plus the halant-skip rule —
// not from Intl. They guard against silent regressions, not to claim
// linguistic completeness.

describe('collation generic conjuncts', () => {
  it('multi-consonant words order by consonant sequence', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    // श्री [श,र,ई] < सिर [स,इ,र] (श < स at pos 0).
    expect(c.sort(['सिर', 'श्री'])).toEqual(['श्री', 'सिर']);
    // सता [स,त,आ] < स्त्री [स,त,र,ई] (त-weight < र-weight at pos 2).
    expect(c.compare('सता', 'स्त्री')).toBe(-1);
    // विद्या [व,इ,द,य,आ] < विनय [व,इ,न,य] (द < न at pos 2).
    expect(c.sort(['विनय', 'विद्या'])).toEqual(['विद्या', 'विनय']);
    // कमल [क,म,…] < क्रम [क,र,म] (म < र at pos 1).
    expect(c.compare('कमल', 'क्रम')).toBe(-1);
    // बुढा [ब,उ,ढ,आ] < बुद्ध [ब,उ,द,ध] (ढ < द at pos 2).
    expect(c.compare('बुढा', 'बुद्ध')).toBe(-1);
  });

  it('school mode keeps generic conjunct words in phonetic position (before ह)', () => {
    const school = createNepaliCollator({ backend: 'basic', conjuncts: 'school' });
    // Only क्ष/त्र/ज्ञ move after ह; श्रीमान/स्त्री stay with स.
    expect(school.sort(['हरियो', 'श्रीमान', 'स्त्री'])).toEqual([
      'श्रीमान',
      'स्त्री',
      'हरियो',
    ]);
  });

  it('halant carries no primary weight: स्तर ties सतर at base', () => {
    // स्तर [स,त,र] vs सतर [स,त,र] — identical once the halant is skipped.
    // Documented mechanism, not a bug: halant is weight-ignored.
    const base = createNepaliCollator({ backend: 'basic', sensitivity: 'base' });
    expect(base.equals('स्तर', 'सतर')).toBe(true);
    expect(base.compare('स्तर', 'सतर')).toBe(0);
  });

  it('त्र contracts wherever it occurs: सत्र vs स्तर', () => {
    // सत्र contains त+्+र, so it takes the त्र contraction — it never ties
    // स्तर ([स,त,र] plain). School: स्तर first (contraction sorts after ह).
    // Phonetic: स्तर first too (sub-weight U+E080 sorts above every base
    // weight, so [स,त,sub] follows [स,त,र]) — KNOWN Intl DIVERGENCE:
    // Intl.Collator('ne-NP') orders सत्र < स्तर here (probed on this runtime).
    const school = createNepaliCollator({ backend: 'basic', conjuncts: 'school' });
    expect(school.compare('स्तर', 'सत्र')).toBe(-1);
    const phonetic = createNepaliCollator({ backend: 'basic', conjuncts: 'phonetic' });
    expect(phonetic.compare('स्तर', 'सत्र')).toBe(-1);
  });

  it('generic conjunct words are distinct from similar simplifications', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.equals('श्री', 'सिरी')).toBe(false);
    expect(c.equals('बुद्ध', 'बुध')).toBe(false);
    expect(c.equals('स्त्री', 'सित्री')).toBe(false);
    // …but halant-only differences tie at base: क्रम keys as [क,र,म],
    // exactly like करम. Same documented halant-skip mechanism as above.
    const base = createNepaliCollator({ backend: 'basic', sensitivity: 'base' });
    expect(base.equals('क्रम', 'करम')).toBe(true);
  });
});
