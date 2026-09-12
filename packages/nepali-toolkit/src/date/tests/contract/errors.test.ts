import { describe, expect, it } from 'vitest';
import {
  ERROR_CODES,
  InvalidArithmeticAmountError,
  InvalidCalendarError,
  InvalidCivilDateError,
  InvalidFieldError,
  InvalidFiscalYearError,
  InvalidInstantError,
  InvalidTimeZoneError,
  ParseError,
  UnsupportedDateError,
} from '../../errors.js';
import { toAD, toBS } from '../../internal/conversion.js';
import { ad, bs } from '../../types.js';
import { addDaysBS, addMonthsBS } from '../../arithmetic.js';
import { parseBS } from '../../parse.js';
import { fiscalYearStart } from '../../fiscal.js';
import { dateToAD } from '../../adapters/date.js';
import { instantToAD } from '../../adapters/timezone.js';
import { plainDateToAD } from '../../adapters/temporal.js';

function expectCoded(fn: () => unknown, Ctor: new (...args: never[]) => Error, code: string) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(Ctor);
    expect((error as { code?: unknown }).code).toBe(code);
    return;
  }
  throw new Error(`Expected ${(Ctor as { name?: string }).name} (${code})`);
}

describe('stable error-contract matrix', () => {
  it('INVALID_FIELD via InvalidFieldError', () => {
    expectCoded(
      () => toAD({ year: 2082.5, month: 4, day: 7 } as never),
      InvalidFieldError,
      ERROR_CODES.invalidField,
    );
    expect(InvalidFieldError.prototype).toBeInstanceOf(TypeError);
  });
  it('INVALID_CIVIL_DATE via InvalidCivilDateError', () => {
    expectCoded(
      () => toAD({ year: 2082, month: 13, day: 1 }),
      InvalidCivilDateError,
      ERROR_CODES.invalidCivilDate,
    );
    expectCoded(
      () => addMonthsBS(bs(2082, 5, 32), 1, { overflow: 'reject' }),
      InvalidCivilDateError,
      ERROR_CODES.invalidCivilDate,
    );
  });
  it('UNSUPPORTED_DATE via UnsupportedDateError', () => {
    expectCoded(() => toBS(ad(2100, 1, 1)), UnsupportedDateError, ERROR_CODES.unsupportedDate);
  });
  it('INVALID_ARITHMETIC_AMOUNT via InvalidArithmeticAmountError', () => {
    expectCoded(
      () => addDaysBS(bs(2082, 4, 1), 1.5),
      InvalidArithmeticAmountError,
      ERROR_CODES.invalidArithmeticAmount,
    );
  });
  it('PARSE_ERROR via ParseError', () => {
    expectCoded(() => parseBS('not-a-date'), ParseError, ERROR_CODES.parseError);
  });
  it('INVALID_INSTANT via InvalidInstantError', () => {
    expectCoded(() => dateToAD(new Date(NaN)), InvalidInstantError, ERROR_CODES.invalidInstant);
    expectCoded(
      () => instantToAD('2025-01-01', 'Asia/Kathmandu'),
      InvalidInstantError,
      ERROR_CODES.invalidInstant,
    );
  });
  it('INVALID_TIME_ZONE via InvalidTimeZoneError', () => {
    expectCoded(
      () => instantToAD(Date.UTC(2025, 0, 1), ''),
      InvalidTimeZoneError,
      ERROR_CODES.invalidTimeZone,
    );
    expectCoded(
      () => instantToAD(Date.UTC(2025, 0, 1), 'Not/AZone'),
      InvalidTimeZoneError,
      ERROR_CODES.invalidTimeZone,
    );
  });
  it('INVALID_CALENDAR via InvalidCalendarError', () => {
    expectCoded(
      () => plainDateToAD({ year: 2025, month: 1, day: 1, calendarId: 'buddhist' }),
      InvalidCalendarError,
      ERROR_CODES.invalidCalendar,
    );
  });
  it('INVALID_FISCAL_YEAR via InvalidFiscalYearError', () => {
    expectCoded(() => fiscalYearStart(1.5), InvalidFiscalYearError, ERROR_CODES.invalidFiscalYear);
  });
});
