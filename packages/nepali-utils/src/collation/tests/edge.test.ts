import { describe, expect, it } from 'vitest';
import { createNepaliCollator } from '../index.js';
import { BARNAMALA } from '../table.js';

const CANONICAL = [...BARNAMALA];

function pseudoRandomList(n: number): string[] {
  // Deterministic LCG over the barnamala — no Math.random, reproducible.
  let seed = 0x12345678;
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    out.push(CANONICAL[seed % CANONICAL.length]!);
  }
  return out;
}

describe('collation edge cases', () => {
  it('reverse-sorted input returns canonical order', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.sort([...CANONICAL].reverse())).toEqual(CANONICAL);
  });

  it('duplicates keep stability shape (all copies adjacent, count preserved)', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    const input = ['ख', 'क', 'ख', 'क', 'ग'];
    const sorted = c.sort(input);
    expect(sorted).toEqual(['क', 'क', 'ख', 'ख', 'ग']);
  });

  it('200-item deterministic list: sorted twice is stable, matches independent reference', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    const input = pseudoRandomList(200);
    const once = c.sort(input);
    const twice = c.sort(once);
    expect(twice).toEqual(once);
    // Independent reference: insertion sort using only compare().
    const ref = [...input];
    for (let i = 1; i < ref.length; i += 1) {
      const key = ref[i]!;
      let j = i - 1;
      while (j >= 0 && c.compare(ref[j]!, key) > 0) {
        ref[j + 1] = ref[j]!;
        j -= 1;
      }
      ref[j + 1] = key;
    }
    expect(once).toEqual(ref);
  });

  it('equals() asymmetry spot: a!=b in both directions', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.equals('क', 'ख')).toBe(false);
    expect(c.equals('ख', 'क')).toBe(false);
  });

  it('compare() transitivity triple', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('अ', 'क')).toBe(-1);
    expect(c.compare('क', 'ख')).toBe(-1);
    expect(c.compare('अ', 'ख')).toBe(-1);
  });

  it('empty string sorts first', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.sort(['क', '', 'अ'])).toEqual(['', 'अ', 'क']);
    expect(c.compare('', 'क')).toBe(-1);
  });

  it('space handling: leading-space string sorts after the bare form (documented behavior)', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare(' क', 'क')).toBe(1);
    expect(c.sort(['क', ' क'])).toEqual(['क', ' क']);
  });

  it("numeric multi-run: 'a10b2' < 'a10b10'", () => {
    const num = createNepaliCollator({ backend: 'basic', numeric: true });
    expect(num.compare('a10b2', 'a10b10')).toBe(-1);
    expect(num.sort(['a10b10', 'a10b2'])).toEqual(['a10b2', 'a10b10']);
  });

  it("numeric leading zeros: 'file007' vs 'file7'", () => {
    const num = createNepaliCollator({ backend: 'basic', numeric: true });
    // Same numeric value: tie at numeric level; full-string order keeps both adjacent.
    const sorted = num.sort(['file7', 'file007']);
    expect(sorted).toHaveLength(2);
    expect([...sorted].sort()).toEqual(['file007', 'file7']);
    const lex = createNepaliCollator({ backend: 'basic', numeric: false });
    expect(lex.compare('file007', 'file7')).not.toBe(0);
  });
});
