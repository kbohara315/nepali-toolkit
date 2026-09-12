import { describe, expect, it } from 'vitest';
import { formatNPR, formatNPRMinorUnits } from '../index.js';
import { InvalidNumberError } from '../../number/errors.js';
import { InvalidCurrencyError } from '../index.js';

describe('currency edge cases', () => {
  it('all 4 symbols x both placements snapshot', () => {
    const symbols = ['रु', 'रू', 'नेरू', 'NPR'] as const;
    for (const symbol of symbols) {
      const before = formatNPR('1234', { symbol, numerals: 'ascii', placement: 'before' });
      const after = formatNPR('1234', { symbol, numerals: 'ascii', placement: 'after' });
      expect(before.startsWith(symbol)).toBe(true);
      expect(after.endsWith(symbol)).toBe(true);
      expect(before).toContain('1,234.00');
      expect(after).toContain('1,234.00');
    }
  });

  it('nbsp separator is exactly U+00A0', () => {
    const out = formatNPR('1234', { numerals: 'ascii', spacing: 'nbsp' });
    expect(out).toContain(' ');
    expect(out.charCodeAt(2)).toBe(0x00a0);
    expect(out).not.toContain(' ');
  });

  it('parentheses wrap the whole after-placement amount', () => {
    expect(formatNPR('-10', { numerals: 'ascii', placement: 'after', negative: 'parentheses' })).toBe('(10.00 रु)');
  });

  it('minor-units large negative keeps exact paisa value', () => {
    expect(formatNPRMinorUnits(-123456789n, { numerals: 'ascii' })).toBe('-रु 12,34,567.89');
  });

  it('formatNPR vs formatNPRMinorUnits agree on the same amount', () => {
    expect(formatNPRMinorUnits(123456n, { numerals: 'ascii' })).toBe(formatNPR('1234.56', { numerals: 'ascii' }));
    expect(formatNPRMinorUnits(-1000n, { numerals: 'ascii' })).toBe(formatNPR('-10', { numerals: 'ascii' }));
  });

  it('fraction validation: negative and non-integer digits rejected (no upper bound)', () => {
    expect(formatNPR('10', { numerals: 'ascii', minimumFractionDigits: 0, maximumFractionDigits: 3 })).toBe('रु 10');
    for (const bad of [
      { minimumFractionDigits: -1 },
      { maximumFractionDigits: -1 },
      { minimumFractionDigits: 1.5 },
    ] as const) {
      try {
        formatNPR('10', { numerals: 'ascii', ...bad });
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidCurrencyError);
        expect((error as InvalidCurrencyError).code).toBe('INVALID_CURRENCY');
      }
    }
  });

  it('garbage input raises InvalidNumberError with INVALID_NUMBER (not Currency)', () => {
    try {
      formatNPR('not-money!!');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidNumberError);
      expect(error).not.toBeInstanceOf(InvalidCurrencyError);
      expect((error as InvalidNumberError).code).toBe('INVALID_NUMBER');
    }
  });
});
