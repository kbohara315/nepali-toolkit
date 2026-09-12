import { InvalidNumberError } from './errors.js';

export type NumberGrouping = 'nepali' | 'western' | 'none';
export type NumberNumerals = 'ascii' | 'devanagari';

export type NumberFormatOptions = {
  grouping?: NumberGrouping;
  numerals?: NumberNumerals;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  rounding?: 'half-up';
  groupSeparator?: string;
  decimalSeparator?: string;
};

export type ExactDecimal = {
  negative: boolean;
  intDigits: string;
  fracDigits: string;
};

const DEV_ZERO = 0x0966;

function mapDigits(text: string, toDevanagari: boolean): string {
  return toDevanagari
    ? text.replace(/[0-9]/g, (d) => String.fromCharCode(DEV_ZERO + Number(d)))
    : text.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - DEV_ZERO));
}

function fail(detail: string): never {
  throw new InvalidNumberError(`Invalid number: ${detail}`);
}

function unpad(digits: string): string {
  const out = digits.replace(/^0+(?=\d)/, '');
  return out === '' ? '0' : out;
}

/** Shared exact parser for ASCII/Devanagari decimal text. */
function parseDecimalText(trimmed: string): ExactDecimal {
  if (trimmed === '') fail('empty string');
  const ascii = mapDigits(trimmed, false);
  if (/[eE]/.test(ascii)) fail('exponent notation is not supported');
  const match = /^([+-]?)(\d*)(?:\.(\d+))?$/.exec(ascii);
  if (match === null || (match[2] === '' && match[3] === undefined)) {
    fail(`unparseable string ${JSON.stringify(trimmed)}`);
  }
  const found = match as RegExpExecArray;
  return {
    negative: found[1] === '-',
    intDigits: unpad(found[2] === '' ? '0' : found[2]),
    fracDigits: found[3] ?? '',
  };
}

/** Parse any accepted input into an exact sign + digit sequence. */
export function toExactDecimal(value: string | number | bigint): ExactDecimal {
  if (typeof value === 'bigint') {
    const text = value.toString();
    return {
      negative: text.startsWith('-'),
      intDigits: unpad(text.replace(/^-/, '')),
      fracDigits: '',
    };
  }
  return typeof value === 'number'
    ? (Number.isFinite(value) || fail('value must be finite'), parseDecimalText(String(value).trim()))
    : parseDecimalText(value.trim());
}

/** Half-up rounding on the exact digit sequence; never touches binary float. */
function roundHalfUp(intDigits: string, fracDigits: string, max: number): [string, string] {
  if (fracDigits.length <= max) return [intDigits, fracDigits];
  if (fracDigits[max] < '5') return [intDigits, fracDigits.slice(0, max)];
  const bumped = increment(intDigits + fracDigits.slice(0, max));
  const cut = bumped.length - max;
  return [bumped.slice(0, cut), bumped.slice(cut)];
}

function increment(digits: string): string {
  const chars = digits.split('');
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    if (chars[i] === '9') chars[i] = '0';
    else {
      chars[i] = String(Number(chars[i]) + 1);
      return chars.join('');
    }
  }
  return `1${chars.join('')}`;
}

function groupFixed(digits: string, size: number, separator: string): string {
  const parts: string[] = [];
  let rest = digits;
  while (rest.length > size) {
    parts.unshift(rest.slice(-size));
    rest = rest.slice(0, -size);
  }
  parts.unshift(rest);
  return parts.join(separator);
}

function groupInteger(digits: string, grouping: NumberGrouping, separator: string): string {
  if (grouping === 'none' || digits.length <= 3) return digits;
  if (grouping === 'western') return groupFixed(digits, 3, separator);
  // Nepali grouping: rightmost group of 3, then groups of 2.
  // Maintainer note: same digit layout as the CLDR 3,2,2 grouping pattern.
  return `${groupFixed(digits.slice(0, -3), 2, separator)}${separator}${digits.slice(-3)}`;
}

function checkSeparators(groupSeparator: string, decimalSeparator: string): void {
  for (const sep of [groupSeparator, decimalSeparator]) {
    if ([...sep].length !== 1 || /[0-9०-९]/.test(sep)) {
      fail('separators must be single non-digit characters');
    }
  }
  if (groupSeparator === decimalSeparator) fail('separators must be distinct');
}

export function formatExactDecimal(exact: ExactDecimal, options?: NumberFormatOptions): string {
  if (options === undefined) return formatDefaultDecimal(exact);
  const grouping = options?.grouping ?? 'nepali';
  const numerals = options?.numerals ?? 'ascii';
  const min = options?.minimumFractionDigits ?? 0;
  const max = options?.maximumFractionDigits ?? 3;
  const groupSeparator = options?.groupSeparator ?? ',';
  const decimalSeparator = options?.decimalSeparator ?? '.';

  if (grouping !== 'nepali' && grouping !== 'western' && grouping !== 'none') {
    fail(`unsupported grouping ${String(grouping)}`);
  }
  if (numerals !== 'ascii' && numerals !== 'devanagari') fail(`unsupported numerals ${String(numerals)}`);
  if ((options?.rounding ?? 'half-up') !== 'half-up') {
    fail(`unsupported rounding ${String(options?.rounding)}`);
  }
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < 0) {
    fail('fraction digits must be non-negative integers');
  }
  if (min > max) fail('minimum fraction digits exceeds maximum');
  checkSeparators(groupSeparator, decimalSeparator);

  const [roundedInt, roundedFrac] = roundHalfUp(exact.intDigits, exact.fracDigits, max);
  const frac = roundedFrac + '0'.repeat(Math.max(0, min - roundedFrac.length));
  const intPart = groupInteger(roundedInt, grouping, groupSeparator);
  let out = frac === '' ? intPart : `${intPart}${decimalSeparator}${frac}`;
  if (exact.negative && !isZero(roundedInt, frac)) {
    out = `-${out}`;
  }
  return numerals === 'devanagari' ? mapDigits(out, true) : out;
}

function isZero(intDigits: string, frac: string): boolean {
  return /^0*$/.test(intDigits) && /^0*$/.test(frac);
}

function formatDefaultDecimal(exact: ExactDecimal): string {
  const [roundedInt, roundedFrac] = roundHalfUp(exact.intDigits, exact.fracDigits, 3);
  const intPart = groupInteger(roundedInt, 'nepali', ',');
  const out = roundedFrac === '' ? intPart : `${intPart}.${roundedFrac}`;
  return exact.negative && !isZero(roundedInt, roundedFrac) ? `-${out}` : out;
}

export function formatDefaultCurrencyMagnitude(exact: ExactDecimal): string {
  const [roundedInt, roundedFrac] = roundHalfUp(exact.intDigits, exact.fracDigits, 2);
  const frac = roundedFrac + '0'.repeat(2 - roundedFrac.length);
  const out = `${groupInteger(roundedInt, 'nepali', ',')}.${frac}`;
  return mapDigits(out, true);
}

/** Canonical ASCII decimal: no grouping, '.' separator, no '+', minimal zeros. */
export function canonicalizeDecimalText(raw: string): string {
  const parsed = parseDecimalText(raw.trim().replace(/,/g, ''));
  const negative = parsed.negative && !isZero(parsed.intDigits, parsed.fracDigits);
  return `${negative ? '-' : ''}${parsed.intDigits}${parsed.fracDigits === '' ? '' : `.${parsed.fracDigits}`}`;
}
