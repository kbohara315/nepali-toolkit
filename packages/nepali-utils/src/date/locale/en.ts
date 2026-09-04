import type { BSDateFields, ADDateFields } from '../types.js';
import {
  formatAD as formatADValue,
  formatWithLocale,
  formatBS as formatBSValue,
} from '../format.js';

export const months = [
  'Baisakh',
  'Jestha',
  'Asar',
  'Shrawan',
  'Bhadra',
  'Aswin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const;

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
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('month must be between 1 and 12');
  }
  return months[month - 1];
}

/** `weekday` follows JavaScript's zero-based Sunday-through-Saturday convention. */
export function weekdayName(weekday: number): string {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new RangeError('weekday must be between 0 and 6');
  }
  return weekdays[weekday];
}

export function formatBS(date: BSDateFields, pattern: string): string {
  return formatBSValue(date, pattern, locale);
}

export function formatAD(date: ADDateFields, pattern: string): string {
  return formatADValue(date, pattern, { locale: { months: AD_MONTHS } });
}

export const AD_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function format(date: BSDateFields, pattern: string): string {
  return formatWithLocale(date, pattern, locale);
}

export function relativePhrase(days: number): string {
  if (!Number.isInteger(days)) throw new TypeError('relative day count must be an integer');
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export default locale;

export const en = locale;
