import { B as BSDate, A as ADDate } from '../types-DiHJisXT.js';
export { a as ADDateFields, b as BSDateFields, D as DateFields, c as ad, d as bs } from '../types-DiHJisXT.js';
export { E as ERROR_CODES, I as InvalidArithmeticAmountError, a as InvalidCalendarError, b as InvalidCivilDateError, c as InvalidFieldError, d as InvalidFiscalYearError, e as InvalidInstantError, f as InvalidTimeZoneError, P as ParseError, U as UnsupportedDateError } from '../errors-C9ZtWKZp.js';

declare function toAD(value: BSDate): ADDate;
declare function toBS(value: ADDate): BSDate;

export { ADDate, BSDate, toAD, toBS };
