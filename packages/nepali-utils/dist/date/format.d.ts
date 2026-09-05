import { a as ADDateFields, b as BSDateFields } from '../types-DiHJisXT.js';

interface FormatLocale {
    readonly months: readonly string[];
    readonly weekdays?: readonly string[];
    readonly numerals?: (value: string) => string;
}
interface FormatOptions {
    readonly locale?: FormatLocale;
    readonly numerals?: 'ascii' | 'devanagari' | ((value: string) => string);
}
/**
 * Format a BS date. Supported tokens are YYYY, YY, M, MM, MMMM, D, and DD.
 * Punctuation is literal; use [text] or 'text' to escape token letters.
 * For ordinals (do) and weekday names (ddd, dddd), use `nepali-utils/date/format-display`.
 */
declare function formatBS(date: BSDateFields, pattern: string, localeOrOptions?: FormatLocale | FormatOptions): string;
/** Format an AD date using Gregorian English month names by default. */
declare function formatAD(date: ADDateFields, pattern: string, localeOrOptions?: FormatLocale | FormatOptions): string;
/** Format either date shape with an explicitly supplied month-name locale. */
declare function formatWithLocale(date: BSDateFields | ADDateFields, pattern: string, locale: FormatLocale, options?: Omit<FormatOptions, 'locale'>): string;
declare const englishBSLocale: FormatLocale;
declare const englishADLocale: FormatLocale;

export { type FormatLocale, type FormatOptions, englishADLocale, englishBSLocale, formatAD, formatBS, formatWithLocale };
