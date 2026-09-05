import { toDevanagari } from '../number/digits.js';
import type { NumeralInput } from '../number/digits.js';
import { toExactDecimal } from '../number/grouping.js';
import {
  AANA_PER_ROPANI,
  DAAM_PER_PAISA,
  DHUR_PER_KATTHA,
  KATTHA_PER_BIGHA,
  PAISA_PER_AANA,
  SQFT_PER_BIGHA,
  SQFT_PER_ROPANI,
  UM2_PER_AANA,
  UM2_PER_BIGHA,
  UM2_PER_DAAM,
  UM2_PER_DHUR,
  UM2_PER_KATTHA,
  UM2_PER_PAISA,
  UM2_PER_ROPANI,
  UM2_PER_SQ_CM,
  UM2_PER_SQ_M,
} from './constants.js';
import { InvalidAreaError } from './errors.js';

/** Exact canonical area: whole square micrometres (µm²). */
export type Area = { readonly um2: bigint };

export type HillAreaFields = {
  ropani?: number;
  aana?: number;
  paisa?: number;
  daam?: number;
};

export type TeraiAreaFields = {
  bigha?: number;
  kattha?: number;
  dhur?: number;
};

export type AreaFormatOptions = {
  numerals?: 'ascii' | 'devanagari';
  style?: 'long' | 'short';
  omitZero?: boolean;
  language?: 'ne' | 'en';
};

function fail(detail: string): never {
  throw new InvalidAreaError(`Invalid area: ${detail}`);
}

function checkUnit(name: string, value: number | undefined): number {
  if (value === undefined) return 0;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    fail(`${name} must be an integer`);
  }
  if ((value as number) < 0) fail(`${name} must be non-negative`);
  return value as number;
}

/**
 * Hill-system area. Overflowing subordinate units (e.g. 20 aana) are
 * normalized by carrying upward. Negative or fractional input is rejected.
 */
export function hillArea(fields?: HillAreaFields): Area {
  const ropani = checkUnit('ropani', fields?.ropani);
  const aana = checkUnit('aana', fields?.aana);
  const paisa = checkUnit('paisa', fields?.paisa);
  const daam = checkUnit('daam', fields?.daam);
  const totalDaam =
    BigInt((((ropani * AANA_PER_ROPANI + aana) * PAISA_PER_AANA + paisa) * DAAM_PER_PAISA + daam));
  return { um2: totalDaam * UM2_PER_DAAM };
}

/**
 * Terai-system area. Overflowing subordinate units (e.g. 25 dhur) are
 * normalized by carrying upward. Negative or fractional input is rejected.
 */
export function teraiArea(fields?: TeraiAreaFields): Area {
  const bigha = checkUnit('bigha', fields?.bigha);
  const kattha = checkUnit('kattha', fields?.kattha);
  const dhur = checkUnit('dhur', fields?.dhur);
  const totalDhur = BigInt((bigha * KATTHA_PER_BIGHA + kattha) * DHUR_PER_KATTHA + dhur);
  return { um2: totalDhur * UM2_PER_DHUR };
}

/** Exact square metres as a decimal string (never binary float). */
export function toSquareMetres(area: Area): string {
  const int = area.um2 / UM2_PER_SQ_M;
  const rem = area.um2 % UM2_PER_SQ_M;
  if (rem === 0n) return int.toString();
  const frac = rem.toString().padStart(12, '0').replace(/0+$/, '');
  return `${int.toString()}.${frac}`;
}

/** Exact square centimetres as a decimal string (never binary float). */
export function toSquareCentimetres(area: Area): string {
  const int = area.um2 / UM2_PER_SQ_CM;
  const rem = area.um2 % UM2_PER_SQ_CM;
  if (rem === 0n) return int.toString();
  const frac = rem.toString().padStart(8, '0').replace(/0+$/, '');
  return `${int.toString()}.${frac}`;
}

function divideExact(numerator: bigint, denominator: bigint, maxFrac: number): string {
  const int = numerator / denominator;
  let rem = numerator % denominator;
  if (rem === 0n) return int.toString();
  let frac = '';
  for (let i = 0; i < maxFrac && rem !== 0n; i += 1) {
    rem *= 10n;
    frac += (rem / denominator).toString();
    rem %= denominator;
  }
  if (rem !== 0n && frac.length === maxFrac) {
    // Half-up round on the final digit using the leftover remainder.
    const cont = (rem * 10n) / denominator;
    if (cont >= 5n) {
      const bumped = (BigInt(`${int.toString()}${frac}`) + 1n).toString().padStart(frac.length + 1, '0');
      const cut = bumped.length - frac.length;
      const rounded = `${bumped.slice(0, cut)}.${bumped.slice(cut).replace(/0+$/, '')}`;
      return rounded.endsWith('.') ? rounded.slice(0, -1) : rounded;
    }
  }
  return `${int.toString()}.${frac.replace(/0+$/, '') || '0'}`;
}

/**
 * Exact square feet as a decimal string (never binary float).
 *
 * The two published figures (1 Ropani = 5,476 sq ft; 1 Bigha = 72,900 sq ft)
 * imply slightly different square-foot sizes, so each system's published
 * relation is used for areas exact in that system's ladder: hill-ladder-exact
 * areas use the Ropani figure, Terai-ladder-exact areas use the Bigha figure,
 * and all other areas use the Ropani figure (up to 12 fraction digits).
 */
