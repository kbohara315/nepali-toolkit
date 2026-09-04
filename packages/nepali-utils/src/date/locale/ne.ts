import type { BSDateFields, ADDateFields } from '../types.js';
import {
  formatAD as formatADValue,
  formatWithLocale,
  formatBS as formatBSValue,
} from '../format.js';
import { toDevanagari } from '../../number/digits.js';

export const months = [
  'बैशाख',
  'जेठ',
  'असार',
  'श्रावण',
  'भाद्र',
  'आश्विन',
  'कार्तिक',
  'मंसिर',
  'पौष',
  'माघ',
  'फाल्गुण',
  'चैत्र',
] as const;

export const weekdays = [
  'आइतबार',
  'सोमबार',
  'मंगलबार',
  'बुधबार',
  'बिहिबार',
  'शुक्रबार',
  'शनिबार',
] as const;

export const locale = { months, weekdays, numerals: toDevanagari } as const;
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
  return formatADValue(date, pattern, { locale: { months: AD_MONTHS }, numerals: 'devanagari' });
}

export const AD_MONTHS = [
  'जनवरी',
  'फेब्रुअरी',
  'मार्च',
  'अप्रिल',
  'मे',
  'जुन',
  'जुलाई',
  'अगस्ट',
  'सेप्टेम्बर',
  'अक्टोबर',
  'नोभेम्बर',
  'डिसेम्बर',
] as const;

export function format(date: BSDateFields, pattern: string): string {
  return formatWithLocale(date, pattern, locale);
}

export function relativePhrase(days: number): string {
  if (!Number.isInteger(days)) throw new TypeError('relative day count must be an integer');
  if (days === 0) return 'आज';
  if (days === 1) return 'भोलि';
  if (days === -1) return 'हिजो';
  if (days > 0) return `${toDevanagari(days)} दिनमा`;
  return `${toDevanagari(Math.abs(days))} दिन अघि`;
}

export default locale;

export const ne = locale;
