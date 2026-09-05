// Read-only lookups over the admin tables. Self-contained on purpose:
// no imports from other domains, so `./admin` never retains them
// (blueprint isolation rule). Name matching uses builtin NFC only.

import { PROVINCES } from './data/provinces.js';
import { DISTRICTS } from './data/districts.js';
import { PALIKAS } from './data/palikas.js';
import { InvalidAdminError } from './errors.js';
import type {
  AdminHierarchy,
  AdminSearchOptions,
  District,
  Palika,
  Province,
} from './types.js';

/** Table revision pinned to the gazette snapshot (see PROVENANCE.md). */
export const adminRevision = 'gov-2026-09' as const;

function assertCode(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new InvalidAdminError(`Expected code string, received ${typeof value}`);
  }
}

function assertQuery(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new InvalidAdminError(`Expected query string, received ${typeof value}`);
  }
}

const byCode = <T extends { readonly code: string }>(rows: readonly T[]): ReadonlyMap<string, T> =>
  new Map(rows.map((row) => [row.code, row]));

const PROVINCE_BY_CODE = byCode(PROVINCES);
const DISTRICT_BY_CODE = byCode(DISTRICTS);
const PALIKA_BY_CODE = byCode(PALIKAS);

/** All 7 provinces in code order. */
export function getProvinces(): readonly Province[] {
  return PROVINCES;
}

/** Province by `1`–`7`; `undefined` when unknown. */
export function getProvince(code: string): Province | undefined {
  assertCode(code);
  return PROVINCE_BY_CODE.get(code);
}

/** Districts in code order, optionally restricted to one province. */
export function getDistricts(provinceCode?: string): readonly District[] {
  if (provinceCode === undefined) return DISTRICTS;
  assertCode(provinceCode);
  return DISTRICTS.filter((district) => district.province === provinceCode);
}

/** District by 3-digit code (`101`–`709`); `undefined` when unknown. */
export function getDistrict(code: string): District | undefined {
  assertCode(code);
  return DISTRICT_BY_CODE.get(code);
}

/** Palikas in code order, optionally restricted to one district. */
export function getPalikas(districtCode?: string): readonly Palika[] {
  if (districtCode === undefined) return PALIKAS;
  assertCode(districtCode);
  return PALIKAS.filter((palika) => palika.district === districtCode);
}

/** Palika by 5-digit code; `undefined` when unknown. */
export function getPalika(code: string): Palika | undefined {
  assertCode(code);
  return PALIKA_BY_CODE.get(code);
}

/** Ward numbers (`1..wards`) for a palika; empty when the code is unknown. */
export function getPalikaWards(palikaCode: string): readonly number[] {
  const palika = getPalika(palikaCode);
  if (!palika) return [];
  return Array.from({ length: palika.wards }, (_, i) => i + 1);
}

/** Province + district + palika for a 5-digit code; `undefined` when unknown. */
export function getHierarchy(palikaCode: string): AdminHierarchy | undefined {
  const palika = getPalika(palikaCode);
  if (!palika) return undefined;
  const district = DISTRICT_BY_CODE.get(palika.district);
  const province =
    district !== undefined ? PROVINCE_BY_CODE.get(district.province) : undefined;
  if (!district || !province) return undefined;
  return { province, district, palika };
}

// NFC + trim + single spaces; English folded to lowercase for matching.
const matchKey = (value: string, foldCase: boolean): string => {
  const key = value.normalize('NFC').replace(/\s+/g, ' ').trim();
  return foldCase ? key.toLowerCase() : key;
};

function search<T>(
  rows: readonly T[],
  names: (row: T) => { ne: string; en: string },
  query: string,
  options?: AdminSearchOptions,
): T[] {
  assertQuery(query);
  const script = options?.script ?? 'both';
  const limit = options?.limit ?? 25;
  if (!Number.isInteger(limit) || limit < 0) {
    throw new InvalidAdminError(`Expected non-negative limit, received ${limit}`);
  }
  if (limit === 0) return [];
  const q = matchKey(query, true);
  if (q.length === 0) return [];
  const out: T[] = [];
  for (const row of rows) {
    const { ne, en } = names(row);
    const hit =
      (script !== 'en' && matchKey(ne, false).includes(matchKey(q, false))) ||
      (script !== 'ne' && matchKey(en, true).includes(q));
    if (hit) {
      out.push(row);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** Provinces whose Nepali or English name contains the query. */
export function findProvincesByName(query: string, options?: AdminSearchOptions): Province[] {
  return search(PROVINCES, (p) => ({ ne: p.nameNe, en: p.nameEn }), query, options);
}

/** Districts whose Nepali or English name contains the query. */
export function findDistrictsByName(query: string, options?: AdminSearchOptions): District[] {
  return search(DISTRICTS, (d) => ({ ne: d.nameNe, en: d.nameEn }), query, options);
}

/** Palikas whose Nepali or English name contains the query. */
export function findPalikasByName(query: string, options?: AdminSearchOptions): Palika[] {
  return search(PALIKAS, (p) => ({ ne: p.nameNe, en: p.nameEn }), query, options);
}
