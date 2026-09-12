import { bs, toAD } from '../convert.js';
import { NepaliDate } from '../value.js';
import { addDaysBS } from '../arithmetic.js';
import { parseBS } from '../parse.js';
import { range } from '../range.js';
import { formatBS } from '../format.js';
import { toDevanagari } from '../../number/digits.js';
import { monthName as monthNameEn } from '../locale/en.js';
import { monthName as monthNameNe } from '../locale/ne.js';
import { dateToAD } from '../adapters/date.js';
import { plainDateToAD } from '../adapters/temporal.js';
import * as timezone from '../adapters/timezone.js';
import { getFiscalYear } from '../fiscal.js';
import { relativePhrase } from '../relative.js';
import { describe, expect, it } from 'vitest';

describe('packed consumer (all subpaths)', () => {
  it('exercises every published subpath', () => {
    expect(toAD(bs(2082, 4, 7))).toBeDefined();
    expect(new NepaliDate(2082, 4, 7).toAD()).toBeDefined();
    expect(addDaysBS({ year: 2082, month: 4, day: 7 }, 1)).toBeDefined();
    expect(parseBS('2082-04-07')).toBeDefined();
    expect(range.bsStart.year).toBeLessThanOrEqual(2082);
    expect(formatBS({ year: 2082, month: 4, day: 7 }, 'YYYY-MM-DD')).toContain('2082');
    expect(toDevanagari('2082')).toBeDefined();
    expect(monthNameEn(4)).toBeTruthy();
    expect(monthNameNe(4)).toBeTruthy();
    expect(dateToAD(new Date(Date.UTC(2025, 7, 6)))).toBeDefined();
    expect(plainDateToAD({ year: 2025, month: 8, day: 6, calendarId: 'iso8601' })).toBeDefined();
    expect(Object.keys(timezone).length).toBeGreaterThan(0);
    expect(getFiscalYear({ year: 2082, month: 4, day: 7 })).toBeDefined();
    expect(relativePhrase(1)).toBeTruthy();
  });
});
