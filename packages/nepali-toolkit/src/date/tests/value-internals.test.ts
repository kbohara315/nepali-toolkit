import { describe, it, expect } from 'vitest';
import { toAD, toBS } from '../internal/conversion.js';
import { adToDayCount, dayCountToAD } from '../internal/gregorian.js';
import { ordinalToBS, bsToOrdinal, TOTAL_DAYS, monthLength } from '../internal/patro.js';
import gen from '../data/generated/patro.json' with { type: 'json' };

describe('gregorian oracle', () => {
  it('1970-01-01 = 0', () => expect(adToDayCount(1970, 1, 1)).toBe(0));
  it('2000-01-01 known JDN', () =>
    expect(dayCountToAD(adToDayCount(2000, 1, 1))).toEqual({ year: 2000, month: 1, day: 1 }));
  it('leap 2000-02-29 roundtrip', () => {
    const dc = adToDayCount(2000, 2, 29);
    expect(dayCountToAD(dc)).toEqual({ year: 2000, month: 2, day: 29 });
    expect(adToDayCount(2001, 2, 28) + 1).toBe(adToDayCount(2001, 3, 1));
  });
  it('1900 not leap', () => expect(() => toBS({ year: 1900, month: 2, day: 29 })).toThrow());
  it('negative dayCount 1969-12-31 = -1', () => expect(adToDayCount(1969, 12, 31)).toBe(-1));
});

describe('patro invariants', () => {
  it('91 years 2000-2090', () => expect((gen as any).table.length).toBe(91));
  it('each year 12 months sum matches total', () => {
    for (const r of (gen as any).table) {
      const sum = r.months.reduce((a: number, b: number) => a + b, 0);
      expect(sum).toBeGreaterThanOrEqual(29 * 12);
    }
  });
  it('monthLength bounds', () => {
    expect(monthLength(2000, 1)).toBeGreaterThanOrEqual(29);
  });
});

describe('exhaustive bijection', () => {
  it('every BS ordinal roundtrips', () => {
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const bs = ordinalToBS(i);
      expect(bsToOrdinal(bs.year, bs.month, bs.day)).toBe(i);
    }
  });
  it('adjacent BS days differ by 1 dayCount', () => {
    for (let i = 0; i < TOTAL_DAYS - 1; i++) {
      const a = toAD(ordinalToBS(i));
      const b = toAD(ordinalToBS(i + 1));
      expect(adToDayCount(b.year, b.month, b.day) - adToDayCount(a.year, a.month, a.day)).toBe(1);
    }
  });
  it('every BS->AD->BS roundtrip', () => {
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const bs = ordinalToBS(i);
      expect(toBS(toAD(bs))).toEqual(bs);
    }
  });
});

describe('boundaries', () => {
  it('first/last succeed', () => {
    expect(toAD({ year: 2000, month: 1, day: 1 })).toEqual({ year: 1943, month: 4, day: 14 });
    const last = { year: 2090, month: 12, day: monthLength(2090, 12) };
    expect(() => toAD(last)).not.toThrow();
  });
  it('one outside fails', () => {
    expect(() => toBS({ year: 1943, month: 4, day: 13 })).toThrow(RangeError);
    expect(() => toAD({ year: 1999, month: 12, day: 30 })).toThrow(RangeError);
  });
});

describe('errors', () => {
  it('invalid BS day rejects', () =>
    expect(() => toAD({ year: 2000, month: 1, day: 32 })).toThrow(RangeError));
});
