import { describe, expect, it } from 'vitest';
import {
  fiscalYearEnd,
  fiscalYearInfo,
  fiscalYearStart,
  formatFiscalYear,
  getFiscalYear,
  isInFiscalYear,
} from '../../../src/date/fiscal.js';
import { bs } from '../../../src/date/types.js';
import { monthLength } from '../../../src/date/internal/patro.js';

const YEARS = [2080, 2081, 2082];

describe('fiscal boundaries', () => {
  it.each(YEARS)('start is Shrawan 1 and end is last day of Ashadh (%i)', (year) => {
    expect(fiscalYearStart(year)).toEqual(bs(year, 4, 1));
    expect(fiscalYearEnd(year)).toEqual(bs(year + 1, 3, monthLength(year + 1, 3)));
    const info = fiscalYearInfo(year);
    expect(info.year).toBe(year);
    expect(info.start).toEqual(fiscalYearStart(year));
    expect(info.end).toEqual(fiscalYearEnd(year));
  });

  it('assigns dates around the Shrawan/Ashadh boundary', () => {
    for (const year of YEARS) {
      const lastAshadh = monthLength(year, 3);
      // Last day of Ashadh belongs to previous fiscal year
      expect(getFiscalYear(bs(year, 3, lastAshadh))).toBe(year - 1);
      // Shrawan 1 starts the new fiscal year
      expect(getFiscalYear(bs(year, 4, 1))).toBe(year);
      // Mid-year spot checks
      expect(getFiscalYear(bs(year, 1, 15))).toBe(year - 1);
      expect(getFiscalYear(bs(year, 12, 30))).toBe(year);
    }
  });

  it('isInFiscalYear matches getFiscalYear', () => {
    for (const year of YEARS) {
      const lastAshadh = monthLength(year, 3);
      expect(isInFiscalYear(bs(year, 3, lastAshadh), year - 1)).toBe(true);
      expect(isInFiscalYear(bs(year, 3, lastAshadh), year)).toBe(false);
      expect(isInFiscalYear(bs(year, 4, 1), year)).toBe(true);
      expect(isInFiscalYear(bs(year, 4, 1), year - 1)).toBe(false);
    }
  });

  it('formats fiscal year labels', () => {
    expect(formatFiscalYear(2082)).toBe('2082/83');
    expect(formatFiscalYear(2099)).toBe('2099/00');
  });
});
