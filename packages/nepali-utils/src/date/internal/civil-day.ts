import { civilDayToAD, civilDayToBS, type CivilDay } from './conversion.js';
import { InvalidArithmeticAmountError, InvalidFieldError, UnsupportedDateError } from '../errors.js';

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
  civilDayToAD(result);
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

export { civilDayToAD, civilDayToBS };
export type { CivilDay } from './conversion.js';
