import { describe, expect, it } from 'vitest';
import { bs } from '../../src/date/types.js';
import { toAscii, toDevanagari } from '../../src/number/digits.js';
import * as en from '../../src/date/locale/en.js';
import * as ne from '../../src/date/locale/ne.js';
import {
  fiscalYearEnd,
  fiscalYearStart,
  formatFiscalYear,
  getFiscalYear,
  isInFiscalYear,
} from '../../src/date/fiscal.js';
import {
  differenceInDays,
  formatRelativeDays,
  nepaliRelativeLocale,
  relativePhrase,
} from '../../src/date/relative.js';
import { UnsupportedDateError } from '../../src/date/errors.js';

describe('numerals and locales', () => {
  it('converts only decimal digits', () => {
    expect(toDevanagari('-2082/04')).toBe('-२०८२/०४');
    expect(toAscii('२०८२/०४')).toBe('2082/04');
  });

  it('formats explicit locales without global state', () => {
    const date = bs(2082, 4, 7);
    expect(en.formatBS(date, 'YYYY MMMM DD')).toBe('2082 Shrawan 07');
    expect(ne.formatBS(date, 'YYYY MMMM DD')).toBe('२०८२ श्रावण ०७');
    expect(en.weekdayName(0)).toBe('Sunday');
    expect(ne.weekdayName(0)).toBe('आइतबार');
  });
});

describe('fiscal years and relative days', () => {
  it('uses Shrawan through Ashadh', () => {
    expect(getFiscalYear(bs(2082, 4, 1))).toBe(2082);
    expect(getFiscalYear(bs(2083, 3, 31))).toBe(2082);
    expect(fiscalYearStart(2082)).toEqual(bs(2082, 4, 1));
    expect(fiscalYearEnd(2082).year).toBe(2083);
    expect(formatFiscalYear(2082)).toBe('2082/83');
    expect(isInFiscalYear(bs(2083, 3, 31), 2082)).toBe(true);
    expect(() => fiscalYearEnd(2090)).toThrow(UnsupportedDateError);
  });

  it('requires explicit relative dates', () => {
    expect(differenceInDays(bs(2082, 4, 8), bs(2082, 4, 7))).toBe(1);
    expect(formatRelativeDays(0)).toBe('today');
    expect(formatRelativeDays(-2, nepaliRelativeLocale)).toBe('२ दिन अघि');
    expect(relativePhrase(bs(2082, 4, 8), bs(2082, 4, 7))).toBe('tomorrow');
  });
});
