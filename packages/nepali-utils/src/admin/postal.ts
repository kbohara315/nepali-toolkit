import { InvalidAdminError } from './errors.js';
import { getPalika } from './palikas.js';
import type { Palika } from './types.js';

// Postal codes per the General Post Office scheme (see PROVENANCE.md S5):
// a palika's pin is its 5-digit NSO code; a ward's pin is that code plus
// the zero-padded 2-digit ward number (`1010101`–`1010107` for palika
// `10101` with 7 wards). Derived from the admin tables — no new data.

/** A parsed postal code: palika-level (5 digits) or ward-level (7 digits). */
export type PostalCode =
  | { readonly kind: 'palika'; readonly postalCode: string; readonly palika: Palika }
  | {
      readonly kind: 'ward';
      readonly postalCode: string;
      readonly palika: Palika;
      readonly ward: number;
    };

const pad2 = (ward: number): string => String(ward).padStart(2, '0');

/**
 * The 5-digit postal (pin) code for a palika; `undefined` when the
 * palika code is unknown. Identical to the palika's NSO code by GPO rule.
 */
export function getPostalCode(palikaCode: string): string | undefined {
  const palika = getPalika(palikaCode);
  return palika?.code;
}

/**
 * The 7-digit ward postal code (`{palika}{ward:02d}`); `undefined` for
 * unknown palikas, out-of-range wards, or non-integer wards.
 */
export function getWardPostalCode(palikaCode: string, wardNo: number): string | undefined {
  if (typeof wardNo !== 'number' || !Number.isInteger(wardNo)) return undefined;
  const palika = typeof palikaCode === 'string' ? getPalika(palikaCode) : undefined;
  if (!palika || wardNo < 1 || wardNo > palika.wards) return undefined;
  return `${palika.code}${pad2(wardNo)}`;
}

/**
 * Validate a 5- or 7-digit postal code against the tables. Returns the
 * resolved palika (and ward for 7-digit codes), or `undefined` for
 * unknown prefixes, out-of-range wards, and malformed input — never throws
 * except on non-string input.
 */
export function parsePostalCode(code: string): PostalCode | undefined {
  if (typeof code !== 'string') {
    throw new InvalidAdminError(`Expected code string, received ${typeof code}`);
  }
  if (/^\d{5}$/.test(code)) {
    const palika = getPalika(code);
    return palika ? { kind: 'palika', postalCode: code, palika } : undefined;
  }
  const ward = /^(\d{5})(\d{2})$/.exec(code);
  if (!ward) return undefined;
  const palika = getPalika(ward[1]);
  const wardNo = Number(ward[2]);
  if (!palika || wardNo < 1 || wardNo > palika.wards) return undefined;
  return { kind: 'ward', postalCode: code, palika, ward: wardNo };
}
