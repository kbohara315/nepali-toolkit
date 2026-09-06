import { ad, bs } from './types.js';
import type { ADDate, BSDate } from './types.js';
import { ParseError } from './errors.js';
import { toAscii } from '../number/digits.js';
import type { FormatLocale } from './format.js';
import { AD_MONTHS_EN, BS_MONTHS_EN, findToken } from './internal/tokens.js';

export interface ParseOptions {
  readonly pattern?: string;
  readonly separator?: string;
  readonly allowDevanagari?: boolean;
  readonly numerals?: 'ascii' | 'devanagari' | 'both';
  readonly locale?: Pick<FormatLocale, 'months'>;
  /** Century base used to expand a YY token. Defaults to 2000. */
  readonly yearBase?: number;
}

type DateToken = 'YYYY' | 'YY' | 'M' | 'MM' | 'MMMM' | 'D' | 'DD' | 'do';
const TOKENS: readonly DateToken[] = ['YYYY', 'MMMM', 'YY', 'MM', 'DD', 'do', 'M', 'D'];

interface Capture {
  readonly token: DateToken;
  readonly values?: readonly string[];
}

type CompiledPattern = { expression: RegExp; captures: readonly Capture[] };
const patternCache = new WeakMap<readonly string[], Map<string, CompiledPattern>>();
const PATTERN_CACHE_LIMIT = 32;

function parseFailure(message: string): never {
  throw new ParseError(message);
}

function regexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tokenAt(pattern: string, index: number): DateToken | undefined {
  return findToken(TOKENS, pattern, index);
}

