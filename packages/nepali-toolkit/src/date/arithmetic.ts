import { ad, bs } from './types.js';
import type { ADDate, BSDate } from './types.js';
import { civilDayFromAD, civilDayFromBS } from './internal/conversion.js';
import {
  addCivilDays,
  addCivilWeeks,
  compareCivilDays,
  civilDayToAD,
  civilDayToBS,
  differenceInCivilDays,
  weekdayCivilDay,
} from './internal/conversion.js';
import {
  InvalidArithmeticAmountError,
  InvalidCivilDateError,
  InvalidFieldError,
} from './errors.js';
import { monthLength, BS_START_YEAR, BS_END_YEAR } from './internal/patro.js';
import { daysInMonthAD as gregorianDaysInMonth, isLeapYearAD } from './internal/gregorian.js';

export { isLeapYearAD };

export type MonthOverflow = 'constrain' | 'reject';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface MonthArithmeticOptions {
  readonly overflow?: MonthOverflow;
}

function assertAmount(amount: number): void {
  if (!Number.isSafeInteger(amount)) {
    throw new InvalidArithmeticAmountError('Arithmetic amounts must be safe integers');
  }
}

export function compareAD(left: ADDate, right: ADDate): -1 | 0 | 1 {
  return compareCivilDays(civilDayFromAD(left), civilDayFromAD(right));
}

export function equalAD(left: ADDate, right: ADDate): boolean {
  return compareAD(left, right) === 0;
}

export function differenceInDaysAD(left: ADDate, right: ADDate): number {
  return differenceInCivilDays(civilDayFromAD(left), civilDayFromAD(right));
}

export function addDaysAD(value: ADDate, amount: number): ADDate {
  return civilDayToAD(addCivilDays(civilDayFromAD(value), amount));
}

export function addWeeksAD(value: ADDate, amount: number): ADDate {
  return civilDayToAD(addCivilWeeks(civilDayFromAD(value), amount));
}

export function weekdayAD(value: ADDate): Weekday {
  return weekdayCivilDay(civilDayFromAD(value));
}

export function compareBS(left: BSDate, right: BSDate): -1 | 0 | 1 {
  return compareCivilDays(civilDayFromBS(left), civilDayFromBS(right));
}

export function equalBS(left: BSDate, right: BSDate): boolean {
  return compareBS(left, right) === 0;
}

export function differenceInDaysBS(left: BSDate, right: BSDate): number {
  return differenceInCivilDays(civilDayFromBS(left), civilDayFromBS(right));
}

export function addDaysBS(value: BSDate, amount: number): BSDate {
  return civilDayToBS(addCivilDays(civilDayFromBS(value), amount));
}

export function addWeeksBS(value: BSDate, amount: number): BSDate {
  return civilDayToBS(addCivilWeeks(civilDayFromBS(value), amount));
}

export function weekdayBS(value: BSDate): Weekday {
  return weekdayCivilDay(civilDayFromBS(value));
}

function overflowMode(options?: MonthArithmeticOptions): MonthOverflow {
  const mode = options?.overflow ?? 'constrain';
  if (mode !== 'constrain' && mode !== 'reject') {
    throw new InvalidFieldError('overflow must be "constrain" or "reject"');
  }
  return mode;
}

function assertMonthAmount(amount: number): void {
  assertAmount(amount);
}

/** Add calendar months in BS, constraining the day by default. */
export function addMonthsBS(
  value: BSDate,
  amount: number,
  options?: MonthArithmeticOptions,
): BSDate {
  assertMonthAmount(amount);
  const mode = overflowMode(options);
  const start = bs(value.year, value.month, value.day);
  const monthIndex = start.year * 12 + start.month - 1 + amount;
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex - year * 12 + 1;
  const lastDay = monthLength(year, month);
  if (start.day > lastDay && mode === 'reject') {
    throw new InvalidCivilDateError('BS month arithmetic overflowed the target month');
  }
  return bs(year, month, Math.min(start.day, lastDay));
}

