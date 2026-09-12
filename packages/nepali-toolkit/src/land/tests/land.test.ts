import { describe, expect, it } from 'vitest';
import { InvalidNumberError } from '../../number/errors.js';
import {
  formatHillArea,
  formatTeraiArea,
  fromSquareCentimetres,
  fromSquareFeet,
  fromSquareMetres,
  hillArea,
  teraiArea,
  toSquareCentimetres,
  toSquareFeet,
  toSquareMetres,
} from '../index.js';
import { InvalidAreaError } from '../errors.js';

describe('land ladders', () => {
  it('16 aana equals 1 ropani as exact um2', () => {
    expect(hillArea({ aana: 16 }).um2).toBe(hillArea({ ropani: 1 }).um2);
  });

  it('400 dhur equals 1 bigha as exact um2', () => {
    expect(teraiArea({ dhur: 400 }).um2).toBe(teraiArea({ bigha: 1 }).um2);
  });

  it('known values: 1 ropani', () => {
    expect(toSquareMetres(hillArea({ ropani: 1 }))).toBe('508.72');
    expect(toSquareFeet(hillArea({ ropani: 1 }))).toBe('5476');
  });

  it('known values: 1 bigha', () => {
    expect(toSquareMetres(teraiArea({ bigha: 1 }))).toBe('6772.63');
    expect(toSquareFeet(teraiArea({ bigha: 1 }))).toBe('72900');
  });

  it('normalizes overflowing subordinate units', () => {
    expect(hillArea({ aana: 20 }).um2).toBe(hillArea({ ropani: 1, aana: 4 }).um2);
    expect(formatHillArea(hillArea({ aana: 20 }))).toBe('१ रोपनी ४ आना');
    expect(teraiArea({ dhur: 25 }).um2).toBe(teraiArea({ kattha: 1, dhur: 5 }).um2);
  });
});

describe('land validation', () => {
  it.each([
    [{ ropani: -1 }, 'ropani'],
    [{ aana: 1.5 }, 'aana'],
    [{ paisa: Number.NaN }, 'paisa'],
    [{ daam: Number.POSITIVE_INFINITY }, 'daam'],
  ])('rejects hill input %o', (fields) => {
    try {
      hillArea(fields);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidAreaError);
      expect(error).toBeInstanceOf(TypeError);
      expect((error as InvalidAreaError).code).toBe('INVALID_AREA');
    }
  });

  it.each([[{ bigha: -1 }], [{ kattha: 0.5 }], [{ dhur: Number.NaN }]])(
    'rejects terai input %o',
    (fields) => {
      try {
        teraiArea(fields);
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidAreaError);
        expect((error as InvalidAreaError).code).toBe('INVALID_AREA');
      }
    },
  );

  it('rejects negative from* input with InvalidAreaError', () => {
    for (const fn of [fromSquareMetres, fromSquareFeet]) {
      try {
        fn('-1');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidAreaError);
        expect((error as InvalidAreaError).code).toBe('INVALID_AREA');
      }
    }
  });

  it(' surfaces the number engine InvalidNumberError for malformed from* input', () => {
    for (const fn of [fromSquareMetres, fromSquareFeet]) {
      try {
        fn('abc');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidNumberError);
        expect(error).not.toBeInstanceOf(InvalidAreaError);
      }
    }
  });
});

