// Public shapes for the `admin` domain (Nepal's federal hierarchy).
// Data: NSO geographical codes + census ward counts + MoFAGA names;
// see data/PROVENANCE.md. All codes are strings (identifiers, not numbers).

/** Palika (local-level) category. */
export type PalikaType =
  | 'metropolitan'
  | 'sub-metropolitan'
  | 'municipality'
  | 'rural';

/** Province (प्रदेश): code `1`–`7`. */
export type Province = {
  readonly code: string;
  readonly nameEn: string;
  readonly nameNe: string;
};

/** District (जिल्ला): 3-digit NSO code (`101`–`709`, first digit = province). */
export type District = {
  readonly code: string;
  readonly province: string;
  readonly nameEn: string;
  readonly nameNe: string;
};

/**
 * Palika (local level): 5-digit NSO code (first 3 = district).
 * `wards` is the official ward count; valid ward numbers are `1..wards`.
 */
export type Palika = {
  readonly code: string;
  readonly district: string;
  readonly type: PalikaType;
  readonly nameEn: string;
  readonly nameNe: string;
  readonly wards: number;
};

/** Full hierarchy for one palika code. */
export type AdminHierarchy = {
  readonly province: Province;
  readonly district: District;
  readonly palika: Palika;
};

/** Options for bilingual name search. */
export type AdminSearchOptions = {
  /** Restrict matching to one script (default searches both). */
  readonly script?: 'ne' | 'en';
  /** Maximum results (default 25). */
  readonly limit?: number;
};
