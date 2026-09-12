import { canonicalizeDecimalText, formatExactDecimal, toExactDecimal } from './grouping.js';
import type { NumberFormatOptions } from './grouping.js';
import { InvalidNumberError } from './errors.js';

export { toAscii, toDevanagari } from './digits.js';
export type { NumeralInput } from './digits.js';
export { InvalidNumberError } from './errors.js';
export type { NumberFormatOptions, NumberGrouping, NumberNumerals } from './grouping.js';

/** Format a number with deterministic Nepali grouping (lakh/crore). */
export function formatNumber(
  value: string | number | bigint,
  options?: NumberFormatOptions,
): string {
  if (typeof value === 'bigint') {
    // Absent options mean "integer, no fractions" — only an explicitly
    // requested nonzero fraction digit count is a caller error.
    if (
      (options?.minimumFractionDigits ?? 0) !== 0 ||
      (options?.maximumFractionDigits ?? 0) !== 0
    ) {
      throw new InvalidNumberError(
        'Bigint values are integers; fraction digits must be zero',
      );
    }
    return formatExactDecimal(toExactDecimal(value), {
      ...options,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return formatExactDecimal(toExactDecimal(value), options);
}

/**
 * Parse an ASCII/Devanagari decimal string with either separator style into
 * its canonical ASCII decimal form.
 */
export function parseNumber(value: string): string {
  if (typeof value !== 'string') {
    throw new InvalidNumberError('parseNumber expects a string');
  }
  return canonicalizeDecimalText(value);
}
