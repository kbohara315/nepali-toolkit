import { describe, expect, it } from 'vitest';
import { ad } from '../../src/date/types.js';
import { adToDate, dateToAD } from '../../src/date/adapters/date.js';
import { adToPlainDate, plainDateToAD } from '../../src/date/adapters/temporal.js';
import { instantToAD } from '../../src/date/adapters/timezone.js';
import { InvalidInstantError, InvalidTimeZoneError } from '../../src/date/errors.js';

describe('date adapters', () => {
  it('uses UTC fields and UTC midnight', () => {
    const instant = new Date('2025-07-23T23:30:00.000Z');
    expect(dateToAD(instant)).toEqual(ad(2025, 7, 23));
    expect(adToDate(ad(2025, 7, 23)).toISOString()).toBe('2025-07-23T00:00:00.000Z');
  });

  it('uses an injected Temporal-like namespace without a hard dependency', () => {
    const temporal = {
      PlainDate: {
        from(value: { year: number; month: number; day: number; calendar: string }) {
          return { ...value, calendarId: value.calendar };
        },
      },
    } as any;
    const plain = adToPlainDate(ad(2025, 7, 23), temporal);
    expect(plainDateToAD(plain)).toEqual(ad(2025, 7, 23));
  });

  it('requires an explicit timezone for instant projection', () => {
    expect(instantToAD('2025-07-23T23:30:00Z', 'Asia/Kathmandu')).toEqual(ad(2025, 7, 24));
    expect(() => instantToAD('2025-07-23T00:00:00Z', 'Not/AZone')).toThrow(InvalidTimeZoneError);
    expect(() => instantToAD('2025-07-23T00:30:00', 'UTC')).toThrow(InvalidInstantError);
  });
});
