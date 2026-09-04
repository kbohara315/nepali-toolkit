import type { ADDateFields, BSDateFields } from './types.js';
import { InvalidFieldError } from './errors.js';
import {
  AD_MONTHS_EN,
  BS_MONTHS_EN,
  applyNumerals,
  assertFields,
  formatYear,
  pad,
  scan,
} from './internal/tokens.js';

export interface FormatLocale {
  readonly months: readonly string[];
  readonly weekdays?: readonly string[];
  readonly numerals?: (value: string) => string;
}

export interface FormatOptions {
  readonly locale?: FormatLocale;
  readonly numerals?: 'ascii' | 'devanagari' | ((value: string) => string);
}

const TOKENS = ['YYYY', 'MMMM', 'YY', 'MM', 'DD', 'M', 'D'] as const;
type FormatToken = (typeof TOKENS)[number];


function resolveOptions(
  localeOrOptions: FormatLocale | FormatOptions | undefined,
  defaultLocale: FormatLocale,
): { locale: FormatLocale; numerals?: FormatOptions['numerals'] } {
  if (!localeOrOptions) return { locale: defaultLocale };
  if ('months' in localeOrOptions) return { locale: localeOrOptions };
  return { locale: localeOrOptions.locale ?? defaultLocale, numerals: localeOrOptions.numerals };
}

function format(
  date: BSDateFields | ADDateFields,
  pattern: string,
  defaultLocale: FormatLocale,
  localeOrOptions?: FormatLocale | FormatOptions,
): string {
  assertFields(date);
  if (typeof pattern !== 'string') throw new InvalidFieldError('format pattern must be a string');

  const { locale, numerals } = resolveOptions(localeOrOptions, defaultLocale);
  if (locale.months.length !== 12)
    throw new InvalidFieldError('locale must provide 12 month names');

  const result = scan(pattern, TOKENS, (token) => {
    switch (token) {
      case 'YYYY':
        return formatYear(date.year);
      case 'YY':
        return pad(Math.abs(date.year) % 100, 2);
      case 'M':
        return String(date.month);
      case 'MM':
        return pad(date.month, 2);
      case 'MMMM':
        return locale.months[date.month - 1];
      case 'D':
        return String(date.day);
      case 'DD':
        return pad(date.day, 2);
    }
  });
  return applyNumerals(result, numerals, locale);
}

const DEFAULT_BS_LOCALE: FormatLocale = { months: BS_MONTHS_EN };
const DEFAULT_AD_LOCALE: FormatLocale = { months: AD_MONTHS_EN };

/**
 * Format a BS date. Supported tokens are YYYY, YY, M, MM, MMMM, D, and DD.
 * Punctuation is literal; use [text] or 'text' to escape token letters.
 * For ordinals (do) and weekday names (ddd, dddd), use `nepali-utils/date/format-display`.
 */
export function formatBS(
  date: BSDateFields,
  pattern: string,
  localeOrOptions?: FormatLocale | FormatOptions,
): string {
  return format(date, pattern, DEFAULT_BS_LOCALE, localeOrOptions);
}

/** Format an AD date using Gregorian English month names by default. */
export function formatAD(
  date: ADDateFields,
  pattern: string,
  localeOrOptions?: FormatLocale | FormatOptions,
): string {
  return format(date, pattern, DEFAULT_AD_LOCALE, localeOrOptions);
}

/** Format either date shape with an explicitly supplied month-name locale. */
export function formatWithLocale(
  date: BSDateFields | ADDateFields,
  pattern: string,
  locale: FormatLocale,
  options?: Omit<FormatOptions, 'locale'>,
): string {
  return format(date, pattern, locale, { ...options, locale });
}

export const englishBSLocale: FormatLocale = DEFAULT_BS_LOCALE;
export const englishADLocale: FormatLocale = DEFAULT_AD_LOCALE;
