import { describe, expect, it } from 'vitest';
import { ad, bs, toAD, toBS } from '../convert.js';
import { UnsupportedDateError } from '../errors.js';
import { monthLength } from '../internal/patro.js';
import { addDaysBS } from '../arithmetic.js';
import { NepaliDate } from '../value.js';
import { addDays } from '../arithmetic.js';
import { formatBS, formatAD } from '../format.js';
import { parseBS, parseAD } from '../parse.js';
import { getFiscalYear, fiscalYearStart, fiscalYearEnd } from '../fiscal.js';
import { instantToAD } from '../adapters/timezone.js';

function throwsUnsupported(fn: () => unknown): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(UnsupportedDateError);
    expect((error as UnsupportedDateError).code).toBe('UNSUPPORTED_DATE');
    return;
  }
  throw new Error('Expected UnsupportedDateError');
}

describe('supported-range endpoints', () => {
  it('first civil day converts both directions (reference pair)', () => {
    expect(toAD(bs(2000, 1, 1))).toEqual(ad(1943, 4, 14));
    expect(toBS(ad(1943, 4, 14))).toEqual(bs(2000, 1, 1));
  });

  it('last civil day converts both directions', () => {
    expect(toAD(bs(2090, 12, 30))).toEqual(ad(2034, 4, 13));
    expect(toBS(ad(2034, 4, 13))).toEqual(bs(2090, 12, 30));
  });

  it('day-before-start and day-after-end throw with UNSUPPORTED_DATE', () => {
    throwsUnsupported(() => toAD(bs(1999, 12, 30)));
    throwsUnsupported(() => toBS(ad(1943, 4, 13)));
    throwsUnsupported(() => toAD(bs(2091, 1, 1)));
    throwsUnsupported(() => toBS(ad(2034, 4, 14)));
  });

  it('malformed day-zero is INVALID_CIVIL_DATE, not UNSUPPORTED_DATE (strict-validation regression)', () => {
    try {
      toAD(bs(2000, 1, 0 as never));
      expect.unreachable();
    } catch (error) {
      expect((error as { code?: string }).code).toBe('INVALID_CIVIL_DATE');
    }
  });

  it('1900 is out of range (unsupported), 2000-02-29 converts (leap day in range)', () => {
    throwsUnsupported(() => toBS(ad(1900, 2, 28)));
    // 2000-02-29 is a real leap day inside the supported AD window.
    const asBS = toBS(ad(2000, 2, 29));
    expect(toAD(asBS)).toEqual(ad(2000, 2, 29));
  });

  it('2024-02-29 leap day round-trips', () => {
    const asBS = toBS(ad(2024, 2, 29));
    expect(toAD(asBS)).toEqual(ad(2024, 2, 29));
  });
});

describe('BS month-length transitions within one year', () => {
  it('last-day-of-month + 1 day lands on the first of the next month (year 2082)', () => {
    for (let month = 1; month <= 12; month += 1) {
      const len = monthLength(2082, month);
      expect(len).toBeGreaterThan(27);
      const last = bs(2082, month, len);
      const next = addDaysBS(last, 1);
      if (month < 12) expect(next).toEqual(bs(2082, month + 1, 1));
      else expect(next).toEqual(bs(2083, 1, 1));
    }
  });
});

describe('NepaliDate.addDays agrees with functional addDaysBS across boundaries', () => {
  it('month and year boundaries', () => {
    const cases: Array<[number, number, number, number]> = [
      [2082, 1, 31, 1], // month end -> next month
      [2082, 12, 30, 1], // year end -> next year (if valid)
      [2082, 4, 15, 40], // long jump across months
      [2082, 1, 1, -1], // backwards across year boundary
    ];
    for (const [y, m, d, n] of cases) {
      const start = bs(y, m, d);
      const expected = addDaysBS(start, n);
      expect(NepaliDate.fromBS(start).addDays(n).toBS()).toEqual(expected);
      expect(addDays(ad(2000, 1, 1), 0)).toEqual(ad(2000, 1, 1));
    }
  });
});

describe('fiscal boundaries', () => {
  it('Shrawan 1 starts the year; Ashadh-end closes it, both sides', () => {
    expect(getFiscalYear(bs(2082, 4, 1))).toBe(2082);
    expect(getFiscalYear(bs(2082, 3, 32))).toBe(2081);
    expect(fiscalYearStart(2082)).toEqual(bs(2082, 4, 1));
    const end = fiscalYearEnd(2081);
    expect(end).toEqual(bs(2082, 3, monthLength(2082, 3)));
    // Day after fiscal end is the next fiscal year's start.
    expect(getFiscalYear(addDaysBS(end, 1))).toBe(2082);
  });
});

describe('parse<->format canonical round-trips incl. Devanagari', () => {
  it('BS round-trip', () => {
    const date = bs(2082, 4, 7);
    const text = formatBS(date, 'YYYY-MM-DD');
    expect(parseBS(text)).toEqual(date);
  });

  it('AD round-trip', () => {
    const date = ad(2025, 7, 23);
    const text = formatAD(date, 'YYYY-MM-DD');
    expect(parseAD(text)).toEqual(date);
  });

  it('Devanagari numerals round-trip', () => {
    const date = bs(2082, 4, 7);
    const dev = formatBS(date, 'YYYY-MM-DD');
    expect(parseBS(dev.replace(/[0-9]/g, (d) => '०१२३४५६७८९'[Number(d)]), { allowDevanagari: true })).toEqual(date);
  });
});

describe('UTC adapter DST-zone fixture', () => {
  it('same instant maps to different civil days across zones', () => {
    // 2025-01-15T19:00:00Z is still Jan 15 in New York but Jan 16 in Kathmandu.
    const ny = instantToAD('2025-01-15T19:00:00Z', 'America/New_York');
    const ktm = instantToAD('2025-01-15T19:00:00Z', 'Asia/Kathmandu');
    expect(ktm).not.toEqual(ny);
    expect(ktm.day).toBe(ny.day + 1);
  });
});
