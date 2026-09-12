import { DISTRICTS } from './data/districts.js';
import { InvalidAdminError } from './errors.js';
import type { AdminSearchOptions, District } from './types.js';
const byCode = new Map(DISTRICTS.map((district) => [district.code, district]));
const key = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim();
let searchRows: readonly (readonly [District, string, string])[] | undefined;
export function getDistricts(provinceCode?: string): readonly District[] {
  if (provinceCode === undefined) return DISTRICTS;
  if (typeof provinceCode !== 'string') throw new InvalidAdminError(`Expected code string, received ${typeof provinceCode}`);
  return DISTRICTS.filter((d) => d.province === provinceCode);
}
export function getDistrict(code: string): District | undefined {
  if (typeof code !== 'string') throw new InvalidAdminError(`Expected code string, received ${typeof code}`);
  return byCode.get(code);
}
export function findDistrictsByName(query: string, options?: AdminSearchOptions): District[] {
  if (typeof query !== 'string') throw new InvalidAdminError(`Expected query string, received ${typeof query}`);
  const q = key(query), folded = q.toLowerCase(), limit = options?.limit ?? 25;
  if (!Number.isInteger(limit) || limit < 0) throw new InvalidAdminError(`Expected non-negative limit, received ${limit}`);
  if (limit === 0 || q.length === 0) return [];
  searchRows ??= DISTRICTS.map((d) => [d, key(d.nameNe), key(d.nameEn).toLowerCase()] as const);
  return searchRows.filter(([d, ne, en]) =>
    (options?.script !== 'en' && ne.includes(q)) ||
    (options?.script !== 'ne' && en.includes(folded)),
  ).map(([d]) => d).slice(0, limit);
}
