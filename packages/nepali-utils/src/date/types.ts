import { assertADFields } from './internal/gregorian.js';
import { assertBSFields } from './internal/patro.js';
import { InvalidCivilDateError, InvalidFieldError } from './errors.js';

export interface DateFields {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export type BSDateFields = DateFields;
export type ADDateFields = DateFields;

declare const bsDateBrand: unique symbol;
declare const adDateBrand: unique symbol;

export type BSDate = BSDateFields & { readonly [bsDateBrand]: 'BSDate' };
export type ADDate = ADDateFields & { readonly [adDateBrand]: 'ADDate' };

function makeDate(year: number, month: number, day: number): DateFields {
  return Object.freeze({ year, month, day });
}

/** Construct a validated, nominally branded BS date. */
export function bs(year: number, month: number, day: number): BSDate {
  assertBSFields(year, month, day);
  return makeDate(year, month, day) as BSDate;
}

/** Construct a validated, nominally branded proleptic Gregorian date. */
export function ad(year: number, month: number, day: number): ADDate {
  assertADFields(year, month, day);
  return makeDate(year, month, day) as ADDate;
}

/** Assert a record holds fully valid BS civil fields (shape + Patro membership). */
export function assertBSDate(value: unknown): asserts value is BSDate {
  if (
    value === null ||
    typeof value !== 'object' ||
    !('year' in value) ||
    !('month' in value) ||
    !('day' in value)
  ) {
    throw new InvalidFieldError('BS date must contain year, month, and day fields');
  }
  const f = value as { year: unknown; month: unknown; day: unknown };
  if (
    typeof f.year !== 'number' ||
    typeof f.month !== 'number' ||
    typeof f.day !== 'number'
  ) {
    throw new InvalidFieldError('BS date fields must be integers');
  }
  assertBSFields(f.year, f.month, f.day);
}

/** Assert a record holds fully valid AD civil fields (shape + Gregorian validity). */
export function assertADDate(value: unknown): asserts value is ADDate {
  if (
    value === null ||
    typeof value !== 'object' ||
    !('year' in value) ||
    !('month' in value) ||
    !('day' in value)
  ) {
    throw new InvalidFieldError('AD date must contain year, month, and day fields');
  }
  const f = value as { year: unknown; month: unknown; day: unknown };
  if (
    typeof f.year !== 'number' ||
    typeof f.month !== 'number' ||
    typeof f.day !== 'number'
  ) {
    throw new InvalidFieldError('AD date fields must be integers');
  }
  assertADFields(f.year, f.month, f.day);
}

/**
 * Assert a record is a valid civil date in either calendar.
 * Used by calendar-agnostic format entry points; calendar-specific
 * entry points should prefer assertBSDate / assertADDate.
 */
export function assertCivilDate(value: unknown): asserts value is BSDate | ADDate {
  try {
    assertBSDate(value);
    return;
  } catch (error) {
    if (error instanceof InvalidFieldError) throw error;
  }
  assertADDate(value);
}

/** Validate month index 1..12, throwing InvalidCivilDateError. */
export function assertMonthIndex(month: unknown): asserts month is number {
  if (!Number.isInteger(month) || (month as number) < 1 || (month as number) > 12) {
    throw new InvalidCivilDateError('month must be between 1 and 12');
  }
}

/** Validate weekday index 0..6, throwing InvalidCivilDateError. */
export function assertWeekdayIndex(weekday: unknown): asserts weekday is number {
  if (!Number.isInteger(weekday) || (weekday as number) < 0 || (weekday as number) > 6) {
    throw new InvalidCivilDateError('weekday must be between 0 and 6');
  }
}
