import { assertBSDate, bs } from './types.js';
import type { BSDate, BSDateFields } from './types.js';
import { daysInMonthBS } from './arithmetic.js';
import { InvalidFiscalYearError } from './errors.js';

/** BS month index where the Nepali fiscal year starts (Shrawan). */
const FISCAL_START_MONTH = 4;

export interface FiscalYear {
  readonly year: number;
  readonly start: BSDate;
  readonly end: BSDate;
}

function assertYear(year: number): void {
  if (!Number.isSafeInteger(year))
    throw new InvalidFiscalYearError('Fiscal year must be a safe integer');
}

function validateDate(date: BSDateFields): void {
  assertBSDate(date);
}

/** Return the BS year in which the Shrawan-to-Ashadh fiscal year starts. */
export function getFiscalYear(date: BSDateFields): number {
  validateDate(date);
  return date.month >= FISCAL_START_MONTH ? date.year : date.year - 1;
}

export const fiscalYearOf = getFiscalYear;
export const fiscalYear = getFiscalYear;

/** The first day of a BS fiscal year, Shrawan 1. */
export function fiscalYearStart(year: number): BSDate {
  assertYear(year);
  return bs(year, FISCAL_START_MONTH, 1);
}

/** The last day of a BS fiscal year, the final day of Ashadh. */
export function fiscalYearEnd(year: number): BSDate {
  assertYear(year);
  return bs(year + 1, 3, daysInMonthBS(bs(year + 1, 3, 1)));
}

export function getFiscalYearStart(year: number): BSDate {
  return fiscalYearStart(year);
}

export function getFiscalYearEnd(year: number): BSDate {
  return fiscalYearEnd(year);
}

export function fiscalYearInfo(year: number): FiscalYear {
  return { year, start: fiscalYearStart(year), end: fiscalYearEnd(year) };
}

export const getFiscalYearInfo = fiscalYearInfo;

export function isInFiscalYear(date: BSDateFields, year: number): boolean {
  assertYear(year);
  return getFiscalYear(date) === year;
}

/** Format the conventional Nepali fiscal-year label, for example `2082/83`. */
export function formatFiscalYear(year: number): string {
  assertYear(year);
  return `${year}/${String(Math.abs(year + 1) % 100).padStart(2, '0')}`;
}

export const fiscalYearLabel = formatFiscalYear;
