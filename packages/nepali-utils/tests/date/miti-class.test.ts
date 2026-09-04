import { describe, it, expect } from 'vitest';
import { Miti } from '../../src/date/value.js';
import { toAD, toBS } from '../../src/date/internal/conversion.js';
describe('Miti class', () => {
  it('fromBS/toAD equals functional', () => {
    const m = Miti.fromBS({ year: 2082, month: 4, day: 7 });
    expect(m.toAD()).toEqual(toAD({ year: 2082, month: 4, day: 7 }));
  });
  it('fromAD/toBS equals functional', () => {
    const m = Miti.fromAD({ year: 2025, month: 7, day: 23 });
    expect(m.toBS()).toEqual(toBS({ year: 2025, month: 7, day: 23 }));
  });
  it('equals & addDays', () => {
    const a = Miti.fromBS({ year: 2000, month: 1, day: 1 });
    const b = a.addDays(1);
    expect(b.toBS()).toEqual({ year: 2000, month: 1, day: 2 });
    expect(a.equals(a)).toBe(true);
    expect(a.equals(b)).toBe(false);
  });
  it('immutability: addDays does not mutate', () => {
    const a = Miti.fromBS({ year: 2000, month: 1, day: 1 });
    const b = a.addDays(1);
    expect(b.toBS()).toEqual({ year: 2000, month: 1, day: 2 });
    expect(a.toBS()).toEqual({ year: 2000, month: 1, day: 1 });
  });
  it('out of range throws', () => {
    expect(() => Miti.fromBS({ year: 1999, month: 1, day: 1 })).toThrow(RangeError);
    expect(() => Miti.fromAD({ year: 1943, month: 4, day: 13 })).toThrow(RangeError);
  });
});