/** Add calendar years in BS, constraining the day by default. */
export function addYearsBS(
  value: BSDate,
  amount: number,
  options?: MonthArithmeticOptions,
): BSDate {
  assertMonthAmount(amount);
  const mode = overflowMode(options);
  const start = bs(value.year, value.month, value.day);
  const year = start.year + amount;
  const lastDay = monthLength(year, start.month);
  if (start.day > lastDay && mode === 'reject') {
    throw new InvalidCivilDateError('BS year arithmetic overflowed the target month');
  }
  return bs(year, start.month, Math.min(start.day, lastDay));
}

export const addBSMonths = addMonthsBS;
export const addBSYears = addYearsBS;

/** Days in a BS month; range-checked. */
export function daysInMonthBS(value: BSDate): number {
  return monthLength(value.year, value.month);
}

/** Days in an AD month. */
export function daysInMonthAD(value: ADDate): number {
  return gregorianDaysInMonth(value.year, value.month);
}

/** Total days in a BS year. */
export function daysInYearBS(year: number): number {
  if (!Number.isSafeInteger(year)) throw new InvalidFieldError('BS year must be a safe integer');
  if (year < BS_START_YEAR || year > BS_END_YEAR) {
    throw new InvalidCivilDateError('BS year is outside the supported range');
  }
  let total = 0;
  for (let m = 1; m <= 12; m++) total += monthLength(year, m);
  return total;
}

function isValidBSFields(year: number, month: number, day: number): boolean {
  try {
    bs(year, month, day);
    return true;
  } catch {
    return false;
  }
}

function isValidADFields(year: number, month: number, day: number): boolean {
  try {
    ad(year, month, day);
    return true;
  } catch {
    return false;
  }
}

/** Non-throwing BS validation for form use. */
export function isValidBS(year: number, month: number, day: number): boolean {
  return isValidBSFields(year, month, day);
}

/** Non-throwing AD validation for form use. */
export function isValidAD(year: number, month: number, day: number): boolean {
  return isValidADFields(year, month, day);
}

/** Add calendar months in AD with constrain|reject overflow. */
export function addMonthsAD(
  value: ADDate,
  amount: number,
  options?: MonthArithmeticOptions,
): ADDate {
  assertMonthAmount(amount);
  const mode = overflowMode(options);
  const monthIndex = value.year * 12 + value.month - 1 + amount;
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex - year * 12 + 1;
  const lastDay = adMonthLength(year, month);
  if (value.day > lastDay && mode === 'reject') {
    throw new InvalidCivilDateError('AD month arithmetic overflowed the target month');
  }
  return ad(year, month, Math.min(value.day, lastDay));
}

function adMonthLength(year: number, month: number): number {
  return gregorianDaysInMonth(year, month);
}

/** Add calendar years in AD with constrain|reject overflow. */
export function addYearsAD(
  value: ADDate,
  amount: number,
  options?: MonthArithmeticOptions,
): ADDate {
  assertMonthAmount(amount);
  const mode = overflowMode(options);
  const year = value.year + amount;
  const lastDay = adMonthLength(year, value.month);
  if (value.day > lastDay && mode === 'reject') {
    throw new InvalidCivilDateError('AD year arithmetic overflowed the target month');
  }
  return ad(year, value.month, Math.min(value.day, lastDay));
}

export const addADMonths = addMonthsAD;
export const addADYears = addYearsAD;

function monthsBetweenBS(left: BSDate, right: BSDate): number {
  return right.year * 12 + right.month - 1 - (left.year * 12 + left.month - 1);
}

/** Whole BS calendar months between left and right, truncated toward zero. */
export function differenceInMonthsBS(left: BSDate, right: BSDate): number {
  const whole = monthsBetweenBS(left, right);
  if (whole === 0) return 0;
  const anchor = addMonthsBS(left, whole);
  const overshoot = whole > 0 ? compareBS(anchor, right) > 0 : compareBS(anchor, right) < 0;
  return overshoot ? whole - Math.sign(whole) : whole;
}

