// Structural validation over the admin tables: code shapes, existence,
// and ward ranges. Allocation truth comes from the tables, never from
// heuristics.

import { DISTRICTS } from './data/districts.js';
import { getPalika } from './lookup.js';

const DISTRICT_CODES: ReadonlySet<string> = new Set(DISTRICTS.map((d) => d.code));

/** `true` for a known province code (`1`–`7`). */
export function isProvinceCode(code: unknown): code is string {
  return typeof code === 'string' && /^[1-7]$/.test(code);
}

/** `true` for a known 3-digit district code. */
export function isDistrictCode(code: unknown): code is string {
  return typeof code === 'string' && DISTRICT_CODES.has(code);
}

/** `true` for a known 5-digit palika code. */
export function isPalikaCode(code: unknown): code is string {
  return typeof code === 'string' && getPalika(code) !== undefined;
}

/**
 * `true` when `wardNo` is an integer inside the palika's official ward
 * range (`1..wards`). Unknown palika codes and non-integers are `false`,
 * never throw.
 */
export function isValidWard(palikaCode: unknown, wardNo: unknown): boolean {
  if (typeof palikaCode !== 'string') return false;
  if (typeof wardNo !== 'number' || !Number.isInteger(wardNo)) return false;
  const palika = getPalika(palikaCode);
  if (!palika) return false;
  return wardNo >= 1 && wardNo <= palika.wards;
}
