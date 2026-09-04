import { describe, expect, it } from 'vitest';
import {
  addDaysBS,
  addMonthsBS,
  addYearsBS,
  addWeeksBS,
  compareBS,
  differenceInDaysBS,
  equalBS,
  weekdayAD,
} from '../../src/date/arithmetic.js';
import { ad, bs } from '../../src/date/types.js';
import { NepaliDate } from '../../src/date/value.js';

describe('civil-day arithmetic', () => {
  it('provides functional BS arithmetic', () => {
    const start = bs(2000, 1, 1);
    const next = bs(2000, 1, 2);

    expect(compareBS(start, next)).toBe(-1);
    expect(equalBS(start, start)).toBe(true);
    expect(differenceInDaysBS(next, start)).toBe(1);
    expect(addDaysBS(start, 1)).toEqual(next);
    expect(addWeeksBS(start, 1)).toEqual(bs(2000, 1, 8));
    expect(weekdayAD(ad(1943, 4, 14))).toBe(3);
  });

  it('keeps NepaliDate immutable and delegates day identity', () => {
    const start = NepaliDate.fromBS(bs(2000, 1, 1));
    const next = start.addDays(1);

    expect(Object.isFrozen(start)).toBe(true);
    expect(start.toBS()).toEqual(bs(2000, 1, 1));
    expect(next.toBS()).toEqual(bs(2000, 1, 2));
    expect(start.compare(next)).toBe(-1);
    expect(start.differenceInDays(next)).toBe(-1);
    expect(start.addWeeks(1).toBS()).toEqual(bs(2000, 1, 8));
  });

  it('defines BS month/year overflow semantics', () => {
    expect(addMonthsBS(bs(2082, 3, 32), 1)).toEqual(bs(2082, 4, 31));
    expect(addMonthsBS(bs(2082, 1, 31), 2)).toEqual(bs(2082, 3, 31));
    expect(addYearsBS(bs(2081, 2, 32), 1)).toEqual(bs(2082, 2, 31));
    expect(() => addMonthsBS(bs(2082, 3, 32), 1, { overflow: 'reject' })).toThrow(RangeError);
  });
});