export function toSquareFeet(area: Area): string {
  if (area.um2 !== 0n && area.um2 % UM2_PER_DAAM !== 0n && area.um2 % UM2_PER_DHUR === 0n) {
    return divideExact(area.um2 * SQFT_PER_BIGHA, UM2_PER_BIGHA, 12);
  }
  return divideExact(area.um2 * SQFT_PER_ROPANI, UM2_PER_ROPANI, 12);
}

function fromDecimalToUm2(value: NumeralInput, scaleNumerator: bigint, scaleDenominator: bigint): bigint {
  const exact = toExactDecimal(value as string | number | bigint);
  if (exact.negative && !/^0*$/.test(`${exact.intDigits}${exact.fracDigits}`)) {
    fail('value must be non-negative');
  }
  const digits = `${exact.intDigits}${exact.fracDigits}`;
  const magnitude = (digits === '' ? 0n : BigInt(digits)) * scaleNumerator;
  const divisor = scaleDenominator * 10n ** BigInt(exact.fracDigits.length);
  const quotient = magnitude / divisor;
  const remainder = magnitude % divisor;
  return remainder * 2n >= divisor ? quotient + 1n : quotient;
}

/** Parse square metres (ASCII/Devanagari decimal) to an Area, half-up rounded to whole µm². */
export function fromSquareMetres(value: NumeralInput): Area {
  return { um2: fromDecimalToUm2(value, UM2_PER_SQ_M, 1n) };
}

/** Parse square centimetres (ASCII/Devanagari decimal) to an Area, half-up rounded to whole µm². */
export function fromSquareCentimetres(value: NumeralInput): Area {
  return { um2: fromDecimalToUm2(value, UM2_PER_SQ_CM, 1n) };
}

/**
 * Parse square feet (ASCII/Devanagari decimal) to an Area, half-up rounded to
 * whole µm². Uses the hill published relation (1 Ropani = 5,476 sq ft).
 */
export function fromSquareFeet(value: NumeralInput): Area {
  return { um2: fromDecimalToUm2(value, UM2_PER_ROPANI, SQFT_PER_ROPANI) };
}

type UnitLabels = { long: string; short: string };
type Unit = { count: bigint; ne: UnitLabels; en: UnitLabels };

function render(units: readonly Unit[], options?: AreaFormatOptions): string {
  const numerals = options?.numerals ?? 'devanagari';
  const style = options?.style ?? 'long';
  const omitZero = options?.omitZero ?? true;
  const language = options?.language ?? 'ne';
  if (numerals !== 'ascii' && numerals !== 'devanagari') fail(`unsupported numerals ${String(numerals)}`);
  if (style !== 'long' && style !== 'short') fail(`unsupported style ${String(style)}`);
  if (language !== 'ne' && language !== 'en') fail(`unsupported language ${String(language)}`);
  const picked = omitZero ? units.filter((u) => u.count !== 0n) : [...units];
  const shown = picked.length === 0 ? [units[units.length - 1]] : picked;
  return shown
    .map((u) => {
      const digits = u.count.toString();
      const rendered = numerals === 'devanagari' ? toDevanagari(digits) : digits;
      const labels = language === 'ne' ? u.ne : u.en;
      return `${rendered} ${style === 'long' ? labels.long : labels.short}`;
    })
    .join(' ');
}

function decompose(um2: bigint, sizes: readonly bigint[]): bigint[] {
  let rest = um2;
  return sizes.map((size, i) => {
    if (i === sizes.length - 1) return rest / size;
    const count = rest / size;
    rest %= size;
    return count;
  });
}

/**
 * Display an area in hill units. Decomposition is by integer division (floor)
 * from the exact area; sub-daam remainders are dropped in display only — the
 * `Area` keeps full precision.
 */
export function formatHillArea(area: Area, options?: AreaFormatOptions): string {
  const [ropani, aana, paisa, daam] = decompose(area.um2, [
    UM2_PER_ROPANI,
    UM2_PER_AANA,
    UM2_PER_PAISA,
    UM2_PER_DAAM,
  ]);
  return render(
    [
      { count: ropani, ne: { long: 'रोपनी', short: 'रो' }, en: { long: 'Ropani', short: 'R' } },
      { count: aana, ne: { long: 'आना', short: 'आ' }, en: { long: 'Aana', short: 'A' } },
      { count: paisa, ne: { long: 'पैसा', short: 'पै' }, en: { long: 'Paisa', short: 'P' } },
      { count: daam, ne: { long: 'दाम', short: 'दा' }, en: { long: 'Daam', short: 'D' } },
    ],
    options,
  );
}

/**
 * Display an area in Terai units. Decomposition is by integer division (floor)
 * from the exact area; sub-dhur remainders are dropped in display only — the
 * `Area` keeps full precision.
 */
export function formatTeraiArea(area: Area, options?: AreaFormatOptions): string {
  const [bigha, kattha, dhur] = decompose(area.um2, [UM2_PER_BIGHA, UM2_PER_KATTHA, UM2_PER_DHUR]);
  return render(
    [
      { count: bigha, ne: { long: 'बिघा', short: 'बि' }, en: { long: 'Bigha', short: 'B' } },
      { count: kattha, ne: { long: 'कट्ठा', short: 'क' }, en: { long: 'Kattha', short: 'K' } },
      { count: dhur, ne: { long: 'धुर', short: 'ध' }, en: { long: 'Dhur', short: 'D' } },
    ],
    options,
  );
}
