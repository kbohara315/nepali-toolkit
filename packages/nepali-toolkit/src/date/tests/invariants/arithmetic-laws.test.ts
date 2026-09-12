import { describe, expect, it } from 'vitest';
import {
  addDays,
  addDaysAD,
  addDaysBS,
  addMonthsBS,
  addWeeks,
  addWeeksAD,
  addWeeksBS,
  addYearsBS,
  compare,
  compareAD,
  compareBS,
  differenceInDaysAD,
  differenceInDaysBS,
  equalAD,
  equalBS,
  iterateAD,
  iterateBS,
} from '../../arithmetic.js';
import { ad, bs } from '../../types.js';
import { monthLength } from '../../internal/patro.js';

const BS_SAMPLES = [
  bs(2000, 1, 1),
  bs(2005, 1, 15),
  bs(2010, 12, 15),
  bs(2082, 5, 10),
  bs(2085, 6, 20),
];
const AD_SAMPLES = [ad(1943, 4, 14), ad(2000, 2, 29), ad(2024, 12, 31), ad(2025, 1, 1)];
const AMOUNTS = [0, 1, -1, 7, -7, 30, 100];
// Endpoint-adjacent samples exercised only with in-range amounts.
const BS_START = bs(2000, 1, 1);
const BS_END = bs(2090, 12, 30);