/** Whole AD calendar months between left and right, truncated toward zero. */
export function differenceInMonthsAD(left: ADDate, right: ADDate): number {
  const whole = right.year * 12 + right.month - 1 - (left.year * 12 + left.month - 1);
  if (whole === 0) return 0;
  const anchor = addMonthsAD(left, whole);
  const overshoot = whole > 0 ? compareAD(anchor, right) > 0 : compareAD(anchor, right) < 0;
  return overshoot ? whole - Math.sign(whole) : whole;
}

/** Whole BS calendar years between left and right. */
export function differenceInYearsBS(left: BSDate, right: BSDate): number {
  const months = differenceInMonthsBS(left, right);
  return Math.trunc(months / 12);
}

/** Whole AD calendar years between left and right. */
export function differenceInYearsAD(left: ADDate, right: ADDate): number {
  const months = differenceInMonthsAD(left, right);
  return Math.trunc(months / 12);
}

export interface Age {
  readonly years: number;
  readonly months: number;
  readonly days: number;
}

function ageOnBS(birth: BSDate, on: BSDate): Age {
  if (compareBS(on, birth) < 0) throw new InvalidCivilDateError('Reference date is before birth');
  let years = on.year - birth.year;
  let anchor = addYearsBS(birth, years);
  if (compareBS(anchor, on) > 0) {
    years -= 1;
    anchor = addYearsBS(birth, years);
  }
  let months = (on.year - anchor.year) * 12 + (on.month - anchor.month);
  let monthAnchor = addMonthsBS(anchor, months);
  if (compareBS(monthAnchor, on) > 0) {
    months -= 1;
    monthAnchor = addMonthsBS(anchor, months);
  }
  return { years, months, days: differenceInDaysBS(monthAnchor, on) };
}

function ageOnAD(birth: ADDate, on: ADDate): Age {
  if (compareAD(on, birth) < 0) throw new InvalidCivilDateError('Reference date is before birth');
  let years = on.year - birth.year;
  let anchor = addYearsAD(birth, years);
  if (compareAD(anchor, on) > 0) {
    years -= 1;
    anchor = addYearsAD(birth, years);
  }
  let months = (on.year - anchor.year) * 12 + (on.month - anchor.month);
  let monthAnchor = addMonthsAD(anchor, months);
  if (compareAD(monthAnchor, on) > 0) {
    months -= 1;
    monthAnchor = addMonthsAD(anchor, months);
  }
  return { years, months, days: differenceInDaysAD(monthAnchor, on) };
}

export { ageOnBS, ageOnAD };

/** Iterate inclusive BS dates in civil-day order. */
export function* iterateBS(start: BSDate, end: BSDate): Generator<BSDate> {
  let current = civilDayFromBS(start);
  const finish = civilDayFromBS(end);
  if (current > finish) return;
  while (current <= finish) {
    yield civilDayToBS(current);
    current = addCivilDays(current, 1);
  }
}

/** Iterate inclusive AD dates in civil-day order. */
export function* iterateAD(start: ADDate, end: ADDate): Generator<ADDate> {
  let current = civilDayFromAD(start);
  const finish = civilDayFromAD(end);
  if (current > finish) return;
  while (current <= finish) {
    yield civilDayToAD(current);
    current = addCivilDays(current, 1);
  }
}

// The unqualified functional API is AD-explicit by its type. BS callers can use
// the calendar-explicit variants above; brands have no runtime calendar tag.
export const compare = compareAD;
export const equal = equalAD;
export const differenceInDays = differenceInDaysAD;
export const addDays = addDaysAD;
export const addWeeks = addWeeksAD;
export const weekday = weekdayAD;

export { ad, bs };
export type { ADDate, BSDate } from './types.js';
export { InvalidArithmeticAmountError } from './errors.js';
