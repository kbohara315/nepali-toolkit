import { describe, expect, it } from 'vitest';
import { formatNumber, parseNumber, InvalidNumberError } from '../index.js';

function throwsInvalid(fn: () => unknown): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidNumberError);
    expect((error as InvalidNumberError).code).toBe('INVALID_NUMBER');
    return;
  }
  throw new Error('Expected InvalidNumberError');
}

describe('grouping transitions at every digit-count 1-12', () => {
  const nepali: Record<number, string> = {
    1: '1', 2: '12', 3: '123', 4: '1,234', 5: '12,345', 6: '1,23,456',
    7: '12,34,567', 8: '1,23,45,678', 9: '12,34,56,789',
    10: '1,23,45,67,890', 11: '12,34,56,78,901', 12: '1,23,45,67,89,012',
  };
  const western: Record<number, string> = {
    1: '1', 2: '12', 3: '123', 4: '1,234', 5: '12,345', 6: '123,456',
    7: '1,234,567', 8: '12,345,678', 9: '123,456,789',
    10: '1,234,567,890', 11: '12,345,678,901', 12: '123,456,789,012',
  };
  for (let digits = 1; digits <= 12; digits += 1) {
    const raw = '123456789012'.slice(0, digits);
    it(`nepali groups ${digits} digits`, () => {
      expect(formatNumber(raw, { maximumFractionDigits: 0 })).toBe(nepali[digits]);
    });
    it(`western groups ${digits} digits`, () => {
      expect(formatNumber(raw, { grouping: 'western', maximumFractionDigits: 0 })).toBe(western[digits]);
    });
  }
});

describe('fraction boundaries', () => {
  it('digits beyond max are half-up rounded, never silently kept', () => {
    expect(formatNumber('1.234567', { maximumFractionDigits: 3 })).toBe('1.235');
    expect(formatNumber('1.2344', { maximumFractionDigits: 3 })).toBe('1.234');
  });

  it('half-up rounds 2.5 away from banker-friendly even (3, not 2)', () => {
    expect(formatNumber('2.5', { maximumFractionDigits: 0 })).toBe('3');
    expect(formatNumber('3.5', { maximumFractionDigits: 0 })).toBe('4');
  });

  it('negative zero normalizes sign but parse preserves the fraction shape', () => {
    expect(formatNumber('-0.0', { maximumFractionDigits: 0 })).toBe('0');
    expect(parseNumber('-0')).toBe('0');
    expect(parseNumber('-0.00')).toBe('0.00');
  });

  it("'+5' signed strings are accepted and canonicalized", () => {
    expect(parseNumber('+5')).toBe('5');
    expect(formatNumber('+5', { maximumFractionDigits: 0 })).toBe('5');
  });

  it('whitespace-only input is rejected', () => {
    for (const bad of [' ', '\t', '\n  \t ']) throwsInvalid(() => parseNumber(bad));
  });

  it('separator validation: multi-char, digit, identical', () => {
    throwsInvalid(() => formatNumber('1', { groupSeparator: ',,' }));
    throwsInvalid(() => formatNumber('1', { groupSeparator: '5' }));
    throwsInvalid(() => formatNumber('1', { groupSeparator: '.', decimalSeparator: '.' }));
    throwsInvalid(() => formatNumber('1', { decimalSeparator: 'ab' }));
  });
});

describe('parse(format(x)) sweep incl. Devanagari output', () => {
  const values = ['0', '7', '99', '999', '9999', '99999', '999999', '9999999', '123456789', '1234567890', '12345678901', '999999999999', '-54321.25', '0.125'];
  for (const value of values) {
    it(`ascii round-trip ${value}`, () => {
      expect(parseNumber(formatNumber(value))).toBe(parseNumber(value));
    });
    it(`devanagari round-trip ${value}`, () => {
      const shown = formatNumber(value, { numerals: 'devanagari' });
      expect(parseNumber(shown)).toBe(parseNumber(value));
    });
  }
});
