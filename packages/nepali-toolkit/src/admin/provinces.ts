import { PROVINCES } from './data/provinces.js';
import { InvalidAdminError } from './errors.js';
import type { AdminSearchOptions, Province } from './types.js';

const byCode = new Map(PROVINCES.map((province) => [province.code, province]));
const key = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim();
let searchRows: readonly (readonly [Province, string, string])[] | undefined;

export function getProvinces(): readonly Province[] { return PROVINCES; }
export function getProvince(code: string): Province | undefined {
  if (typeof code !== 'string') throw new InvalidAdminError(`Expected code string, received ${typeof code}`);
  return byCode.get(code);
}
export function findProvincesByName(query: string, options?: AdminSearchOptions): Province[] {
  if (typeof query !== 'string') throw new InvalidAdminError(`Expected query string, received ${typeof query}`);
  const q = key(query), folded = q.toLowerCase(), limit = options?.limit ?? 25;
  if (!Number.isInteger(limit) || limit < 0) throw new InvalidAdminError(`Expected non-negative limit, received ${limit}`);
  if (limit === 0 || q.length === 0) return [];
  searchRows ??= PROVINCES.map((p) => [p, key(p.nameNe), key(p.nameEn).toLowerCase()] as const);
  return searchRows.filter(([p, ne, en]) =>
    (options?.script !== 'en' && ne.includes(q)) ||
    (options?.script !== 'ne' && en.includes(folded)),
  ).map(([p]) => p).slice(0, limit);
}
