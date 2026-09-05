import { normalizeNepalPhoneDigits } from './normalize.js';
import type { NepalPhone } from './parse.js';
import { AREA_CODES, MOBILE_PREFIXES, PREMIUM_PATTERNS, TOLL_FREE_PATTERNS } from './tables.js';

/**
 * Cheap length/shape gate on raw text. No table lookups; returns `false`
 * for malformed input instead of throwing.
 */
export function isPossibleNepalPhone(text: string): boolean {
  let national: string;
  try {
    national = normalizeNepalPhoneDigits(text);
  } catch {
    return false;
  }
  if (/^(96|97|98)[0-9]{8}$/.test(national)) return true;
  if (/^0[0-9]{6,9}$/.test(national)) return true;
  if (TOLL_FREE_PATTERNS.some((prefix) => national.startsWith(prefix))) {
    return national.length >= 7 && national.length <= 10;
  }
  if (PREMIUM_PATTERNS.some((prefix) => national.startsWith(prefix)) && !national.startsWith('0')) {
    return national.length >= 4 && national.length <= 8;
  }
  return false;
}

/** Structural check on an already-parsed phone. Never throws. */
export function isValidNepalPhone(phone: NepalPhone): boolean {
  if (phone === null || typeof phone !== 'object') return false;
  if (phone.country !== '977') return false;
  if (typeof phone.national !== 'string') return false;
  if (phone.e164 !== `+977${phone.national}`) return false;
  if (phone.kind === 'mobile') {
    return (
      /^(96|97|98)[0-9]{8}$/.test(phone.national) && phone.areaOrPrefix === phone.national.slice(0, 3)
    );
  }
  if (phone.kind === 'landline') {
    if (TOLL_FREE_PATTERNS.some((prefix) => phone.national.startsWith(prefix))) return true;
    if (
      PREMIUM_PATTERNS.some((prefix) => phone.national.startsWith(prefix)) &&
      !phone.national.startsWith('0')
    ) {
      return true;
    }
    return (
      /^0[0-9]{6,9}$/.test(phone.national) &&
      phone.national.startsWith(phone.areaOrPrefix) &&
      phone.areaOrPrefix.length >= 2
    );
  }
  return false;
}

/**
 * Classify a parsed phone. Toll-free / premium patterns win over the
 * structural kind; classification never rejects.
 */
export function getNepalPhoneType(phone: NepalPhone): 'mobile' | 'landline' | 'toll-free' | 'premium' | 'unknown' {
  if (phone === null || typeof phone !== 'object') return 'unknown';
  if (
    typeof phone.national === 'string' &&
    TOLL_FREE_PATTERNS.some((prefix) => phone.national.startsWith(prefix))
  ) {
    return 'toll-free';
  }
  if (
    typeof phone.national === 'string' &&
    PREMIUM_PATTERNS.some((prefix) => phone.national.startsWith(prefix)) &&
    !phone.national.startsWith('0')
  ) {
    return 'premium';
  }
  if (phone.kind === 'mobile' || phone.kind === 'landline') return phone.kind;
  return 'unknown';
}

/**
 * `true` when the prefix/area hits the versioned tables with a known
 * allocation (`null` rows and unknown shapes are unallocated).
 */
export function isAllocatedNepalPhone(phone: NepalPhone): boolean {
  if (!isValidNepalPhone(phone)) return false;
  if (getNepalPhoneType(phone) === 'toll-free' || getNepalPhoneType(phone) === 'premium') return true;
  if (phone.kind === 'mobile') {
    return (
      Object.hasOwn(MOBILE_PREFIXES, phone.areaOrPrefix) &&
      MOBILE_PREFIXES[phone.areaOrPrefix] !== null
    );
  }
  return (
    Object.hasOwn(AREA_CODES, phone.areaOrPrefix) &&
    phone.national.startsWith(phone.areaOrPrefix)
  );
}
