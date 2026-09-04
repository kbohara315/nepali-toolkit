import { toAscii, toDevanagari } from '../../number/digits.js';
import { InvalidCivilDateError, InvalidFieldError } from '../errors.js';
import type { ADDateFields, BSDateFields } from '../types.js';

export const BS_MONTHS_EN = [
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

export const AD_MONTHS_EN = [
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

export function assertFields(value: BSDateFields | ADDateFields): void {
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

export function pad(value: number, width: number): string {
  return String(value).padStart(width, '0');
}

export function formatYear(value: number): string {
  return value < 0 ? `-${pad(Math.abs(value), 4)}` : pad(value, 4);
}

export function findToken<T extends string>(
  tokens: readonly T[],
  pattern: string,
  index: number,
): T | undefined {
  for (const token of tokens) {
    if (pattern.startsWith(token, index)) return token;
  }
  return undefined;
}

export function scan<T extends string>(
  pattern: string,
  tokens: readonly T[],
  onToken: (token: T) => string,
): string {
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

    const token = findToken(tokens, pattern, index);
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

export interface NumeralsLocale {
  readonly numerals?: (value: string) => string;
}

export type NumeralsOption = 'ascii' | 'devanagari' | ((value: string) => string);

export function applyNumerals(
  value: string,
  numerals: NumeralsOption | undefined,
  locale: NumeralsLocale,
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

export function defaultOrdinal(day: number): string {
  if (day === 1 || day === 21 || day === 31) return `${day}st`;
  if (day === 2 || day === 22) return `${day}nd`;
  if (day === 3 || day === 23) return `${day}rd`;
  return `${day}th`;
}
