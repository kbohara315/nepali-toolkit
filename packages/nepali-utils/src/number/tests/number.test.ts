import { describe, expect, it } from 'vitest';
import { formatNumber, parseNumber, InvalidNumberError } from '../index.js';
import { toAscii, toDevanagari } from '../index.js';

function throwsInvalid(fn: () => unknown): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidNumberError);
    expect(error).toBeInstanceOf(TypeError);
    expect((error as InvalidNumberError).code).toBe('INVALID_NUMBER');
    return;
  }
  throw new Error('Expected InvalidNumberError');
}

describe('formatNumber Nepali grouping transitions', () => {
  const cases: Array<[string, string]> = [
    ['1', '1'],
    ['12', '12'],
    ['123', '123'],
    ['1234', '1,234'],
    ['12345', '12,345'],
    ['123456', '1,23,456'],
    ['1234567', '12,34,567'],
    ['12345678', '1,23,45,678'],
    ['123456789', '12,34,56,789'],
    ['10000000', '1,00,00,000'],
    ['100000000', '10,00,00,000'],
    ['1000000000', '1,00,00,00,000'],
  ];
  for (const [input, expected] of cases) {
    it(`groups ${input} as ${expected}`, () => {
      expect(formatNumber(input, { maximumFractionDigits: 0 })).toBe(expected);
    });
  }

  it('groups western style in threes', () => {
    expect(
      formatNumber('12345678', { grouping: 'western', maximumFractionDigits: 0 }),
    ).toBe('12,345,678');
  });

  it('applies no grouping with none', () => {
    expect(
      formatNumber('12345678', { grouping: 'none', maximumFractionDigits: 0 }),
    ).toBe('12345678');
  });
});

