import { describe, expect, it } from 'vitest';
import {
  formatHillArea, formatTeraiArea, fromSquareCentimetres, fromSquareFeet, fromSquareMetres,
  hillArea, teraiArea, toSquareFeet, toSquareMetres,
} from '../index.js';
import { InvalidAreaError } from '../errors.js';

describe('land edge cases', () => {
  it('cross-system exactness: terai display of a hill area converts back to equal um2', () => {
    const hill = hillArea({ ropani: 3, aana: 7, paisa: 2, daam: 3 });
    const shown = formatTeraiArea(hill);
    expect(shown).toBeTruthy();
    // Back-conversion through SI units preserves the exact micro-square-metre count.
    expect(fromSquareMetres(toSquareMetres(hill)).um2).toBe(hill.um2);
    expect(fromSquareFeet(toSquareFeet(hill)).um2).toBe(hill.um2);
  });

  it("fromSquareFeet('5476') equals hillArea({ropani:1}) in um2", () => {
    expect(fromSquareFeet('5476').um2).toBe(hillArea({ ropani: 1 }).um2);
  });

  it('divideExact half-up branch: sub-µm² amounts round up at the .5 boundary', () => {
    // 0.5 µm² = 0.0000000000005 m² rounds half-up to 1.
    expect(fromSquareMetres('0.0000000000005').um2).toBe(1n);
    // toSquareFeet of 1 daam exercises divideExact with a repeating quotient.
    expect(toSquareFeet(hillArea({ daam: 1 }))).toBe('21.390625');
  });

  it('omitZero:false full ladder strings', () => {
    expect(formatHillArea(hillArea({ ropani: 1 }), { omitZero: false })).toBe('१ रोपनी ० आना ० पैसा ० दाम');
    expect(formatTeraiArea(teraiArea({ bigha: 1 }), { omitZero: false })).toBe('१ बिघा ० कट्ठा ० धुर');
  });

  it('short + english combos', () => {
    expect(formatHillArea(hillArea({ ropani: 2, aana: 3 }), { language: 'en', numerals: 'ascii', style: 'short' })).toBe('2 R 3 A');
    expect(formatTeraiArea(teraiArea({ bigha: 1, kattha: 2 }), { language: 'en', numerals: 'ascii', style: 'short' })).toBe('1 B 2 K');
  });

  it('zero area renders in every renderer', () => {
    expect(formatHillArea(hillArea({}))).toBe('० दाम');
    expect(formatTeraiArea(teraiArea({}))).toBe('० धुर');
    expect(toSquareMetres(hillArea({}))).toBe('0');
    expect(toSquareFeet(teraiArea({}))).toBe('0');
    expect(fromSquareMetres('0').um2).toBe(0n);
  });

  it('from* negative inputs throw INVALID_AREA', () => {
    for (const fn of [fromSquareMetres, fromSquareFeet, fromSquareCentimetres]) {
      try {
        fn('-0.5');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidAreaError);
        expect((error as InvalidAreaError).code).toBe('INVALID_AREA');
      }
    }
  });
});
