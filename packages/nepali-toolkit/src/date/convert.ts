/**
 * Public conversion contract (`nepali-toolkit/date/convert`).
 *
 * Guarantees:
 * - Bijection: `toAD`/`toBS` are exact inverses within the supported range.
 * - Supported range: BS 2000-01-01..2090-12-30 (AD 1943-04-14..2034-04-13).
 * - Strict validation: branded {@link ADDate}/{@link BSDate} inputs only on the
 *   `toAD`/`toBS` path; out-of-range inputs throw {@link UnsupportedDateError},
 *   malformed fields throw {@link InvalidFieldError}.
 * - Reference pair: BS 2000-01-01 <-> AD 1943-04-14.
 *
 * This module owns the contract documentation; the implementation lives in
 * `./internal/conversion.js` and the nominal brands in `./types.js`.
 */
export { ad, bs, toAD, toBS } from './internal/conversion.js';
export type { ADDate, ADDateFields, BSDate, BSDateFields, DateFields } from './types.js';
export {
  ERROR_CODES,
  InvalidArithmeticAmountError,
  InvalidCivilDateError,
  InvalidFieldError,
  InvalidFiscalYearError,
  InvalidInstantError,
  InvalidCalendarError,
  InvalidTimeZoneError,
  ParseError,
  UnsupportedDateError,
} from './errors.js';
