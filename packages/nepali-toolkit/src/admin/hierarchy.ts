import { DISTRICTS } from './data/districts.js';
import { PALIKAS } from './data/palikas.js';
import { PROVINCES } from './data/provinces.js';
import type { AdminHierarchy } from './types.js';
import { InvalidAdminError } from './errors.js';
const districts = new Map(DISTRICTS.map((row) => [row.code, row]));
const provinces = new Map(PROVINCES.map((row) => [row.code, row]));
const palikas = new Map(PALIKAS.map((row) => [row.code, row]));
export function getHierarchy(code: string): AdminHierarchy | undefined {
  if (typeof code !== 'string') throw new InvalidAdminError(`Expected code string, received ${typeof code}`);
  const palika = palikas.get(code);
  const district = palika && districts.get(palika.district);
  const province = district && provinces.get(district.province);
  return palika && district && province ? { province, district, palika } : undefined;
}
