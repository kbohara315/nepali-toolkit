import { ad } from '../types.js';
import type { ADDate, ADDateFields } from '../types.js';
import { InvalidCalendarError, InvalidFieldError } from '../errors.js';

export interface PlainDateLike {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly calendarId?: string;
  readonly calendar?: string | { readonly id?: string };
}

export interface TemporalLike {
  readonly PlainDate: {
    new (year: number, month: number, day: number, calendar?: string): PlainDateLike;
    from?: (value: { year: number; month: number; day: number; calendar: string }) => PlainDateLike;
  };
}

function calendarId(value: PlainDateLike): string | undefined {
  if (value.calendarId !== undefined) return value.calendarId;
  if (typeof value.calendar === 'string') return value.calendar;
  return value.calendar?.id;
}

function assertISO(value: PlainDateLike): void {
  if (calendarId(value) !== 'iso8601') {
    throw new InvalidCalendarError('Temporal.PlainDate must use the ISO calendar');
  }
}

/** Convert an ISO-calendar Temporal.PlainDate without interpreting it as an instant. */
export function plainDateToAD(value: PlainDateLike): ADDate {
  if (value === null || typeof value !== 'object')
    throw new InvalidFieldError('plain date is required');
  assertISO(value);
  return ad(value.year, value.month, value.day);
}

export const fromTemporal = plainDateToAD;
export const fromPlainDate = plainDateToAD;
export const fromTemporalPlainDate = plainDateToAD;

function globalTemporal(): TemporalLike {
  const candidate = (globalThis as { Temporal?: TemporalLike }).Temporal;
  if (!candidate || typeof candidate.PlainDate !== 'function') {
    throw new InvalidFieldError('Temporal.PlainDate is not available in this runtime');
  }
  return candidate;
}

/** Convert an AD civil date to Temporal.PlainDate, requiring an available Temporal runtime. */
export function adToPlainDate(
  value: ADDateFields,
  temporal: TemporalLike = globalTemporal(),
): PlainDateLike {
  const date = ad(value.year, value.month, value.day);
  if (typeof temporal.PlainDate.from === 'function') {
    return temporal.PlainDate.from({
      year: date.year,
      month: date.month,
      day: date.day,
      calendar: 'iso8601',
    });
  }
  return new temporal.PlainDate(date.year, date.month, date.day, 'iso8601');
}

export const toTemporal = adToPlainDate;
export const toPlainDate = adToPlainDate;
export const toTemporalPlainDate = adToPlainDate;
