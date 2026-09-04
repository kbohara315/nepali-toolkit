import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import source from '../data/generated/patro.json' with { type: 'json' };
import { metadata } from '../internal/data.js';
import { MONTH_PATTERNS, YEAR_PATTERN_IDS, YEAR_PREFIX } from '../internal/generated-data.js';
import { adToDayCount, dayCountToAD } from '../internal/gregorian.js';

describe('generated Patro runtime data', () => {
  it('reconstructs every source year exactly', () => {
    expect(YEAR_PATTERN_IDS).toHaveLength(source.table.length);
    expect(YEAR_PREFIX).toEqual(source.prefix);
    for (const [index, row] of source.table.entries()) {
      expect(MONTH_PATTERNS[YEAR_PATTERN_IDS[index]]).toEqual(row.months);
    }
  });

  it('checksums the source table and preserves metadata', () => {
    const checksum = createHash('sha256')
      .update(JSON.stringify(source.table))
      .digest('hex')
      .slice(0, 16);
    expect(checksum).toBe(source.checksum);
    expect(metadata.checksum).toBe(checksum);
    expect(metadata.totalDays).toBe(source.prefix.at(-1));
    expect(metadata.adStart).toEqual({ year: 1943, month: 4, day: 14 });
    expect(metadata.adEnd).toEqual({ year: 2034, month: 4, day: 13 });
  });

  it('keeps the generated source deterministic', () => {
    const generated = readFileSync(new URL('../internal/generated-data.ts', import.meta.url), 'utf8');
    expect(generated).toContain('MONTH_PATTERNS');
    expect(generated).toContain('YEAR_PATTERN_IDS');
    expect(generated).toContain('YEAR_PREFIX');
  });

  // Tripwire: generate-data.mjs carries its own copy of the gregorian day-count
  // math (node cannot import TS). Mirror of that copy — if either side drifts,
  // metadata adStart/adEnd silently go wrong. Update both sides together.
  it('keeps generator gregorian math in parity with internal/gregorian.ts', () => {
    const genADToDayCount = (year: number, month: number, day: number): number => {
      const a = Math.floor((14 - month) / 12);
      const yp = year + 4800 - a;
      const mp = month + 12 * a - 3;
      return (
        day +
        Math.floor((153 * mp + 2) / 5) +
        365 * yp +
        Math.floor(yp / 4) -
        Math.floor(yp / 100) +
        Math.floor(yp / 400) -
        32045 -
        2440588
      );
    };
    const genDayCountToAD = (n: number): [number, number, number] => {
      const a = n + 2440588 + 32044;
      const b = Math.floor((4 * a + 3) / 146097);
      const c = a - Math.floor((146097 * b) / 4);
      const d = Math.floor((4 * c + 3) / 1461);
      const e = c - Math.floor((1461 * d) / 4);
      const m = Math.floor((5 * e + 2) / 153);
      return [
        b * 100 + d - 4800 + Math.floor(m / 10),
        m + 3 - 12 * Math.floor(m / 10),
        e - Math.floor((153 * m + 2) / 5) + 1,
      ];
    };
    const spread: Array<[number, number, number]> = [
      [1970, 1, 1], // epoch
      [1900, 2, 28], // non-leap century
      [2000, 2, 29], // leap century
      [2100, 2, 28], // non-leap century
      [1943, 4, 14], // range start
      [2034, 4, 13], // range end
    ];
    for (const [y, m, d] of spread) {
      expect(adToDayCount(y, m, d)).toBe(genADToDayCount(y, m, d));
      const back = dayCountToAD(genADToDayCount(y, m, d));
      expect([back.year, back.month, back.day]).toEqual(genDayCountToAD(genADToDayCount(y, m, d)));
    }
    const start = adToDayCount(1943, 4, 14);
    const end = adToDayCount(2034, 4, 13);
    for (let n = start; n <= end; n += 997) {
      expect(adToDayCount(...(genDayCountToAD(n) as [number, number, number]))).toBe(n);
      const { year, month, day } = dayCountToAD(n);
      expect(genADToDayCount(year, month, day)).toBe(n);
    }
  });
});
