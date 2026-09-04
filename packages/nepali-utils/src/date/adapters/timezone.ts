import { ad } from '../types.js';
import type { ADDate } from '../types.js';
import { InvalidInstantError, InvalidTimeZoneError } from '../errors.js';
import { toInstantDate } from './instant.js';

export type Instant = Date | number | string;

function asDate(value: Instant): Date {
  return toInstantDate(value);
}

/** Project an instant into an AD date using an explicit IANA timezone. */
export function instantToAD(value: Instant, timeZone: string): ADDate {
  if (typeof timeZone !== 'string' || timeZone.length === 0) {
    throw new InvalidTimeZoneError('timeZone must be a non-empty IANA timezone');
  }
  const instant = asDate(value);
  let formatter: Intl.DateTimeFormat;
  try {
    if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
      throw new Error('Intl.DateTimeFormat is unavailable');
    }
    formatter = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  } catch (error) {
    throw new InvalidTimeZoneError(`Invalid IANA timezone: ${timeZone}`, {
      cause: error,
    } as ErrorOptions);
  }

  if (typeof formatter.formatToParts !== 'function') {
    throw new InvalidTimeZoneError('Intl.DateTimeFormat.formatToParts is unavailable');
  }
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = formatter.formatToParts(instant);
  } catch (error) {
    throw new InvalidTimeZoneError('Timezone data is unavailable in this runtime', {
      cause: error,
    });
  }
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = Number(values.get('year'));
  const month = Number(values.get('month'));
  const day = Number(values.get('day'));
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new InvalidInstantError('Timezone adapter could not resolve a civil date');
  }
  return ad(year, month, day);
}

export const dateInTimeZoneToAD = instantToAD;
export const fromInstant = instantToAD;
export const instantToADInTimeZone = instantToAD;
