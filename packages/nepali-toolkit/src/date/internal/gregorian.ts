import type { ADDate } from '../types.js';
import { InvalidCivilDateError, InvalidFieldError } from '../errors.js';

// Proleptic Gregorian civil day count: 1970-01-01 = 0, no Date/timezone.
function rawADToDayCount(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12),
    yp = y + 4800 - a,
    mp = m + 12 * a - 3;
  const jdn =
    d +
    Math.floor((153 * mp + 2) / 5) +
    365 * yp +
    Math.floor(yp / 4) -
    Math.floor(yp / 100) +
    Math.floor(yp / 400) -
    32045;
  return jdn - 2440588; // 2440588 = JDN of 1970-01-01
}

function rawDayCountToAD(n: number): ADDate {
  const jdn = n + 2440588;
  let a = jdn + 32044,
    b = Math.floor((4 * a + 3) / 146097),
    c = a - Math.floor((146097 * b) / 4),
    d = Math.floor((4 * c + 3) / 1461),
    e = c - Math.floor((1461 * d) / 4),
    m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1,
    month = m + 3 - 12 * Math.floor(m / 10),
    year = b * 100 + d - 4800 + Math.floor(m / 10);
  return Object.freeze({ year, month, day }) as ADDate;
}

function assertInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new InvalidFieldError(`${field} must be a finite integer`);
  }
}

/** Validate Gregorian fields without consulting a timezone or JavaScript Date. */
export function assertADFields(y: number, m: number, d: number): void {
  assertInteger(y, 'AD year');
  assertInteger(m, 'AD month');
  assertInteger(d, 'AD day');
  if (m < 1 || m > 12) throw new InvalidCivilDateError('AD month must be between 1 and 12');

  const dayCount = rawADToDayCount(y, m, d);
  const back = rawDayCountToAD(dayCount);
  if (back.year !== y || back.month !== m || back.day !== d) {
    throw new InvalidCivilDateError('Invalid AD civil date');
  }
}

export function adToDayCount(y: number, m: number, d: number): number {
  assertADFields(y, m, d);
  return rawADToDayCount(y, m, d);
}

export function dayCountToAD(n: number): ADDate {
  if (!Number.isSafeInteger(n)) throw new InvalidFieldError('Day count must be a safe integer');
  return rawDayCountToAD(n);
}

/** Proleptic Gregorian leap-year rule. */
export function isLeapYearAD(year: number): boolean {
  if (!Number.isSafeInteger(year)) throw new InvalidFieldError('AD year must be a safe integer');
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/** Days in an AD month without timezone or Date. */
export function daysInMonthAD(year: number, month: number): number {
  assertADFields(year, month, 1);
  if (month === 2) return isLeapYearAD(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}