function compilePattern(
  pattern: string,
  months: readonly string[],
): CompiledPattern {
  let cache = patternCache.get(months);
  if (!cache) {
    cache = new Map();
    patternCache.set(months, cache);
  }
  const cached = cache.get(pattern);
  if (cached) return cached;
  let expression = '^';
  const captures: Capture[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < pattern.length;) {
    const character = pattern[index];
    if (character === '[') {
      const end = pattern.indexOf(']', index + 1);
      if (end < 0) parseFailure('unterminated format literal');
      expression += regexLiteral(pattern.slice(index + 1, end));
      index = end + 1;
      continue;
    }
    if (character === "'") {
      if (pattern[index + 1] === "'") {
        expression += "'";
        index += 2;
        continue;
      }
      const end = pattern.indexOf("'", index + 1);
      if (end < 0) parseFailure('unterminated quoted format literal');
      expression += regexLiteral(pattern.slice(index + 1, end));
      index = end + 1;
      continue;
    }

    const token = tokenAt(pattern, index);
    if (token) {
      const field =
        token === 'MMMM' || token === 'M' || token === 'MM'
          ? 'month'
          : token === 'YYYY' || token === 'YY'
            ? 'year'
            : 'day';
      if (seen.has(field)) parseFailure(`duplicate ${field} token`);
      seen.add(field);
      captures.push({ token, values: token === 'MMMM' ? months : undefined });
      switch (token) {
        case 'YYYY':
          expression += '([+-]?[0-9]{4,})';
          break;
        case 'YY':
          expression += '([0-9]{2})';
          break;
        case 'do':
          expression += '([0-9]{1,2}(?:st|nd|rd|th))';
          break;
        case 'M':
        case 'D':
          expression += '([0-9]{1,2})';
          break;
        case 'MM':
        case 'DD':
          expression += '([0-9]{2})';
          break;
        case 'MMMM':
          expression += `(${months.map(regexLiteral).join('|')})`;
          break;
      }
      index += token.length;
      continue;
    }

    if (/[A-Za-z]/.test(character)) parseFailure(`unknown format token starting at ${index}`);
    expression += regexLiteral(character);
    index += 1;
  }
  expression += '$';
  const compiled = { expression: new RegExp(expression, 'u'), captures };
  if (cache.size >= PATTERN_CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  cache.set(pattern, compiled);
  return compiled;
}

function normalizeInput(input: string, options: ParseOptions): string {
  if (typeof input !== 'string') parseFailure('input must be a string');
  const policy = options.numerals ?? (options.allowDevanagari ? 'both' : 'ascii');
  const hasAscii = /[0-9]/.test(input);
  const hasDevanagari = /[\u0966-\u096f]/.test(input);
  if (policy === 'ascii' && hasDevanagari) parseFailure('Devanagari numerals are not enabled');
  if (policy === 'devanagari' && hasAscii) parseFailure('ASCII numerals are not enabled');
  return hasDevanagari ? toAscii(input) : input;
}

function resolvePattern(options: ParseOptions): string {
  if (options.pattern !== undefined) return options.pattern;
  const separator = options.separator ?? '-';
  if (typeof separator !== 'string' || separator.length === 0) {
    parseFailure('separator must be a non-empty string');
  }
  return `YYYY${separator}MM${separator}DD`;
}

function canUseDefaultBSFastPath(options: ParseOptions): boolean {
  return (
    options.pattern === undefined &&
    options.separator === undefined &&
    options.allowDevanagari !== true &&
    options.numerals === undefined &&
    options.locale === undefined
  );
}

function parseDefaultBS(input: string, options: ParseOptions): BSDate {
  if (typeof input !== 'string') parseFailure('input must be a string');
  if (
    input.length !== 10 ||
    input[4] !== '-' ||
    input[7] !== '-' ||
    input.charCodeAt(0) < 48 ||
    input.charCodeAt(0) > 57 ||
    input.charCodeAt(1) < 48 ||
    input.charCodeAt(1) > 57 ||
    input.charCodeAt(2) < 48 ||
    input.charCodeAt(2) > 57 ||
    input.charCodeAt(3) < 48 ||
    input.charCodeAt(3) > 57 ||
    input.charCodeAt(5) < 48 ||
    input.charCodeAt(5) > 57 ||
    input.charCodeAt(6) < 48 ||
    input.charCodeAt(6) > 57 ||
    input.charCodeAt(8) < 48 ||
    input.charCodeAt(8) > 57 ||
    input.charCodeAt(9) < 48 ||
    input.charCodeAt(9) > 57
  ) {
    parseFailure('input does not match the date pattern');
  }
  const year = Number(input.slice(0, 4));
  const month = Number(input.slice(5, 7));
  const day = Number(input.slice(8, 10));
  return bs(year, month, day);
}

function parseDate<T extends ADDate | BSDate>(
  input: string,
  options: ParseOptions,
  months: readonly string[],
  construct: (year: number, month: number, day: number) => T,
): T {
  const pattern = resolvePattern(options);
  if (typeof pattern !== 'string' || pattern.length === 0)
    parseFailure('pattern must be a non-empty string');
  const normalized = normalizeInput(input, options);
  const compiled = compilePattern(pattern, options.locale?.months ?? months);
  const match = compiled.expression.exec(normalized);
  // `$` can match before a final line terminator in JavaScript; compare the
  // complete match as well so parsing never accepts a suffix accidentally.
  if (!match || match[0] !== normalized) parseFailure('input does not match the date pattern');

  let year: number | undefined;
  let month: number | undefined;
  let day: number | undefined;
  let captureIndex = 1;
  for (const capture of compiled.captures) {
    const value = match[captureIndex++];
    if (capture.token === 'MMMM') {
      month = (capture.values as readonly string[]).indexOf(value) + 1;
    } else if (capture.token === 'do') {
      day = Number(value.replace(/(st|nd|rd|th)$/, ''));
    } else if (capture.token === 'YYYY') {
      year = Number(value);
    } else if (capture.token === 'YY') {
      const base = options.yearBase ?? 2000;
      if (!Number.isInteger(base)) parseFailure('yearBase must be an integer');
      year = base - (base % 100) + Number(value);
    } else if (capture.token === 'M' || capture.token === 'MM') {
      month = Number(value);
    } else {
      day = Number(value);
    }
  }
  if (year === undefined || month === undefined || day === undefined) {
    parseFailure('pattern must contain one year, month, and day token');
  }
  return construct(year, month, day);
}

export function parseBS(input: string, options?: ParseOptions): BSDate;
export function parseBS(
  input: string,
  pattern: string,
  options?: Omit<ParseOptions, 'pattern'>,
): BSDate;
export function parseBS(
  input: string,
  optionsOrPattern: ParseOptions | string = {},
  extraOptions: Omit<ParseOptions, 'pattern'> = {},
): BSDate {
  const options =
    typeof optionsOrPattern === 'string'
      ? { ...extraOptions, pattern: optionsOrPattern }
      : optionsOrPattern;
  if (typeof optionsOrPattern !== 'string' && canUseDefaultBSFastPath(options)) {
    return parseDefaultBS(input, options);
  }
  return parseDate(input, options, options.locale?.months ?? BS_MONTHS_EN, bs);
}

export function parseAD(input: string, options?: ParseOptions): ADDate;
export function parseAD(
  input: string,
  pattern: string,
  options?: Omit<ParseOptions, 'pattern'>,
): ADDate;
export function parseAD(
  input: string,
  optionsOrPattern: ParseOptions | string = {},
  extraOptions: Omit<ParseOptions, 'pattern'> = {},
): ADDate {
  const options =
    typeof optionsOrPattern === 'string'
      ? { ...extraOptions, pattern: optionsOrPattern }
      : optionsOrPattern;
  return parseDate(input, options, options.locale?.months ?? AD_MONTHS_EN, ad);
}
