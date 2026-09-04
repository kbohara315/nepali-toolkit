import { ad } from '../types.js';
import type { ADDate, ADDateFields } from '../types.js';
import { InvalidInstantError } from '../errors.js';

function assertValidDate(value: Date): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new InvalidInstantError('Invalid JavaScript Date');
  }
}

/** Project an instant to its UTC civil date. The host timezone is never consulted. */
export function dateToAD(value: Date): ADDate {
  assertValidDate(value);
  return ad(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
}

export const fromDate = dateToAD;
export const fromUTCDate = dateToAD;
export const fromDateUTC = dateToAD;

/** Construct an instant at UTC midnight for an AD civil date. */
export function adToDate(value: ADDateFields): Date {
  const date = ad(value.year, value.month, value.day);
  const result = new Date(0);
  result.setUTCHours(0, 0, 0, 0);
  result.setUTCFullYear(date.year, date.month - 1, date.day);
  return result;
}

export const toDate = adToDate;
export const toUTCDate = adToDate;
export const toDateUTC = adToDate;
