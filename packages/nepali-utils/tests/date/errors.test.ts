import { describe, it, expect } from 'vitest';
import { toAD, toBS } from '../../src/date/internal/conversion.js';
describe('error taxonomy', () => {
  it('non-integer throws TypeError', () =>
    expect(() => toAD({ year: 2082.5, month: 4, day: 7 } as any)).toThrow(TypeError));
  it('invalid month throws RangeError', () =>
    expect(() => toAD({ year: 2082, month: 13, day: 1 })).toThrow(RangeError));
  it('invalid AD day throws RangeError', () =>
    expect(() => toBS({ year: 2025, month: 2, day: 30 })).toThrow(RangeError));
  it('AD out of supported range throws RangeError', () =>
    expect(() => toBS({ year: 2100, month: 1, day: 1 })).toThrow(RangeError));
});
