import { describe, expect, it } from 'vitest';
import { formatBS, formatAD } from '../../format.js';
import { parseBS, parseAD } from '../../parse.js';
import { toAscii, toDevanagari } from '../../../number/digits.js';
import { locale as enLocale } from '../../locale/en.js';
import { locale as neLocale } from '../../locale/ne.js';

const DATE = { year: 2082, month: 5, day: 9 };

// token -> expected ASCII output
const TOKEN_TABLE: Array<[string, string]> = [
  ['YYYY', '2082'],
  ['YY', '82'],
  ['MMMM', 'Bhadra'],
  ['MM', '05'],
  ['M', '5'],
  ['DD', '09'],
  ['D', '9'],
];

describe('token grammar table', () => {
  it.each(TOKEN_TABLE)('formatBS token %s -> %s', (pattern, expected) => {
    expect(formatBS(DATE, pattern)).toBe(expected);
  });

  it.each([
    ['YYYY/MM/DD', '2082/05/09'],
    ['YYYY-MM-DD', '2082-05-09'],
    ['YYYY.MM.DD', '2082.05.09'],
    ['YYYY MM DD', '2082 05 09'],
    ['D/M/YYYY', '9/5/2082'],
    ['DD-MM-YYYY', '09-05-2082'],
    ['MMMM D, YYYY', 'Bhadra 9, 2082'],
    ['[YYYY] YYYY', 'YYYY 2082'],
    ["'YY' YY", 'YY 82'],
  ])('pattern %s formats with separators/literals', (pattern, expected) => {
    expect(formatBS(DATE, pattern)).toBe(expected);
  });

  it('AD tokens use Gregorian month names', () => {
    expect(formatAD({ year: 2025, month: 1, day: 2 }, 'YYYY-MM-DD')).toBe('2025-01-02');
    expect(formatAD({ year: 2025, month: 1, day: 2 }, 'MMMM D, YYYY')).toBe('January 2, 2025');
  });

  it('unknown alpha throws SyntaxError', () => {
    expect(() => formatBS(DATE, 'YYYY-QQ')).toThrow(SyntaxError);
  });

  it('unterminated literal throws', () => {
    expect(() => formatBS(DATE, '[abc')).toThrow(SyntaxError);
    expect(() => formatBS(DATE, "'abc")).toThrow(SyntaxError);
  });
});

describe('parse grammar table', () => {
  it.each([
    ['2082-05-09', 'YYYY-MM-DD'],
    ['2082/05/09', 'YYYY/MM/DD'],
    ['2082.05.09', 'YYYY.MM.DD'],
    ['9/5/2082', 'D/M/YYYY'],
    ['09-05-2082', 'DD-MM-YYYY'],
  ])('parses %s with pattern %s', (input, pattern) => {
    const d = parseBS(input, pattern);
    expect([d.year, d.month, d.day]).toEqual([2082, 5, 9]);
  });

  it('MMMM parses month names', () => {
    const d = parseBS('Bhadra 9, 2082', 'MMMM D, YYYY');
    expect([d.year, d.month, d.day]).toEqual([2082, 5, 9]);
  });

  it('YY expands with yearBase', () => {
    const d = parseBS('82-05-09', 'YY-MM-DD');
    expect(d.year).toBe(2082);
  });

  it('M/D accept 1-2 digits; MM/DD require 2', () => {
    expect(parseBS('2082-5-9', 'YYYY-M-D').day).toBe(9);
    expect(() => parseBS('2082-5-9', 'YYYY-MM-DD')).toThrow();
  });

  it('duplicate field token fails', () => {
    expect(() => parseBS('1-2', 'M-M' as never)).toThrow();
  });

  it('regex separators are escaped', () => {
    const d = parseBS('2082.05.09', 'YYYY.MM.DD');
    expect(d.month).toBe(5);
  });
});

describe('round-trips', () => {
  const patterns = ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'MMMM D, YYYY', 'D/M/YYYY'];
  it.each(patterns)('BS round-trip %s', (pattern) => {
    const s = formatBS(DATE, pattern);
    const d = parseBS(s, pattern);
    expect([d.year, d.month, d.day]).toEqual([DATE.year, DATE.month, DATE.day]);
  });

  it('AD round-trip', () => {
    const ad = { year: 2025, month: 12, day: 25 };
    const s = formatAD(ad, 'YYYY-MM-DD');
    const d = parseAD(s, 'YYYY-MM-DD');
    expect([d.year, d.month, d.day]).toEqual([2025, 12, 25]);
  });
});

describe('locales + numerals', () => {
  it('en locale month names', () => {
    expect(formatBS(DATE, 'MMMM', enLocale)).toBe('Bhadra');
  });
  it('ne locale month names + devanagari numerals', () => {
    expect(formatBS(DATE, 'MMMM', neLocale)).toBe('भाद्र');
    expect(formatBS(DATE, 'YYYY-MM-DD', neLocale)).toBe(toDevanagari('2082-05-09'));
  });
  it('numerals option overrides', () => {
    expect(formatBS(DATE, 'YYYY', { numerals: 'devanagari' })).toBe(toDevanagari('2082'));
    expect(formatBS(DATE, 'YYYY', { numerals: 'ascii' })).toBe('2082');
  });
  it('devanagari parse round-trip', () => {
    const s = toDevanagari('2082-05-09');
    const d = parseBS(s, { pattern: 'YYYY-MM-DD', numerals: 'both' });
    expect([d.year, d.month, d.day]).toEqual([2082, 5, 9]);
    expect(toAscii(s)).toBe('2082-05-09');
  });
  it('ascii policy rejects devanagari', () => {
    expect(() =>
      parseBS(toDevanagari('2082-05-09'), { pattern: 'YYYY-MM-DD', numerals: 'ascii' }),
    ).toThrow();
  });
});
