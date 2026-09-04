import { describe, expect, it } from 'vitest';
import { ad, bs } from '../../src/date/types.js';
import { toAD, toADFields, toBS, toBSFields } from '../../src/date/internal/conversion.js';
import { InvalidCivilDateError, InvalidFieldError, UnsupportedDateError } from '../../src/date/errors.js';

describe('foundation value model', () => {
  it('uses frozen plain records without a calendar tag', () => {
    const bsDate = bs(2000, 1, 1);
    const adDate = ad(1943, 4, 14);

    expect(bsDate).toEqual({ year: 2000, month: 1, day: 1 });
    expect(adDate).toEqual({ year: 1943, month: 4, day: 14 });
    expect(Object.keys(bsDate)).toEqual(['year', 'month', 'day']);
    expect(Object.isFrozen(bsDate)).toBe(true);
    expect(Object.isFrozen(adDate)).toBe(true);
  });

  it('converts branded values and retains a raw-field seam', () => {
    const bsDate = bs(2000, 1, 1);
    const adDate = ad(1943, 4, 14);

    expect(toAD(bsDate)).toEqual(adDate);
    expect(toBS(adDate)).toEqual(bsDate);
    expect(toADFields({ year: 2000, month: 1, day: 1 })).toEqual(adDate);
    expect(toBSFields({ year: 1943, month: 4, day: 14 })).toEqual(bsDate);
  });

  it('keeps invalid, malformed, and unsupported dates distinct', () => {
    expect(() => ad(2025, 2, 30)).toThrowError(InvalidCivilDateError);
    expect(() => ad(2025.5, 2, 1)).toThrowError(InvalidFieldError);
    expect(() => toBS(ad(2100, 1, 1))).toThrowError(UnsupportedDateError);
  });
});