describe('arithmetic laws', () => {
  it('addDays identity: addDays(x, 0) === x', () => {
    for (const d of BS_SAMPLES) expect(addDaysBS(d, 0)).toEqual(d);
    for (const d of AD_SAMPLES) {
      expect(addDaysAD(d, 0)).toEqual(d);
      expect(addDays(d, 0)).toEqual(d);
    }
  });

  it('addDays inverse: addDays(addDays(x,n),-n) === x', () => {
    for (const d of BS_SAMPLES.slice(1))
      for (const n of AMOUNTS) expect(addDaysBS(addDaysBS(d, n), -n)).toEqual(d);
    expect(addDaysBS(addDaysBS(BS_START, 5), -5)).toEqual(BS_START); // start endpoint, forward only
    expect(addDaysBS(addDaysBS(BS_END, -5), 5)).toEqual(BS_END); // end endpoint, backward only
    for (const d of AD_SAMPLES.slice(1))
      for (const n of AMOUNTS) expect(addDaysAD(addDaysAD(d, n), -n)).toEqual(d);
    expect(addDaysAD(addDaysAD(ad(1943, 4, 14), 5), -5)).toEqual(ad(1943, 4, 14));
  });

  it('addDays composition: addDays(addDays(x,a),b) === addDays(x,a+b)', () => {
    for (const d of BS_SAMPLES) expect(addDaysBS(addDaysBS(d, 5), 7)).toEqual(addDaysBS(d, 12));
    for (const d of AD_SAMPLES) expect(addDaysAD(addDaysAD(d, 5), 7)).toEqual(addDaysAD(d, 12));
  });

  it('addWeeks equivalence: addWeeks(x,n) === addDays(x,7n)', () => {
    for (const d of BS_SAMPLES.slice(1))
      for (const n of [0, 1, -1, 4]) expect(addWeeksBS(d, n)).toEqual(addDaysBS(d, 7 * n));
    expect(addWeeksBS(BS_START, 1)).toEqual(addDaysBS(BS_START, 7));
    expect(addWeeksBS(BS_END, -1)).toEqual(addDaysBS(BS_END, -7));
    for (const d of AD_SAMPLES.slice(1)) {
      for (const n of [0, 1, 4]) {
        expect(addWeeksAD(d, n)).toEqual(addDaysAD(d, 7 * n));
        expect(addWeeks(d, n)).toEqual(addDays(d, 7 * n));
      }
    }
  });

  it('compare symmetry and consistency', () => {
    const pairs = BS_SAMPLES.map((d, i) => [d, BS_SAMPLES[(i + 1) % BS_SAMPLES.length]] as const);
    for (const [a, b] of pairs) {
      expect(compareBS(a, b)).toBe(-compareBS(b, a) as -1 | 0 | 1);
      expect(compareBS(a, a)).toBe(0);
      expect(equalBS(a, b)).toBe(compareBS(a, b) === 0);
      expect(differenceInDaysBS(a, b)).toBe(-differenceInDaysBS(b, a));
    }
    for (let i = 0; i < AD_SAMPLES.length - 1; i++) {
      const [a, b] = [AD_SAMPLES[i], AD_SAMPLES[i + 1]];
      expect(compareAD(a, b)).toBe(-compareAD(b, a) as -1 | 0 | 1);
      expect(compare(a, b)).toBe(compareAD(a, b));
      expect(equalAD(a, b)).toBe(compareAD(a, b) === 0);
      expect(differenceInDaysAD(a, b)).toBe(-differenceInDaysAD(b, a));
    }
    // differenceInDays consistent with addDays
    const s = bs(2082, 5, 10);
    const t = addDaysBS(s, 17);
    expect(differenceInDaysBS(t, s)).toBe(17);
    const sa = ad(2024, 1, 1);
    const ta = addDaysAD(sa, 17);
    expect(differenceInDaysAD(ta, sa)).toBe(17);
  });

  it('iterate correctness: inclusive, ordered, length = diff + 1', () => {
    const s = bs(2082, 5, 10);
    const e = addDaysBS(s, 5);
    const items = [...iterateBS(s, e)];
    expect(items).toHaveLength(6);
    expect(items[0]).toEqual(s);
    expect(items[5]).toEqual(e);
    for (let i = 1; i < items.length; i++) expect(compareBS(items[i - 1], items[i])).toBe(-1);

    const sa = ad(2024, 1, 1);
    const ea = addDaysAD(sa, 3);
    const aItems = [...iterateAD(sa, ea)];
    expect(aItems).toHaveLength(4);
    expect(aItems[0]).toEqual(sa);
    expect(aItems[3]).toEqual(ea);

    // empty when start > end
    expect([...iterateBS(e, s)]).toHaveLength(0);
    expect([...iterateAD(ea, sa)]).toHaveLength(0);
    // single element when equal
    expect([...iterateBS(s, s)]).toEqual([s]);
  });

  it('month/year overflow: constrain clamps, reject throws, zero-amount identity', () => {
    // Find a BS date whose day overflows the next month
    let overflow: { y: number; m: number } | null = null;
    outer: for (let y = 2080; y < 2090; y++)
      for (let m = 1; m <= 12; m++) {
        const nm = m === 12 ? 1 : m + 1;
        const ny = m === 12 ? y + 1 : y;
        if (monthLength(y, m) > monthLength(ny, nm)) {
          overflow = { y, m };
          break outer;
        }
      }
    expect(overflow).not.toBeNull();
    const { y, m } = overflow!;
    const nm = m === 12 ? 1 : m + 1;
    const ny = m === 12 ? y + 1 : y;
    const start = bs(y, m, monthLength(y, m));

    const constrained = addMonthsBS(start, 1);
    expect(constrained).toEqual(bs(ny, nm, monthLength(ny, nm)));
    expect(() => addMonthsBS(start, 1, { overflow: 'reject' })).toThrow();
    expect(() => addMonthsBS(start, 1, { overflow: 'bogus' as never })).toThrow();

    // year overflow constrain
    const yStart = bs(2082, 5, 15);
    const target = bs(yStart.year + 1, yStart.month, 1);
    const lastDay = monthLength(target.year, target.month);
    if (yStart.day > lastDay) {
      expect(addYearsBS(yStart, 1)).toEqual(bs(target.year, target.month, lastDay));
      expect(() => addYearsBS(yStart, 1, { overflow: 'reject' })).toThrow();
    } else {
      expect(addYearsBS(yStart, 1)).toEqual(bs(target.year, target.month, yStart.day));
    }

    // zero amount identity & non-overflow passthrough
    expect(addMonthsBS(yStart, 0)).toEqual(yStart);
    expect(addYearsBS(yStart, 0)).toEqual(yStart);
    expect(addMonthsBS(bs(2082, 1, 10), 1)).toEqual(bs(2082, 2, 10));

    // invalid amounts
    expect(() => addMonthsBS(yStart, 1.5)).toThrow();
    expect(() => addYearsBS(yStart, Number.MAX_SAFE_INTEGER + 1)).toThrow();
    expect(() => addDaysBS(yStart, 1.5)).toThrow();
  });

  it('endpoint exports agree with calendar-explicit variants', () => {
    const d = ad(2024, 6, 15);
    expect(compare(d, d)).toBe(compareAD(d, d));
    expect(addDays(d, 3)).toEqual(addDaysAD(d, 3));
    expect(addWeeks(d, 2)).toEqual(addWeeksAD(d, 2));
  });
});