describe('formatNumber exactness and signs', () => {
  it('formats the float-killer string without binary error', () => {
    expect(
      formatNumber('999999999999999999.95', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    ).toBe('9,99,99,99,99,99,99,99,999.95');
  });

  it('rounds halves up with carry into the integer part', () => {
    expect(formatNumber('999.995', { maximumFractionDigits: 2 })).toBe('1,000.00');
    expect(formatNumber('2.5', { maximumFractionDigits: 0 })).toBe('3');
    expect(formatNumber('2.4', { maximumFractionDigits: 0 })).toBe('2');
    expect(formatNumber('-2.5', { maximumFractionDigits: 0 })).toBe('-3');
  });

  it('pads fractions to the minimum digits', () => {
    expect(
      formatNumber('1.5', { minimumFractionDigits: 2, maximumFractionDigits: 3 }),
    ).toBe('1.50');
  });

  it('renders negatives with ASCII leading minus', () => {
    expect(formatNumber('-123456', { maximumFractionDigits: 0 })).toBe('-1,23,456');
    expect(
      formatNumber('-123456', { numerals: 'devanagari', maximumFractionDigits: 0 }),
    ).toBe('-१,२३,४५६');
  });

  it('renders zero without a sign', () => {
    expect(formatNumber('-0', { maximumFractionDigits: 0 })).toBe('0');
    expect(formatNumber(0, { maximumFractionDigits: 0 })).toBe('0');
  });

  it('strips leading zeros', () => {
    expect(formatNumber('0001234', { maximumFractionDigits: 0 })).toBe('1,234');
  });

  it('accepts bigint beyond MAX_SAFE_INTEGER', () => {
    expect(
      formatNumber(123456789012345678901234567890n, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    ).toBe('1,23,45,67,89,01,23,45,67,89,01,23,45,67,890');
  });

  it('rejects fraction options for bigint', () => {
    throwsInvalid(() => formatNumber(10n));
    throwsInvalid(() =>
      formatNumber(10n, { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
    );
  });

  it('accepts Devanagari input', () => {
    expect(formatNumber('१२३४५६', { maximumFractionDigits: 0 })).toBe('1,23,456');
    expect(
      formatNumber('१२३४५६', { numerals: 'devanagari', maximumFractionDigits: 0 }),
    ).toBe('१,२३,४५६');
  });

  it('applies custom separators', () => {
    expect(
      formatNumber('1234567.89', {
        maximumFractionDigits: 2,
        groupSeparator: ' ',
        decimalSeparator: ',',
      }),
    ).toBe('12 34 567,89');
  });
});

describe('formatNumber errors', () => {
  it('rejects min greater than max', () => {
    throwsInvalid(() =>
      formatNumber('1', { minimumFractionDigits: 3, maximumFractionDigits: 2 }),
    );
  });

  it('rejects bad separators', () => {
    throwsInvalid(() => formatNumber('1', { groupSeparator: '1' }));
    throwsInvalid(() => formatNumber('1', { groupSeparator: '' }));
    throwsInvalid(() => formatNumber('1', { groupSeparator: ',,' }));
    throwsInvalid(() =>
      formatNumber('1', { groupSeparator: ',', decimalSeparator: ',' }),
    );
  });

  it('rejects invalid strings', () => {
    for (const bad of ['', '   ', '--1', '1.2.3', '1e5', 'abc', '+', '.', '-', ',,,']) {
      throwsInvalid(() => formatNumber(bad));
    }
  });

  it('rejects non-finite numbers', () => {
    throwsInvalid(() => formatNumber(Number.NaN));
    throwsInvalid(() => formatNumber(Number.POSITIVE_INFINITY));
  });

  it('rejects unsupported option values', () => {
    throwsInvalid(() =>
      formatNumber('1', { grouping: 'lakh' as never, maximumFractionDigits: 0 }),
    );
    throwsInvalid(() =>
      formatNumber('1', { rounding: 'half-even' as never, maximumFractionDigits: 0 }),
    );
  });
});

describe('parseNumber', () => {
  it('parses grouped Nepali and western forms', () => {
    expect(parseNumber('1,23,45,678')).toBe('12345678');
    expect(parseNumber('12,345,678')).toBe('12345678');
    expect(parseNumber('  12,345.50  ')).toBe('12345.50');
  });

  it('parses Devanagari input', () => {
    expect(parseNumber('१,२३,४५६.७८')).toBe('123456.78');
    expect(parseNumber('१२३')).toBe('123');
  });

  it('canonicalizes sign and leading zeros', () => {
    expect(parseNumber('+007.50')).toBe('7.50');
    expect(parseNumber('0001234')).toBe('1234');
    expect(parseNumber('-0')).toBe('0');
  });

  it('rejects invalid strings', () => {
    for (const bad of ['', '   ', '--1', '1.2.3', '1e5', 'abc', '12a34', '5.']) {
      throwsInvalid(() => parseNumber(bad));
    }
  });
});

describe('round-trip law', () => {
  const exactValues = [
    '0',
    '1',
    '999',
    '1234',
    '123456',
    '12345678',
    '999999999999999999.95',
    '-123456.789',
    '10000000',
    '123456789012345678901234567890',
  ];
  for (const value of exactValues) {
    it(`parse(format(${value})) is canonical`, () => {
      expect(parseNumber(formatNumber(value, { grouping: 'nepali' }))).toBe(
        parseNumber(value),
      );
    });
  }

  it('parse(format(x)) matches the rounded canonical form', () => {
    expect(
      parseNumber(
        formatNumber('0.005', {
          grouping: 'nepali',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ),
    ).toBe('0.01');
  });
});

describe('digits both directions', () => {
  it('maps all ten Devanagari digits', () => {
    expect(toAscii('०१२३४५६७८९')).toBe('0123456789');
    expect(toDevanagari('0123456789')).toBe('०१२३४५६७८९');
    for (let digit = 0; digit <= 9; digit += 1) {
      const devanagari = String.fromCharCode(0x0966 + digit);
      expect(toAscii(devanagari)).toBe(String(digit));
      expect(toDevanagari(String(digit))).toBe(devanagari);
    }
  });
});
