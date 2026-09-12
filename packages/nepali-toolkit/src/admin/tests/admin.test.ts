import { describe, expect, it } from 'vitest';
import {
  adminRevision,
  findDistrictsByName,
  findPalikasByName,
  findProvincesByName,
  getDistrict,
  getDistricts,
  getHierarchy,
  getPalika,
  getPalikaWards,
  getPalikas,
  getProvince,
  getProvinces,
  InvalidAdminError,
  isDistrictCode,
  isPalikaCode,
  isProvinceCode,
  isValidWard,
} from '../index.js';

describe('admin dataset integrity (official snapshot gov-2026-09)', () => {
  it('revision is pinned', () => {
    expect(adminRevision).toBe('gov-2026-09');
  });

  it('counts: 7 provinces, 77 districts, 753 palikas, 6743 wards', () => {
    expect(getProvinces()).toHaveLength(7);
    expect(getDistricts()).toHaveLength(77);
    expect(getPalikas()).toHaveLength(753);
    expect(getPalikas().reduce((sum, p) => sum + p.wards, 0)).toBe(6743);
  });

  it('type counts match the official structure', () => {
    const counts = new Map(getPalikas().map((p) => [p.type, 0]));
    for (const p of getPalikas()) counts.set(p.type, counts.get(p.type)! + 1);
    expect(Object.fromEntries(counts)).toEqual({
      rural: 460,
      municipality: 276,
      'sub-metropolitan': 11,
      metropolitan: 6,
    });
  });

  it('ward counts stay in the official 5..33 band', () => {
    for (const p of getPalikas()) {
      expect(p.wards).toBeGreaterThanOrEqual(5);
      expect(p.wards).toBeLessThanOrEqual(33);
    }
  });

  it('code shapes and prefix hierarchy are consistent', () => {
    expect(getProvinces().map((p) => p.code)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    for (const d of getDistricts()) {
      expect(d.code).toMatch(/^\d{3}$/);
      expect(d.code[0]).toBe(d.province);
      expect(getProvince(d.province)).toBeDefined();
    }
    for (const p of getPalikas()) {
      expect(p.code).toMatch(/^\d{5}$/);
      expect(getDistrict(p.district)).toBeDefined();
      expect(p.code.slice(0, 3)).toBe(p.district);
    }
  });

  it('every district owns at least one palika', () => {
    for (const d of getDistricts()) {
      expect(getPalikas(d.code).length).toBeGreaterThan(0);
    }
  });

  it('province group sizes match the official split', () => {
    const sizes = ['1', '2', '3', '4', '5', '6', '7'].map((c) => getDistricts(c).length);
    expect(sizes).toEqual([14, 8, 13, 11, 12, 10, 9]);
  });
});

describe('admin lookups', () => {
  it('spot checks against the official tables', () => {
    expect(getProvince('1')).toMatchObject({ nameEn: 'Koshi Province', nameNe: 'कोशी प्रदेश' });
    expect(getDistrict('101')).toMatchObject({
      province: '1',
      nameEn: 'Taplejung',
      nameNe: 'ताप्लेजुङ',
    });
    expect(getPalika('10106')).toMatchObject({
      district: '101',
      type: 'municipality',
      nameEn: 'Phungling Urban Municipality',
      wards: 11,
    });
    expect(getPalika('30608')).toMatchObject({ type: 'metropolitan', wards: 32 });
    expect(getPalika('70905')).toMatchObject({ wards: 10 });
    expect(getPalikas('101')).toHaveLength(9);
  });

  it('unknown codes return undefined or empty', () => {
    expect(getProvince('9')).toBeUndefined();
    expect(getDistrict('999')).toBeUndefined();
    expect(getPalika('99999')).toBeUndefined();
    expect(getPalikaWards('99999')).toEqual([]);
    expect(getHierarchy('99999')).toBeUndefined();
  });

  it('non-string codes throw InvalidAdminError', () => {
    // @ts-expect-error testing
    expect(() => getProvince(1)).toThrow(InvalidAdminError);
    // @ts-expect-error testing
    expect(() => getPalika(null)).toThrow(InvalidAdminError);
    try {
      // @ts-expect-error testing
      getDistrict(undefined);
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      expect((error as InvalidAdminError).code).toBe('INVALID_ADMIN');
    }
  });

  it('hierarchy resolves province + district + palika', () => {
    expect(getHierarchy('10106')).toEqual({
      province: getProvince('1'),
      district: getDistrict('101'),
      palika: getPalika('10106'),
    });
  });

  it('ward lists are 1..N sequences', () => {
    expect(getPalikaWards('30304')).toEqual([1, 2, 3, 4, 5]);
    expect(getPalikaWards('30608')).toHaveLength(32);
  });
});

describe('admin ward validation', () => {
  it('accepts the official range, rejects the rest without throwing', () => {
    expect(isValidWard('30304', 1)).toBe(true);
    expect(isValidWard('30304', 5)).toBe(true);
    expect(isValidWard('30304', 0)).toBe(false);
    expect(isValidWard('30304', 6)).toBe(false);
    expect(isValidWard('30608', 32)).toBe(true);
    expect(isValidWard('30608', 33)).toBe(false);
    expect(isValidWard('99999', 1)).toBe(false);
    expect(isValidWard('30304', 2.5)).toBe(false);
    expect(isValidWard('30304', '1')).toBe(false);
    expect(isValidWard(null, 1)).toBe(false);
  });

  it('code validators check shape and existence', () => {
    expect(isProvinceCode('1')).toBe(true);
    expect(isProvinceCode('8')).toBe(false);
    expect(isProvinceCode(1)).toBe(false);
    expect(isDistrictCode('101')).toBe(true);
    expect(isDistrictCode('999')).toBe(false);
    expect(isDistrictCode('10')).toBe(false);
    expect(isPalikaCode('10106')).toBe(true);
    expect(isPalikaCode('1010')).toBe(false);
    expect(isPalikaCode('99999')).toBe(false);
  });
});

describe('admin name search', () => {
  it('finds across scripts, English case-insensitive', () => {
    expect(findProvincesByName('koshi').map((p) => p.code)).toEqual(['1']);
    expect(findProvincesByName('कोशी').map((p) => p.code)).toEqual(['1']);
    expect(findDistrictsByName('TAPLEJUNG').map((d) => d.code)).toEqual(['101']);
    expect(findDistrictsByName('ताप्लेजुङ').map((d) => d.code)).toEqual(['101']);
    const ktm = findPalikasByName('kathmandu').map((p) => p.code);
    expect(ktm).toContain('30608');
  });

  it('script filter and limit work', () => {
    expect(findPalikasByName('काठमाण्डौ', { script: 'en' })).toEqual([]);
    expect(findPalikasByName('kathmandu', { script: 'ne' })).toEqual([]);
    expect(findPalikasByName('a', { limit: 3 })).toHaveLength(3);
    expect(findPalikasByName('नगर', { script: 'ne', limit: 2 }).map((p) => p.code)).toEqual([
      '10106',
      '10206',
    ]);
    expect(findPalikasByName('a', { limit: 0 })).toEqual([]);
  });

  it('empty and missing queries return empty, non-strings throw', () => {
    expect(findPalikasByName('')).toEqual([]);
    expect(findPalikasByName('   ')).toEqual([]);
    expect(findPalikasByName('zzz-no-such-place')).toEqual([]);
    // @ts-expect-error testing
    expect(() => findPalikasByName(1)).toThrow(InvalidAdminError);
    // @ts-expect-error testing
    expect(() => findDistrictsByName(null)).toThrow(InvalidAdminError);
  });
});
