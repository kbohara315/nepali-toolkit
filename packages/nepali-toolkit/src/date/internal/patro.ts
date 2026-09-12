import { metadata } from './data.js';
import { InvalidCivilDateError, InvalidFieldError, UnsupportedDateError } from '../errors.js';
import { MONTH_PATTERNS, YEAR_PATTERN_IDS, YEAR_PREFIX } from './generated-data.js';
import type { BSDate } from '../types.js';

export const BS_START_YEAR = metadata.bsStart.year,
  BS_END_YEAR = metadata.bsEnd.year;

function monthPattern(bsYear: number): readonly number[] | undefined {
  return MONTH_PATTERNS[YEAR_PATTERN_IDS[bsYear - BS_START_YEAR]];
}

function assertInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value))
    throw new InvalidFieldError(`${field} must be a finite integer`);
}

export function assertBSFields(bsYear: number, bsMonth: number, bsDay: number): void {
  assertInteger(bsYear, 'BS year');
  assertInteger(bsMonth, 'BS month');
  assertInteger(bsDay, 'BS day');
  if (bsMonth < 1 || bsMonth > 12) {
    throw new InvalidCivilDateError('BS month must be between 1 and 12');
  }
  if (bsYear < BS_START_YEAR || bsYear > BS_END_YEAR) {
    throw new UnsupportedDateError('BS date is outside the supported range');
  }
  const pattern = monthPattern(bsYear);
  if (!pattern) throw new UnsupportedDateError('BS year is outside the supported range');
  const length = pattern[bsMonth - 1];
  if (bsDay < 1 || bsDay > length) {
    throw new InvalidCivilDateError('Invalid BS civil date');
  }
}

export function monthLength(bsYear: number, bsMonth: number): number {
  assertInteger(bsYear, 'BS year');
  assertInteger(bsMonth, 'BS month');
  if (bsMonth < 1 || bsMonth > 12)
    throw new InvalidCivilDateError('BS month must be between 1 and 12');
  const row = monthPattern(bsYear);
  if (!row) throw new UnsupportedDateError('BS year is outside the supported range');
  return row[bsMonth - 1];
}
export function daysBeforeYear(bsYear: number): number {
  assertInteger(bsYear, 'BS year');
  if (bsYear < BS_START_YEAR || bsYear > BS_END_YEAR + 1)
    throw new UnsupportedDateError('BS year is outside the supported range');
  return YEAR_PREFIX[bsYear - BS_START_YEAR];
}
export const TOTAL_DAYS = metadata.totalDays;
export function bsToOrdinal(bsYear: number, bsMonth: number, bsDay: number): number {
  assertBSFields(bsYear, bsMonth, bsDay);
  return daysBeforeYear(bsYear) + bsYearMonthOffset(bsYear, bsMonth) + bsDay - 1;
}
function bsYearMonthOffset(y: number, m: number): number {
  const row = monthPattern(y);
  if (!row) throw new UnsupportedDateError('BS year is outside the supported range');
  let s = 0;
  for (let i = 0; i < m - 1; i++) s += row[i];
  return s;
}
export function ordinalToBS(ord: number): BSDate {
  if (!Number.isSafeInteger(ord)) throw new InvalidFieldError('BS ordinal must be a safe integer');
  if (ord < 0 || ord >= TOTAL_DAYS)
    throw new UnsupportedDateError('BS ordinal is outside the supported range');
  // binary search year
  let lo = 0,
    hi = YEAR_PREFIX.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (YEAR_PREFIX[mid] <= ord) lo = mid;
    else hi = mid;
  }
  const year = BS_START_YEAR + lo;
  const dayOfYear = ord - YEAR_PREFIX[lo];
  const row = MONTH_PATTERNS[YEAR_PATTERN_IDS[lo]];
  let m = 0,
    acc = 0;
  while (m < 12) {
    if (dayOfYear < acc + row[m]) break;
    acc += row[m];
    m++;
  }
  return Object.freeze({ year, month: m + 1, day: dayOfYear - acc + 1 }) as BSDate;
}
