import { describe, expect, it } from 'vitest';
import { formatNPR, formatNPRMinorUnits, InvalidCurrencyError } from '../index.js';
import { InvalidNumberError } from '../../number/errors.js';

describe('formatNPR defaults', () => {
  it("formats the default call exactly as 'रु १,२३,४५,६७८.९०'", () => {
    expect(formatNPR('12345678.9')).toBe('रु १,२३,४५,६७८.९०');
  });

  it('formats bigint rupees with forced .00', () => {
    expect(formatNPR(10n)).toBe('रु १०.००');
  });
});

describe('symbol × placement × spacing corpus', () => {
  const symbols = ['रु', 'रू', 'नेरू', 'NPR'] as const;
  const cases: Array<{ placement: 'before' | 'after'; spacing: 'none' | 'space' | 'nbsp'; sep: string }> = [
    { placement: 'before', spacing: 'none', sep: '' },
    { placement: 'before', spacing: 'space', sep: ' ' },
    { placement: 'before', spacing: 'nbsp', sep: ' ' },
    { placement: 'after', spacing: 'none', sep: '' },
    { placement: 'after', spacing: 'space', sep: ' ' },
    { placement: 'after', spacing: 'nbsp', sep: ' ' },
  ];
  for (const symbol of symbols) {
    for (const { placement, spacing, sep } of cases) {
      it(`${symbol} ${placement} ${spacing}`, () => {
        const magnitude = '१,२३४.००';
        const expected = placement === 'before' ? `${symbol}${sep}${magnitude}` : `${magnitude}${sep}${symbol}`;
        expect(formatNPR('1234', { symbol, placement, spacing })).toBe(expected);
      });
    }
  }
});

describe('formatNPR options', () => {
  it('renders minus sign before the symbol', () => {
    expect(formatNPR('-10', { numerals: 'ascii' })).toBe('-रु 10.00');
  });

  it('renders parentheses negatives', () => {
    expect(formatNPR('-10', { numerals: 'ascii', negative: 'parentheses' })).toBe('(रु 10.00)');
  });

  it('renders after placement with minus', () => {
    expect(formatNPR('-10', { numerals: 'ascii', placement: 'after' })).toBe('-10.00 रु');
  });

  it('supports western grouping', () => {
    expect(formatNPR('12345678.9', { numerals: 'ascii', grouping: 'western' })).toBe('रु 12,345,678.90');
  });

  it('supports no grouping', () => {
    expect(formatNPR('12345678.9', { numerals: 'ascii', grouping: 'none' })).toBe('रु 12345678.90');
  });

  it('supports ascii numerals', () => {
    expect(formatNPR('1234', { numerals: 'ascii' })).toBe('रु 1,234.00');
  });

  it('honours fraction overrides', () => {
    expect(formatNPR('10.5', { numerals: 'ascii', minimumFractionDigits: 0, maximumFractionDigits: 0 })).toBe('रु 11');
    expect(formatNPR('10', { numerals: 'ascii', minimumFractionDigits: 0, maximumFractionDigits: 3 })).toBe('रु 10');
  });

  it('throws InvalidCurrencyError when min exceeds max', () => {
    try {
      formatNPR('10', { minimumFractionDigits: 3, maximumFractionDigits: 2 });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidCurrencyError);
      expect((error as InvalidCurrencyError).code).toBe('INVALID_CURRENCY');
    }
  });

  it('reuses InvalidNumberError for malformed input', () => {
    try {
      formatNPR('abc');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidNumberError);
      expect((error as InvalidNumberError).code).toBe('INVALID_NUMBER');
    }
  });

  it('documents float approximation: number vs string diverge', () => {
    const opts = { numerals: 'ascii', minimumFractionDigits: 17, maximumFractionDigits: 17 } as const;
    expect(formatNPR(0.1 + 0.2, opts)).toBe('रु 0.30000000000000004');
    expect(formatNPR('0.3', opts)).toBe('रु 0.30000000000000000');
  });
});

describe('formatNPRMinorUnits', () => {
  it('converts paisa by decimal shift', () => {
    expect(formatNPRMinorUnits(12345678n, { numerals: 'ascii' })).toBe('रु 1,23,456.78');
  });

  it('renders sub-rupee amounts', () => {
    expect(formatNPRMinorUnits(5n)).toBe('रु ०.०५');
  });

  it('renders negative paisa with minus before the symbol', () => {
    expect(formatNPRMinorUnits(-1000n)).toBe('-रु १०.००');
  });

  it('renders negative paisa with parentheses', () => {
    expect(formatNPRMinorUnits(-1000n, { numerals: 'ascii', negative: 'parentheses' })).toBe('(रु 10.00)');
  });

  it('rejects non-bigint paisa', () => {
    try {
      formatNPRMinorUnits(10 as unknown as bigint);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidCurrencyError);
      expect((error as InvalidCurrencyError).code).toBe('INVALID_CURRENCY');
    }
  });
});

describe('InvalidCurrencyError', () => {
  it("extends TypeError with code 'INVALID_CURRENCY'", () => {
    const error = new InvalidCurrencyError('nope');
    expect(error).toBeInstanceOf(TypeError);
    expect(error.code).toBe('INVALID_CURRENCY');
    expect(error.name).toBe('InvalidCurrencyError');
  });
});
