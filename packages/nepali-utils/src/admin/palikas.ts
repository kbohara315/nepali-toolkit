import { PALIKAS } from './data/palikas.js';
import { InvalidAdminError } from './errors.js';
import type { AdminSearchOptions, Palika } from './types.js';
const byCode = new Map(PALIKAS.map((palika) => [palika.code, palika]));
const key = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim();
let searchRows: readonly (readonly [Palika, string, string])[] | undefined;
export function getPalikas(districtCode?: string): readonly Palika[] {
  if (districtCode === undefined) return PALIKAS;
  if (typeof districtCode !== 'string') throw new InvalidAdminError(`Expected code string, received ${typeof districtCode}`);
  return PALIKAS.filter((p) => p.district === districtCode);
}
export function getPalika(code: string): Palika | undefined {
  if (typeof code !== 'string') throw new InvalidAdminError(`Expected code string, received ${typeof code}`);
  return byCode.get(code);
}
export function getPalikaWards(code: string): readonly number[] {
  const palika = getPalika(code);
  return palika ? Array.from({ length: palika.wards }, (_, i) => i + 1) : [];
}
export function findPalikasByName(query: string, options?: AdminSearchOptions): Palika[] {
  if (typeof query !== 'string') throw new InvalidAdminError(`Expected query string, received ${typeof query}`);
  const q = key(query), folded = q.toLowerCase(), limit = options?.limit ?? 25;
  const script = options?.script;
  if (!Number.isInteger(limit) || limit < 0) throw new InvalidAdminError(`Expected non-negative limit, received ${limit}`);
  if (limit === 0 || q.length === 0) return [];
  searchRows ??= PALIKAS.map((p) => [p, key(p.nameNe), key(p.nameEn).toLowerCase()] as const);
  const out: Palika[] = [];
  for (const [palika, ne, en] of searchRows) {
    if ((script !== 'en' && ne.includes(q)) || (script !== 'ne' && en.includes(folded))) {
      out.push(palika);
      if (out.length === limit) break;
    }
  }
  return out;
}
