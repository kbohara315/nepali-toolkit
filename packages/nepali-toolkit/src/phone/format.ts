import { parseNepalPhone, type NepalPhone } from './parse.js';

/** Formatting styles for {@link formatNepalPhone}. */
export type PhoneFormatOptions = {
  style?: 'national' | 'international' | 'e164';
};

function nationalFormat(phone: NepalPhone): string {
  if (phone.kind === 'mobile') {
    return `${phone.national.slice(0, 3)}-${phone.national.slice(3, 6)}-${phone.national.slice(6)}`;
  }
  return `${phone.areaOrPrefix}-${phone.national.slice(phone.areaOrPrefix.length)}`;
}

/** Render a parsed phone in national, international, or e164 style. */
export function formatNepalPhone(phone: NepalPhone, options?: PhoneFormatOptions): string {
  const style = options?.style ?? 'national';
  if (style === 'e164') return phone.e164;
  if (style === 'international') {
    const national = nationalFormat(phone);
    // Drop the trunk `0` after the country marker: `01-…` → `1-…`.
    const withoutTrunk = national.startsWith('0') ? national.slice(1) : national;
    return `+977 ${withoutTrunk}`;
  }
  return nationalFormat(phone);
}

function toE164(value: NepalPhone | string): string | undefined {
  if (typeof value === 'string') {
    try {
      return parseNepalPhone(value).e164;
    } catch {
      return undefined;
    }
  }
  if (value !== null && typeof value === 'object') return value.e164;
  return undefined;
}

/**
 * Canonical comparison: strings are parsed as needed and the `e164`
 * forms are compared. Unparseable input compares as unequal.
 */
export function isSameNepalPhone(a: NepalPhone | string, b: NepalPhone | string): boolean {
  const left = toE164(a);
  const right = toE164(b);
  if (left === undefined || right === undefined) return false;
  return left === right;
}
