import type { ADDateFields, BSDateFields } from './types.js';
import { assertADDate, assertBSDate, assertCivilDate } from './types.js';
import { InvalidFieldError } from './errors.js';
import {
  AD_MONTHS_EN,
  BS_MONTHS_EN,
  applyNumerals,
  defaultOrdinal,
  formatYear,
  pad,
  scan,
} from './internal/tokens.js';

export interface DisplayLocale {
  readonly months: readonly string[];
  readonly weekdays?: readonly string[];
  readonly weekdaysShort?: readonly string[];
  readonly numerals?: (value: string) => string;
  readonly ordinal?: (day: number) => string;
}

export interface DisplayOptions {
  readonly locale?: DisplayLocale;
  readonly numerals?: 'ascii' | 'devanagari' | ((value: string) => string);
  /** Weekday index 0=Sunday..6=Saturday, required for ddd/dddd tokens. */
  readonly weekday?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

const TOKENS = ['YYYY', 'MMMM', 'dddd', 'ddd', 'YY', 'MM', 'DD', 'do', 'M', 'D'] as const;
type DisplayToken = (typeof TOKENS)[number];


function resolveOptions(
  localeOrOptions: DisplayLocale | DisplayOptions | undefined,
  defaultLocale: DisplayLocale,
): {
  locale: DisplayLocale;
  numerals?: DisplayOptions['numerals'];
  weekday?: DisplayOptions['weekday'];
} {
  if (!localeOrOptions) return { locale: defaultLocale };
  if ('months' in localeOrOptions) return { locale: localeOrOptions };
  return {
    locale: localeOrOptions.locale ?? defaultLocale,
    numerals: localeOrOptions.numerals,
    weekday: localeOrOptions.weekday,
  };
}

function format(
  date: BSDateFields | ADDateFields,
  pattern: string,
  defaultLocale: DisplayLocale,
  localeOrOptions?: DisplayLocale | DisplayOptions,
  calendar: 'bs' | 'ad' | 'either' = 'either',
): string {
  if (calendar === 'bs') assertBSDate(date);
  else if (calendar === 'ad') assertADDate(date);
  else assertCivilDate(date);
  if (typeof pattern !== 'string') throw new InvalidFieldError('format pattern must be a string');

  const { locale, numerals, weekday } = resolveOptions(localeOrOptions, defaultLocale);
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
      case 'do':
        return locale.ordinal ? locale.ordinal(date.day) : defaultOrdinal(date.day);
      case 'ddd': {
        if (weekday === undefined)
          throw new InvalidFieldError('weekday option is required for ddd token');
        const short = locale.weekdaysShort ?? locale.weekdays?.map((w) => w.slice(0, 3));
        if (!short || short.length !== 7)
          throw new InvalidFieldError('locale must provide 7 weekday names for ddd');
        return short[weekday];
      }
      case 'dddd': {
        if (weekday === undefined)
          throw new InvalidFieldError('weekday option is required for dddd token');
        if (!locale.weekdays || locale.weekdays.length !== 7)
          throw new InvalidFieldError('locale must provide 7 weekday names for dddd');
        return locale.weekdays[weekday];
      }
    }
  });
  return applyNumerals(result, numerals, locale);
}

const DEFAULT_BS_LOCALE: DisplayLocale = { months: BS_MONTHS_EN };
const DEFAULT_AD_LOCALE: DisplayLocale = { months: AD_MONTHS_EN };

/**
 * Format a BS date with display tokens: YYYY, YY, M, MM, MMMM, D, DD, do, ddd, dddd.
 * ddd/dddd require the weekday option. Punctuation is literal; use [text] or 'text' to escape.
 */
export function formatBSDisplay(
  date: BSDateFields,
  pattern: string,
  localeOrOptions?: DisplayLocale | DisplayOptions,
): string {
  return format(date, pattern, DEFAULT_BS_LOCALE, localeOrOptions, 'bs');
}

/** Format an AD date with display tokens using Gregorian English month names by default. */
export function formatADDisplay(
  date: ADDateFields,
  pattern: string,
  localeOrOptions?: DisplayLocale | DisplayOptions,
): string {
  return format(date, pattern, DEFAULT_AD_LOCALE, localeOrOptions, 'ad');
}

/** Format either date shape with display tokens and an explicitly supplied locale. */
export function formatDisplayWithLocale(
  date: BSDateFields | ADDateFields,
  pattern: string,
  locale: DisplayLocale,
  options?: Omit<DisplayOptions, 'locale'>,
): string {
  return format(date, pattern, locale, { ...options, locale });
}
