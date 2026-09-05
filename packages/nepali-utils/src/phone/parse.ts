import { InvalidPhoneError } from './errors.js';
import { normalizeNepalPhoneDigits } from './normalize.js';
import { AREA_CODES, MOBILE_PREFIXES, PREMIUM_PATTERNS, TOLL_FREE_PATTERNS } from './tables.js';

/** Structured Nepal phone number. */
export type NepalPhone = {
  readonly kind: 'mobile' | 'landline';
  readonly country: '977';
  readonly national: string;
  readonly e164: `+977${string}`;
  readonly areaOrPrefix: string;
  readonly operator?: string;
  readonly areas?: readonly string[];
};

function longestAreaMatch(national: string): string | undefined {
  for (const length of [3, 2]) {
    const candidate = national.slice(0, length);
    if (Object.hasOwn(AREA_CODES, candidate)) return candidate;
  }
  return undefined;
}

function startsWithAny(value: string, prefixes: readonly string[]): string | undefined {
  return prefixes.find((prefix) => value.startsWith(prefix));
}

/**
 * Parse raw phone text into a {@link NepalPhone}. Unknown-but-shaped
 * prefixes/areas yield a valid phone with `operator`/`areas` undefined —
 * they are never rejected.
 */
export function parseNepalPhone(text: string): NepalPhone {
  const national = normalizeNepalPhoneDigits(text);
  const fail = (): never => {
    throw new InvalidPhoneError(`unrecognized Nepal phone shape in ${JSON.stringify(String(text))}`);
  };

  // Toll-free shapes (`1660…` / `1800…`): carried as landline kind so the
  // `NepalPhone` union stays closed; `getNepalPhoneType` reports toll-free.
  const tollFree = startsWithAny(national, TOLL_FREE_PATTERNS);
  if (tollFree !== undefined) {
    if (national.length < 7 || national.length > 10) fail();
    return {
      kind: 'landline',
      country: '977',
      national,
      e164: `+977${national}`,
      areaOrPrefix: tollFree,
    };
  }

  // Premium shapes (`19xx…`): same closed-union treatment as toll-free.
  const premium = startsWithAny(national, PREMIUM_PATTERNS);
  if (premium !== undefined && !national.startsWith('0')) {
    if (national.length < 4 || national.length > 8) fail();
    return {
      kind: 'landline',
      country: '977',
      national,
      e164: `+977${national}`,
      areaOrPrefix: national.slice(0, 4),
    };
  }

  // Mobile: 10 digits, 97/98-led (NTA GSM + CDMA-evolution ranges).
  if (/^(96|97|98)[0-9]{8}$/.test(national)) {
    const prefix = national.slice(0, 3);
    const operator = Object.hasOwn(MOBILE_PREFIXES, prefix)
      ? (MOBILE_PREFIXES[prefix] ?? undefined)
      : undefined;
    return {
      kind: 'mobile',
      country: '977',
      national,
      e164: `+977${national}`,
      areaOrPrefix: prefix,
      ...(operator === undefined ? {} : { operator }),
    };
  }

  // Landline: leading 0, longest-match area code.
  if (/^0[0-9]{6,9}$/.test(national)) {
    const area = longestAreaMatch(national);
    if (area === undefined) {
      if (national.length < 7 || national.length > 10) fail();
      return {
        kind: 'landline',
        country: '977',
        national,
        e164: `+977${national}`,
        areaOrPrefix: national.slice(0, 2),
      };
    }
    const subscriberLength = national.length - area.length;
    const minimum = area === '01' ? 7 : 6;
    if (subscriberLength < minimum || subscriberLength > 8) fail();
    const areas = AREA_CODES[area];
    return {
      kind: 'landline',
      country: '977',
      national,
      e164: `+977${national}`,
      areaOrPrefix: area,
      areas,
    };
  }

  return fail();
}
