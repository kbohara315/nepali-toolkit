import {
  formatDefaultCurrencyMagnitude,
  formatExactDecimal,
  toExactDecimal,
} from '../number/grouping.js';
import { InvalidCurrencyError } from './errors.js';

export type NPRSymbol = 'रु' | 'रू' | 'नेरू' | 'NPR';
export type NPRPlacement = 'before' | 'after';
export type NPRSpacing = 'none' | 'space' | 'nbsp';

export type NPRFormatOptions = {
  symbol?: NPRSymbol;
  placement?: NPRPlacement;
  spacing?: NPRSpacing;
  numerals?: 'ascii' | 'devanagari';
  grouping?: 'nepali' | 'western' | 'none';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  negative?: 'minus' | 'parentheses';
};

const SYMBOLS: readonly NPRSymbol[] = ['रु', 'रू', 'नेरू', 'NPR'];

function fail(detail: string): never {
  throw new InvalidCurrencyError(`Invalid currency: ${detail}`);
}

function checkOptions(options?: NPRFormatOptions): {
  symbol: NPRSymbol;
  placement: NPRPlacement;
  spacing: NPRSpacing;
  numerals: 'ascii' | 'devanagari';
  grouping: 'nepali' | 'western' | 'none';
  negative: 'minus' | 'parentheses';
} {
  const symbol = options?.symbol ?? 'रु';
  const placement = options?.placement ?? 'before';
  const spacing = options?.spacing ?? 'space';
  const numerals = options?.numerals ?? 'devanagari';
  const grouping = options?.grouping ?? 'nepali';
  const negative = options?.negative ?? 'minus';
  if (!SYMBOLS.includes(symbol)) fail(`unsupported symbol ${String(symbol)}`);
  if (placement !== 'before' && placement !== 'after') fail(`unsupported placement ${String(placement)}`);
  if (spacing !== 'none' && spacing !== 'space' && spacing !== 'nbsp') {
    fail(`unsupported spacing ${String(spacing)}`);
  }
  if (numerals !== 'ascii' && numerals !== 'devanagari') fail(`unsupported numerals ${String(numerals)}`);
  if (grouping !== 'nepali' && grouping !== 'western' && grouping !== 'none') {
    fail(`unsupported grouping ${String(grouping)}`);
  }
  if (negative !== 'minus' && negative !== 'parentheses') fail(`unsupported negative ${String(negative)}`);
  return { symbol, placement, spacing, numerals, grouping, negative };
}

function checkFractions(
  options: NPRFormatOptions | undefined,
  forced: boolean,
): { minimumFractionDigits: number; maximumFractionDigits: number } {
  const minimumFractionDigits = options?.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options?.maximumFractionDigits ?? 2;
  if (
    !Number.isInteger(minimumFractionDigits) ||
    !Number.isInteger(maximumFractionDigits) ||
    minimumFractionDigits < 0 ||
    maximumFractionDigits < 0
  ) {
    fail('fraction digits must be non-negative integers');
  }
  if (minimumFractionDigits > maximumFractionDigits) {
    fail('minimum fraction digits exceeds maximum');
  }
  return forced
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { minimumFractionDigits, maximumFractionDigits };
}

function isZeroMagnitude(magnitude: string): boolean {
  const ascii = magnitude.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966));
  return /^0*(?:[.,]0*)?$/.test(ascii);
}
function spacingText(spacing: NPRSpacing): string {
  return spacing === 'none' ? '' : spacing === 'nbsp' ? ' ' : ' ';
}

function compose(
  magnitude: string,
  symbol: string,
  placement: NPRPlacement,
  spacing: NPRSpacing,
  negative: boolean,
  style: 'minus' | 'parentheses',
): string {
  const sep = spacingText(spacing);
  const body = placement === 'before' ? `${symbol}${sep}${magnitude}` : `${magnitude}${sep}${symbol}`;
  if (!negative) return body;
  return style === 'parentheses' ? `(${body})` : `-${body}`;
}

/**
 * Format a rupee amount in NPR with deterministic Nepali grouping.
 * Plain `number` inputs follow the number engine's decimal rendering of the
 * binary float value, so they are approximate past float precision; exact
 * callers pass strings or use `formatNPRMinorUnits`.
 */
export function formatNPR(value: string | number | bigint, options?: NPRFormatOptions): string {
  if (options === undefined) {
    const exact = toExactDecimal(value);
    const magnitude = formatDefaultCurrencyMagnitude(exact);
    return compose(magnitude, 'रु', 'before', 'space', exact.negative && !isZeroMagnitude(magnitude), 'minus');
  }
  const checked = checkOptions(options);
  const fractions = checkFractions(options, false);
  const exact = toExactDecimal(value);
  const magnitude = formatExactDecimal(
    { negative: false, intDigits: exact.intDigits, fracDigits: exact.fracDigits },
    {
      grouping: checked.grouping,
      numerals: checked.numerals,
      minimumFractionDigits: fractions.minimumFractionDigits,
      maximumFractionDigits: fractions.maximumFractionDigits,
      groupSeparator: ',',
      decimalSeparator: '.',
    },
  );
  return compose(magnitude, checked.symbol, checked.placement, checked.spacing, exact.negative && !isZeroMagnitude(magnitude), checked.negative);
}

/**
 * Format an exact integer paisa amount as rupees.paisa with 2 fraction
 * digits forced. The paisa → rupees conversion is a decimal string shift,
 * never binary division. Negative bigint = negative amount.
 */
export function formatNPRMinorUnits(paisa: bigint, options?: NPRFormatOptions): string {
  if (typeof paisa !== 'bigint') {
    fail('paisa must be a bigint');
  }
  const checked = checkOptions(options);
  checkFractions(options, true);
  const negative = paisa < 0n;
  const digits = (negative ? -paisa : paisa).toString().padStart(3, '0');
  const rupees = digits.slice(0, -2).replace(/^0+(?=\d)/, '');
  const decimalText = `${rupees === '' ? '0' : rupees}.${digits.slice(-2)}`;
  const magnitude = formatExactDecimal(toExactDecimal(decimalText), {
    grouping: checked.grouping,
    numerals: checked.numerals,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    groupSeparator: ',',
    decimalSeparator: '.',
  });
  return compose(magnitude, checked.symbol, checked.placement, checked.spacing, negative, checked.negative);
}
