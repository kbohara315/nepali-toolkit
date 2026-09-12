import { adToDayCount, dayCountToAD } from './gregorian.js';
import { bsToOrdinal, ordinalToBS, TOTAL_DAYS } from './patro.js';
import { metadata } from './data.js';
import { InvalidArithmeticAmountError, InvalidFieldError, UnsupportedDateError } from '../errors.js';
import { ad, bs } from '../types.js';
import type { ADDate, ADDateFields, BSDate, BSDateFields } from '../types.js';

// Reference: BS 2000-01-01 <-> AD 1943-04-14.
const refAD = metadata.referencePair.ad;
const BS_EPOCH_DAYCOUNT = adToDayCount(refAD.year, refAD.month, refAD.day);

function assertRecord(
  value: unknown,
  calendar: string,
): asserts value is ADDateFields | BSDateFields {
  if (value === null || typeof value !== 'object') {
    throw new InvalidFieldError(`${calendar} date must contain year, month, and day fields`);
  }
  const fields = value as Record<string, unknown>;
  if (!('year' in fields) || !('month' in fields) || !('day' in fields)) {
    throw new InvalidFieldError(`${calendar} date must contain year, month, and day fields`);
  }
}

function validatedADDay(value: ADDate): number {
  assertRecord(value, 'AD');
  return adToDayCount(value.year, value.month, value.day);
}

function validatedBSOrdinal(value: BSDate): number {
  assertRecord(value, 'BS');
  return bsToOrdinal(value.year, value.month, value.day);
}

export type CivilDay = number;

/** @internal Return the canonical supported civil-day identity for a BS date. */
export function civilDayFromBS(value: BSDate): CivilDay {
  return BS_EPOCH_DAYCOUNT + validatedBSOrdinal(value);
}

/** @internal Return the canonical supported civil-day identity for an AD date. */
export function civilDayFromAD(value: ADDate): CivilDay {
  const day = validatedADDay(value);
  if (day < BS_EPOCH_DAYCOUNT || day >= BS_EPOCH_DAYCOUNT + TOTAL_DAYS) {
    throw new UnsupportedDateError('AD date is outside the supported BS range');
  }
  return day;
}

function assertCivilDay(value: CivilDay): void {
  if (!Number.isSafeInteger(value)) throw new InvalidFieldError('Civil day must be a safe integer');
  if (value < BS_EPOCH_DAYCOUNT || value >= BS_EPOCH_DAYCOUNT + TOTAL_DAYS) {
    throw new UnsupportedDateError('Civil day is outside the supported range');
  }
}

/** @internal Project a canonical civil-day identity into a branded BS date. */
export function civilDayToBS(value: CivilDay): BSDate {
  assertCivilDay(value);
  const result = ordinalToBS(value - BS_EPOCH_DAYCOUNT);
  return bs(result.year, result.month, result.day);
}

/** @internal Project a canonical civil-day identity into a branded AD date. */
export function civilDayToAD(value: CivilDay): ADDate {
  assertCivilDay(value);
  const result = dayCountToAD(value);
  return ad(result.year, result.month, result.day);
}

// This is the deliberate low-level seam for callers that have raw fields but
// have not constructed a nominal brand yet. Public conversion stays branded.
export function toADFields(value: BSDateFields): ADDate {
  return civilDayToAD(civilDayFromBS(value as BSDate));
}

export function toBSFields(value: ADDateFields): BSDate {
  return civilDayToBS(civilDayFromAD(value as ADDate));
}

export function toAD(value: BSDate): ADDate {
  return civilDayToAD(civilDayFromBS(value));
}

export function toBS(value: ADDate): BSDate {
  return civilDayToBS(civilDayFromAD(value));
}

// --- Civil-day identity ops (sole owner; formerly internal/civil-day.ts). ---

function assertCivilDayNumber(day: CivilDay): void {
  if (!Number.isSafeInteger(day)) throw new InvalidFieldError('Civil day must be a safe integer');
}

function assertAmount(amount: number): void {
  if (!Number.isSafeInteger(amount)) {
    throw new InvalidArithmeticAmountError('Arithmetic amounts must be safe integers');
  }
}

export function compareCivilDays(left: CivilDay, right: CivilDay): -1 | 0 | 1 {
  assertCivilDayNumber(left);
  assertCivilDayNumber(right);
  return left < right ? -1 : left > right ? 1 : 0;
}

export function equalCivilDays(left: CivilDay, right: CivilDay): boolean {
  return compareCivilDays(left, right) === 0;
}

export function differenceInCivilDays(left: CivilDay, right: CivilDay): number {
  assertCivilDayNumber(left);
  assertCivilDayNumber(right);
  return left - right;
}

export function addCivilDays(day: CivilDay, amount: number): CivilDay {
  assertCivilDayNumber(day);
  assertAmount(amount);
  const result = day + amount;
  if (!Number.isSafeInteger(result)) {
    throw new UnsupportedDateError('Result is outside the supported range');
  }
  if (result < BS_EPOCH_DAYCOUNT || result >= BS_EPOCH_DAYCOUNT + TOTAL_DAYS) {
    throw new UnsupportedDateError('Civil day is outside the supported range');
  }
  return result;
}

export function addCivilWeeks(day: CivilDay, amount: number): CivilDay {
  assertAmount(amount);
  const days = amount * 7;
  if (!Number.isSafeInteger(days)) {
    throw new InvalidArithmeticAmountError('Week amount produces an unsafe day count');
  }
  return addCivilDays(day, days);
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function weekdayCivilDay(day: CivilDay): Weekday {
  assertCivilDayNumber(day);
  return ((((day + 4) % 7) + 7) % 7) as Weekday;
}

export { ad, bs } from '../types.js';
