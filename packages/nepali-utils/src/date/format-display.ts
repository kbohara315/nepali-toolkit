import type { ADDateFields, BSDateFields } from './types.js';
import { toAscii, toDevanagari } from '../number/digits.js';
import { InvalidCivilDateError, InvalidFieldError } from './errors.js';

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

const BS_MONTHS_EN = [
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

const AD_MONTHS_EN = [
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

const TOKENS = ['YYYY', 'MMMM', 'dddd', 'ddd', 'YY', 'MM', 'DD', 'do', 'M', 'D'] as const;
type DisplayToken = (typeof TOKENS)[number];

function assertFields(value: BSDateFields | ADDateFields): void {
  if (
    value === null ||
    typeof value !== 'object' ||
    !Number.isInteger(value.year) ||
    !Number.isInteger(value.month) ||
    !Number.isInteger(value.day)
  ) {
    throw new InvalidFieldError('date fields must be integers');
  }
  if (value.month < 1 || value.month > 12) throw new InvalidCivilDateError('month out of range');
  if (value.day < 1 || value.day > 31) throw new InvalidCivilDateError('day out of range');
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0');
}

function formatYear(value: number): string {
  return value < 0 ? `-${pad(Math.abs(value), 4)}` : pad(value, 4);
}

function defaultOrdinal(day: number): string {
  if (day === 1 || day === 21 || day === 31) return `${day}st`;
  if (day === 2 || day === 22) return `${day}nd`;
  if (day === 3 || day === 23) return `${day}rd`;
  return `${day}th`;
}

function findToken(pattern: string, index: number): DisplayToken | undefined {
  for (const token of TOKENS) {
    if (pattern.startsWith(token, index)) return token;
  }
  return undefined;
}

function scan(pattern: string, onToken: (token: DisplayToken) => string): string {
  let output = '';
  for (let index = 0; index < pattern.length;) {
    const character = pattern[index];

    if (character === '[') {
      const end = pattern.indexOf(']', index + 1);
      if (end < 0) throw new SyntaxError('unterminated format literal');
      output += pattern.slice(index + 1, end);
      index = end + 1;
      continue;
    }

    if (character === "'") {
      if (pattern[index + 1] === "'") {
        output += "'";
        index += 2;
        continue;
      }
      const end = pattern.indexOf("'", index + 1);
      if (end < 0) throw new SyntaxError('unterminated quoted format literal');
      output += pattern.slice(index + 1, end);
      index = end + 1;
      continue;
    }

    const token = findToken(pattern, index);
    if (token) {
      output += onToken(token);
      index += token.length;
      continue;
    }

    if (/[A-Za-z]/.test(character)) {
      throw new SyntaxError(`unknown format token starting at ${index}`);
    }
    output += character;
    index += 1;
  }
  return output;
}

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

function applyNumerals(
  value: string,
  numerals: DisplayOptions['numerals'],
  locale: DisplayLocale,
): string {
  const transform =
    typeof numerals === 'function'
      ? numerals
      : numerals === 'devanagari'
        ? toDevanagari
        : numerals === 'ascii'
          ? toAscii
          : locale.numerals;
  return transform ? transform(value) : value;
}

function format(
  date: BSDateFields | ADDateFields,
  pattern: string,
  defaultLocale: DisplayLocale,
  localeOrOptions?: DisplayLocale | DisplayOptions,
): string {
  assertFields(date);
  if (typeof pattern !== 'string') throw new InvalidFieldError('format pattern must be a string');

  const { locale, numerals, weekday } = resolveOptions(localeOrOptions, defaultLocale);
  if (locale.months.length !== 12)
    throw new InvalidFieldError('locale must provide 12 month names');

  const result = scan(pattern, (token) => {
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
  return format(date, pattern, DEFAULT_BS_LOCALE, localeOrOptions);
}

/** Format an AD date with display tokens using Gregorian English month names by default. */
export function formatADDisplay(
  date: ADDateFields,
  pattern: string,
  localeOrOptions?: DisplayLocale | DisplayOptions,
): string {
  return format(date, pattern, DEFAULT_AD_LOCALE, localeOrOptions);
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
