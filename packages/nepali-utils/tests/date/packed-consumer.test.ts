import { bs, toAD } from '../../src/date/convert.js';
import { Miti } from '../../src/date/value.js';
import { addDaysBS } from '../../src/date/arithmetic.js';
import { parseBS } from '../../src/date/parse.js';
import { range } from '../../src/date/range.js';
import { formatBS } from '../../src/date/format.js';
import { toDevanagari } from '../../src/number/digits.js';
import { monthName as monthNameEn } from '../../src/date/locale/en.js';
import { monthName as monthNameNe } from '../../src/date/locale/ne.js';
import { dateToAD } from '../../src/date/adapters/date.js';
import { plainDateToAD } from '../../src/date/adapters/temporal.js';
import * as timezone from '../../src/date/adapters/timezone.js';
import { getFiscalYear } from '../../src/date/fiscal.js';
import { relativePhrase } from '../../src/date/relative.js';
import { describe, expect, it } from 'vitest';

describe('packed consumer (all subpaths)', () => {
  it('exercises every published subpath', () => {
    expect(toAD(bs(2082, 4, 7))).toBeDefined();
    expect(new Miti(2082, 4, 7).toAD()).toBeDefined();
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
