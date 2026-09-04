import type { ADDateFields, BSDateFields } from './types.js';
import { toAscii, toDevanagari } from '../number/digits.js';
import { InvalidCivilDateError, InvalidFieldError } from './errors.js';

export interface FormatLocale {
  readonly months: readonly string[];
  readonly weekdays?: readonly string[];
  readonly numerals?: (value: string) => string;
}

export interface FormatOptions {
  readonly locale?: FormatLocale;
  readonly numerals?: 'ascii' | 'devanagari' | ((value: string) => string);
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

const TOKENS = ['YYYY', 'MMMM', 'YY', 'MM', 'DD', 'M', 'D'] as const;
type FormatToken = (typeof TOKENS)[number];

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

function findToken(pattern: string, index: number): FormatToken | undefined {
  for (const token of TOKENS) {
    if (pattern.startsWith(token, index)) return token;
  }
  return undefined;
}

function scan(pattern: string, onToken: (token: FormatToken) => string): string {
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
  localeOrOptions: FormatLocale | FormatOptions | undefined,
  defaultLocale: FormatLocale,
): { locale: FormatLocale; numerals?: FormatOptions['numerals'] } {
  if (!localeOrOptions) return { locale: defaultLocale };
  if ('months' in localeOrOptions) return { locale: localeOrOptions };
  return { locale: localeOrOptions.locale ?? defaultLocale, numerals: localeOrOptions.numerals };
}

function applyNumerals(
  value: string,
  numerals: FormatOptions['numerals'],
  locale: FormatLocale,
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
  defaultLocale: FormatLocale,
  localeOrOptions?: FormatLocale | FormatOptions,
): string {
  assertFields(date);
  if (typeof pattern !== 'string') throw new InvalidFieldError('format pattern must be a string');

  const { locale, numerals } = resolveOptions(localeOrOptions, defaultLocale);
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
    }
  });
  return applyNumerals(result, numerals, locale);
}

const DEFAULT_BS_LOCALE: FormatLocale = { months: BS_MONTHS_EN };
const DEFAULT_AD_LOCALE: FormatLocale = { months: AD_MONTHS_EN };

/**
 * Format a BS date. Supported tokens are YYYY, YY, M, MM, MMMM, D, and DD.
 * Punctuation is literal; use [text] or 'text' to escape token letters.
 * For ordinals (do) and weekday names (ddd, dddd), use `miti/format-display`.
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
