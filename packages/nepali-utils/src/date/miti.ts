import {
  addCivilDays,
  addCivilWeeks,
  compareCivilDays,
  differenceInCivilDays,
  equalCivilDays,
  weekdayCivilDay,
} from './internal/civil-day.js';
import { civilDayFromAD, civilDayFromBS, civilDayToAD, civilDayToBS } from './internal/conversion.js';
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
export class Miti {
  readonly #civilDay: number;

  private constructor(civilDay: number) {
    this.#civilDay = civilDay;
    Object.freeze(this);
  }

  static fromBS(value: BSDate): Miti {
    return new Miti(civilDayFromBS(value));
  }

  static fromAD(value: ADDate): Miti {
    return new Miti(civilDayFromAD(value));
  }

  toBS(): BSDate {
    return civilDayToBS(this.#civilDay);
  }

  toAD(): ADDate {
    return civilDayToAD(this.#civilDay);
  }

  equals(other: Miti): boolean {
    return equalCivilDays(this.#civilDay, other.#civilDay);
  }

  compare(other: Miti): -1 | 0 | 1 {
    return compareCivilDays(this.#civilDay, other.#civilDay);
  }

  addDays(amount: number): Miti {
    return new Miti(addCivilDays(this.#civilDay, amount));
  }

  addWeeks(amount: number): Miti {
    return new Miti(addCivilWeeks(this.#civilDay, amount));
  }

  differenceInDays(other: Miti): number {
    return differenceInCivilDays(this.#civilDay, other.#civilDay);
  }

  weekday(): Weekday {
    return weekdayCivilDay(this.#civilDay);
  }

  clone(): Miti {
    return new Miti(this.#civilDay);
  }

  addMonthsBS(amount: number, options?: MonthArithmeticOptions): Miti {
    return Miti.fromBS(addMonthsBS(this.toBS(), amount, options));
  }

  addYearsBS(amount: number, options?: MonthArithmeticOptions): Miti {
    return Miti.fromBS(addYearsBS(this.toBS(), amount, options));
  }

  addMonthsAD(amount: number, options?: MonthArithmeticOptions): Miti {
    return Miti.fromAD(addMonthsAD(this.toAD(), amount, options));
  }

  addYearsAD(amount: number, options?: MonthArithmeticOptions): Miti {
    return Miti.fromAD(addYearsAD(this.toAD(), amount, options));
  }

  startOfMonthBS(): Miti {
    const current = this.toBS();
    return Miti.fromBS({ ...current, day: 1 } as BSDate);
  }

  endOfMonthBS(): Miti {
    const current = this.toBS();
    return Miti.fromBS({ ...current, day: daysInMonthBS(current) } as BSDate);
  }

  startOfMonthAD(): Miti {
    const current = this.toAD();
    return Miti.fromAD({ ...current, day: 1 } as ADDate);
  }

  endOfMonthAD(): Miti {
    const current = this.toAD();
    return Miti.fromAD({ ...current, day: daysInMonthAD(current) } as ADDate);
  }

  serialize(): string {
    return serializeAD(this.toAD());
  }

  serializeBS(): string {
    const value = this.toBS();
    const pad2 = (n: number): string => String(n).padStart(2, '0');
    return `${String(value.year).padStart(4, '0')}-${pad2(value.month)}-${pad2(value.day)}`;
  }

  static fromISO(value: string): Miti {
    if (typeof value !== 'string') throw new InvalidFieldError('ISO date must be a string');
    const match = /^([+-]?\d{4,})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) throw new InvalidFieldError('ISO date must be YYYY-MM-DD');
    return Miti.fromAD(ad(Number(match[1]), Number(match[2]), Number(match[3])));
  }

  static fromSerial(value: string): Miti {
    return Miti.fromISO(value);
  }

  static fromBSString(value: string): Miti {
    if (typeof value !== 'string') throw new InvalidFieldError('BS serial must be a string');
    const match = /^([+-]?\d{4,})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) throw new InvalidFieldError('BS serial must be YYYY-MM-DD');
    return Miti.fromBS(bs(Number(match[1]), Number(match[2]), Number(match[3])));
  }

  toString(): string {
    return this.serialize();
  }

  toJSON(): string {
    return this.serialize();
  }
}
