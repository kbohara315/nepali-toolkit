import type { BSDateFields, ADDateFields } from '../types.js';
import { assertMonthIndex, assertWeekdayIndex } from '../types.js';
import { InvalidFieldError } from '../errors.js';
import {
  formatAD as formatADValue,
  formatWithLocale,
  formatBS as formatBSValue,
} from '../format.js';

import { AD_MONTHS_EN, BS_MONTHS_EN } from '../internal/tokens.js';

export const months = BS_MONTHS_EN;

export const weekdays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const locale = { months, weekdays } as const;
export const monthNames = months;
export const weekdayNames = weekdays;

export function monthName(month: number): string {
  assertMonthIndex(month);
  return months[month - 1];
}

/** `weekday` follows JavaScript's zero-based Sunday-through-Saturday convention. */
export function weekdayName(weekday: number): string {
  assertWeekdayIndex(weekday);
  return weekdays[weekday];
}

export function formatBS(date: BSDateFields, pattern: string): string {
  return formatBSValue(date, pattern, locale);
}

export function formatAD(date: ADDateFields, pattern: string): string {
  return formatADValue(date, pattern, { locale: { months: AD_MONTHS } });
}

export const AD_MONTHS = AD_MONTHS_EN;

export function format(date: BSDateFields, pattern: string): string {
  return formatWithLocale(date, pattern, locale);
}

export function relativePhrase(days: number): string {
  if (!Number.isInteger(days)) throw new InvalidFieldError('relative day count must be an integer');
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export default locale;

export const en = locale;
