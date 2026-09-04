import { describe, expect, it } from 'vitest';
import { dateToAD, adToDate } from '../../adapters/date.js';
import { plainDateToAD, adToPlainDate } from '../../adapters/temporal.js';
import { instantToAD } from '../../adapters/timezone.js';

/**
 * Adapter environment matrix (T09).
 *
 * Host-TZ independence notes:
 * - date adapter uses only getUTC* / setUTC* — never consults host TZ.
 * - timezone adapter requires explicit IANA zone; results must be identical
 *   regardless of process TZ (run suite with TZ=UTC and TZ=Pacific/Kiritimati).
 * - temporal adapter never interprets an instant; no TZ/offset logic involved.
 */

const FIXED = {
  utcMidnight: new Date('2024-03-10T00:00:00Z'),
  // US DST spring-forward day (America/New_York jumps 02:00 -> 03:00 on 2024-03-10)
  dstGapLocal: '2024-03-10T07:30:00Z', // 02:30 EST does not exist; 03:30 EDT
  dstFallBack: '2024-11-03T05:30:00Z', // ambiguous 01:30 EDT/EST hour in New York
  kathmandu: '2024-01-01T18:45:00Z', // 2024-01-02 00:30 in Asia/Kathmandu (+5:45)
};

describe('adapter environment matrix', () => {
  it('date adapter: fixed instants project to UTC civil dates', () => {
    expect(dateToAD(FIXED.utcMidnight)).toEqual({ year: 2024, month: 3, day: 10 });
    expect(dateToAD(new Date('2024-01-01T18:45:00Z'))).toEqual({ year: 2024, month: 1, day: 1 });
  });

  it('date adapter: round-trips through UTC midnight', () => {
    const d = adToDate({ year: 2024, month: 3, day: 10 });
    expect(d.toISOString()).toBe('2024-03-10T00:00:00.000Z');
    expect(dateToAD(d)).toEqual({ year: 2024, month: 3, day: 10 });
  });

  it('date adapter: host-TZ independence uses UTC getters', () => {
    // 00:30 +05:45 next-day local; UTC date must remain Jan 1.
    const instant = new Date('2024-01-01T18:45:00Z');
    expect(dateToAD(instant)).toEqual({ year: 2024, month: 1, day: 1 });
  });

  it('date adapter: invalid inputs throw', () => {
    expect(() => dateToAD(new Date(NaN))).toThrow();
    // @ts-expect-error intentional
    expect(() => dateToAD('2024-01-01')).toThrow();
    // @ts-expect-error intentional
    expect(() => dateToAD(null)).toThrow();
  });

  it('timezone adapter: DST spring-forward gap resolves via explicit zone', () => {
    expect(instantToAD(FIXED.dstGapLocal, 'America/New_York')).toEqual({
      year: 2024,
      month: 3,
      day: 10,
    });
  });

  it('timezone adapter: DST fall-back ambiguous hour resolves deterministically', () => {
    expect(instantToAD(FIXED.dstFallBack, 'America/New_York')).toEqual({
      year: 2024,
      month: 11,
      day: 3,
    });
  });

  it('timezone adapter: +5:45 offset crosses civil date boundary', () => {
    expect(instantToAD(FIXED.kathmandu, 'Asia/Kathmandu')).toEqual({
      year: 2024,
      month: 1,
      day: 2,
    });
    expect(instantToAD(FIXED.kathmandu, 'UTC')).toEqual({ year: 2024, month: 1, day: 1 });
  });

  it('timezone adapter: numeric and Date instants agree', () => {
    const ms = Date.parse(FIXED.kathmandu);
    expect(instantToAD(ms, 'Asia/Kathmandu')).toEqual(instantToAD(new Date(ms), 'Asia/Kathmandu'));
  });

  it('timezone adapter: invalid inputs throw', () => {
    expect(() => instantToAD('2024-01-01', 'UTC')).toThrow(); // missing offset
    expect(() => instantToAD('nope', 'UTC')).toThrow();
    expect(() => instantToAD(FIXED.kathmandu, '')).toThrow();
    expect(() => instantToAD(FIXED.kathmandu, 'Not/AZone')).toThrow();
    expect(() => instantToAD(Number.NaN, 'UTC')).toThrow();
  });

  it('temporal adapter: ISO plain dates convert without instant semantics', () => {
    expect(plainDateToAD({ year: 2024, month: 3, day: 10, calendarId: 'iso8601' })).toEqual({
      year: 2024,
      month: 3,
      day: 10,
    });
    expect(plainDateToAD({ year: 2024, month: 1, day: 2, calendar: 'iso8601' })).toEqual({
      year: 2024,
      month: 1,
      day: 2,
    });
  });

  it('temporal adapter: non-ISO calendars rejected', () => {
    expect(() => plainDateToAD({ year: 2024, month: 1, day: 1, calendarId: 'buddhist' })).toThrow();
    // @ts-expect-error intentional
    expect(() => plainDateToAD(null)).toThrow();
  });

  it('temporal adapter: adToPlainDate prefers .from() when present', () => {
    const seen: unknown[] = [];
    const fake = {
      PlainDate: {
        from: (v: unknown) => {
          seen.push(v);
          return { year: 2024, month: 5, day: 6, calendarId: 'iso8601' };
        },
      },
    };
    const out = adToPlainDate({ year: 2024, month: 5, day: 6 }, fake as never);
    expect(seen).toEqual([{ year: 2024, month: 5, day: 6, calendar: 'iso8601' }]);
    expect(out.year).toBe(2024);
  });
});
