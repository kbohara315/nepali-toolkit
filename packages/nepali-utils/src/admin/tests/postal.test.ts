import { describe, expect, it } from 'vitest';
import {
  getPalika,
  getPalikas,
  getPostalCode,
  getWardPostalCode,
  InvalidAdminError,
  parsePostalCode,
} from '../index.js';

describe('admin postal codes (GPO scheme, derived)', () => {
  it('palika pin equals the 5-digit NSO code for all 753 palikas', () => {
    for (const p of getPalikas()) {
      expect(getPostalCode(p.code)).toBe(p.code);
    }
    expect(getPostalCode('10101')).toBe('10101');
    expect(getPostalCode('99999')).toBeUndefined();
  });

  it('ward pins are code + zero-padded ward across the full range', () => {
    // GPO spot checks: Phaktanlung (7 wards), Kathmandu metro (32 wards).
    expect(getWardPostalCode('10101', 1)).toBe('1010101');
    expect(getWardPostalCode('10101', 7)).toBe('1010107');
    expect(getWardPostalCode('30608', 1)).toBe('3060801');
    expect(getWardPostalCode('30608', 32)).toBe('3060832');
    for (const p of getPalikas()) {
      expect(getWardPostalCode(p.code, 1)).toBe(`${p.code}01`);
      expect(getWardPostalCode(p.code, p.wards)).toBe(
        `${p.code}${String(p.wards).padStart(2, '0')}`,
      );
    }
  });

  it('out-of-range wards and bad inputs return undefined', () => {
    expect(getWardPostalCode('10101', 0)).toBeUndefined();
    expect(getWardPostalCode('10101', 8)).toBeUndefined();
    expect(getWardPostalCode('99999', 1)).toBeUndefined();
    expect(getWardPostalCode('10101', 1.5)).toBeUndefined();
    // @ts-expect-error testing
    expect(getWardPostalCode('10101', '1')).toBeUndefined();
    // @ts-expect-error testing
    expect(getWardPostalCode(null, 1)).toBeUndefined();
  });

  it('parsePostalCode resolves both levels and rejects the rest', () => {
    expect(parsePostalCode('10101')).toEqual({
      kind: 'palika',
      postalCode: '10101',
      palika: getPalika('10101'),
    });
    expect(parsePostalCode('1010107')).toEqual({
      kind: 'ward',
      postalCode: '1010107',
      palika: getPalika('10101'),
      ward: 7,
    });
    expect(parsePostalCode('1010100')).toBeUndefined(); // ward 00
    expect(parsePostalCode('1010108')).toBeUndefined(); // ward > wards
    expect(parsePostalCode('99999')).toBeUndefined();
    expect(parsePostalCode('9999901')).toBeUndefined();
    expect(parsePostalCode('1010')).toBeUndefined();
    expect(parsePostalCode('101010')).toBeUndefined();
    expect(parsePostalCode('abcde')).toBeUndefined();
    // @ts-expect-error testing
    expect(() => parsePostalCode(10101)).toThrow(InvalidAdminError);
  });
});
