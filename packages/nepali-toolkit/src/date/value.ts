import {
  addCivilDays,
  addCivilWeeks,
  civilDayFromAD,
  civilDayFromBS,
  civilDayToAD,
  civilDayToBS,
  compareCivilDays,
  differenceInCivilDays,
  equalCivilDays,
  weekdayCivilDay,
} from './internal/conversion.js';
import {
  addMonthsAD,
  addMonthsBS,
  addYearsAD,
  addYearsBS,
  daysInMonthAD,
  daysInMonthBS,
} from './arithmetic.js';
import type { MonthArithmeticOptions } from './arithmetic.js';
import type { ADDate, BSDate } from './types.js';
import { ad, bs } from './types.js';
import { InvalidFieldError } from './errors.js';
import type { Weekday } from './arithmetic.js';

function serializeAD(value: ADDate): string {
  const year = String(value.year).padStart(4, '0');
  const month = String(value.month).padStart(2, '0');
  const day = String(value.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Immutable value for one supported BS/AD civil day. */
export class NepaliDate {
  readonly #civilDay: number;

  private constructor(civilDay: number) {
    this.#civilDay = civilDay;
    Object.freeze(this);
  }

  static fromBS(value: BSDate): NepaliDate {
    return new NepaliDate(civilDayFromBS(value));
  }

  static fromAD(value: ADDate): NepaliDate {
    return new NepaliDate(civilDayFromAD(value));
  }

  toBS(): BSDate {
    return civilDayToBS(this.#civilDay);
  }

  toAD(): ADDate {
    return civilDayToAD(this.#civilDay);
  }

  equals(other: NepaliDate): boolean {
    return equalCivilDays(this.#civilDay, other.#civilDay);
  }

  compare(other: NepaliDate): -1 | 0 | 1 {
    return compareCivilDays(this.#civilDay, other.#civilDay);
  }

  addDays(amount: number): NepaliDate {
    return new NepaliDate(addCivilDays(this.#civilDay, amount));
  }

  addWeeks(amount: number): NepaliDate {
    return new NepaliDate(addCivilWeeks(this.#civilDay, amount));
  }

  differenceInDays(other: NepaliDate): number {
    return differenceInCivilDays(this.#civilDay, other.#civilDay);
  }

  weekday(): Weekday {
    return weekdayCivilDay(this.#civilDay);
  }

  clone(): NepaliDate {
    return new NepaliDate(this.#civilDay);
  }

  addMonthsBS(amount: number, options?: MonthArithmeticOptions): NepaliDate {
    return NepaliDate.fromBS(addMonthsBS(this.toBS(), amount, options));
  }

  addYearsBS(amount: number, options?: MonthArithmeticOptions): NepaliDate {
    return NepaliDate.fromBS(addYearsBS(this.toBS(), amount, options));
  }

  addMonthsAD(amount: number, options?: MonthArithmeticOptions): NepaliDate {
    return NepaliDate.fromAD(addMonthsAD(this.toAD(), amount, options));
  }

  addYearsAD(amount: number, options?: MonthArithmeticOptions): NepaliDate {
    return NepaliDate.fromAD(addYearsAD(this.toAD(), amount, options));
  }

  startOfMonthBS(): NepaliDate {
    const current = this.toBS();
    return NepaliDate.fromBS({ ...current, day: 1 } as BSDate);
  }

  endOfMonthBS(): NepaliDate {
    const current = this.toBS();
    return NepaliDate.fromBS({ ...current, day: daysInMonthBS(current) } as BSDate);
  }

  startOfMonthAD(): NepaliDate {
    const current = this.toAD();
    return NepaliDate.fromAD({ ...current, day: 1 } as ADDate);
  }

  endOfMonthAD(): NepaliDate {
    const current = this.toAD();
    return NepaliDate.fromAD({ ...current, day: daysInMonthAD(current) } as ADDate);
  }

  serialize(): string {
    return serializeAD(this.toAD());
  }

  serializeBS(): string {
    const value = this.toBS();
    const pad2 = (n: number): string => String(n).padStart(2, '0');
    return `${String(value.year).padStart(4, '0')}-${pad2(value.month)}-${pad2(value.day)}`;
  }

  static fromISO(value: string): NepaliDate {
    if (typeof value !== 'string') throw new InvalidFieldError('ISO date must be a string');
    const match = /^([+-]?\d{4,})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) throw new InvalidFieldError('ISO date must be YYYY-MM-DD');
    return NepaliDate.fromAD(ad(Number(match[1]), Number(match[2]), Number(match[3])));
  }

  static fromSerial(value: string): NepaliDate {
    return NepaliDate.fromISO(value);
  }

  static fromBSString(value: string): NepaliDate {
    if (typeof value !== 'string') throw new InvalidFieldError('BS serial must be a string');
    const match = /^([+-]?\d{4,})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) throw new InvalidFieldError('BS serial must be YYYY-MM-DD');
    return NepaliDate.fromBS(bs(Number(match[1]), Number(match[2]), Number(match[3])));
  }

  toString(): string {
    return this.serialize();
  }

  toJSON(): string {
    return this.serialize();
  }
}