describe('land display', () => {
  it('formats devanagari long by default', () => {
    expect(formatHillArea(hillArea({ ropani: 2, aana: 3, paisa: 1, daam: 2 }))).toBe(
      '२ रोपनी ३ आना १ पैसा २ दाम',
    );
    expect(formatTeraiArea(teraiArea({ bigha: 1, kattha: 2, dhur: 3 }))).toBe(
      '१ बिघा २ कट्ठा ३ धुर',
    );
  });

  it('supports ascii numerals and short labels', () => {
    expect(
      formatHillArea(hillArea({ ropani: 2, aana: 3, paisa: 1, daam: 2 }), {
        numerals: 'ascii',
        style: 'short',
      }),
    ).toBe('2 रो 3 आ 1 पै 2 दा');
    expect(
      formatTeraiArea(teraiArea({ bigha: 1, kattha: 2, dhur: 3 }), {
        numerals: 'ascii',
        style: 'short',
      }),
    ).toBe('1 बि 2 क 3 ध');
  });

  it('omitZero:false keeps zero units; zero area falls back to smallest unit', () => {
    expect(formatHillArea(hillArea({ ropani: 1 }), { omitZero: false })).toBe(
      '१ रोपनी ० आना ० पैसा ० दाम',
    );
    expect(formatHillArea(hillArea({}))).toBe('० दाम');
    expect(formatTeraiArea(teraiArea({}))).toBe('० धुर');
    expect(formatHillArea(hillArea({}), { numerals: 'ascii' })).toBe('0 दाम');
  });

  it('cross-system display is exact-area based', () => {
    expect(formatTeraiArea(hillArea({ ropani: 1 }))).toBe('१ कट्ठा १० धुर');
    expect(formatHillArea(teraiArea({ bigha: 1 }), { numerals: 'ascii', style: 'short' })).toBe('13 रो 5 आ');
  });
});

describe('land from* conversions', () => {
  it('round-trips square metres', () => {
    expect(toSquareMetres(fromSquareMetres('508.72'))).toBe('508.72');
    expect(fromSquareMetres('508.72').um2).toBe(hillArea({ ropani: 1 }).um2);
  });

  it('accepts Devanagari input', () => {
    expect(fromSquareMetres('५०८.७२').um2).toBe(hillArea({ ropani: 1 }).um2);
    expect(fromSquareFeet('५४७६').um2).toBe(hillArea({ ropani: 1 }).um2);
  });

  it('rounds half-up to whole µm²', () => {
    expect(fromSquareMetres('0.0000000000005').um2).toBe(1n);
    expect(fromSquareMetres('0.0000000000004').um2).toBe(0n);
  });
});

describe('land square centimetres', () => {
  it('converts exactly', () => {
    expect(toSquareCentimetres(hillArea({ ropani: 1 }))).toBe('5087200');
    expect(toSquareCentimetres(teraiArea({ bigha: 1 }))).toBe('67726300');
    expect(toSquareCentimetres(hillArea({ daam: 1 }))).toBe('19871.875');
  });

  it('round-trips', () => {
    expect(toSquareCentimetres(fromSquareCentimetres('5087200'))).toBe('5087200');
    expect(fromSquareCentimetres('5087200').um2).toBe(hillArea({ ropani: 1 }).um2);
    expect(fromSquareCentimetres('५०८७२००').um2).toBe(hillArea({ ropani: 1 }).um2);
  });
});

describe('land english output', () => {
  it('renders long english labels', () => {
    expect(
      formatHillArea(hillArea({ ropani: 2, aana: 3, paisa: 1, daam: 2 }), {
        language: 'en',
        numerals: 'ascii',
      }),
    ).toBe('2 Ropani 3 Aana 1 Paisa 2 Daam');
    expect(
      formatTeraiArea(teraiArea({ bigha: 1, kattha: 2, dhur: 3 }), {
        language: 'en',
        numerals: 'ascii',
      }),
    ).toBe('1 Bigha 2 Kattha 3 Dhur');
  });

  it('renders short english labels', () => {
    expect(
      formatHillArea(hillArea({ ropani: 1 }), { language: 'en', numerals: 'ascii', style: 'short' }),
    ).toBe('1 R');
    expect(
      formatTeraiArea(teraiArea({ bigha: 1 }), { language: 'en', numerals: 'ascii', style: 'short' }),
    ).toBe('1 B');
  });

  it('rejects unknown language', () => {
    expect(() => formatHillArea(hillArea({ ropani: 1 }), { language: 'fr' as 'ne' })).toThrow(
      InvalidAreaError,
    );
  });
});
