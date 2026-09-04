export const ERROR_CODES = {
  invalidField: 'INVALID_FIELD',
  invalidCivilDate: 'INVALID_CIVIL_DATE',
  unsupportedDate: 'UNSUPPORTED_DATE',
  invalidArithmeticAmount: 'INVALID_ARITHMETIC_AMOUNT',
  parseError: 'PARSE_ERROR',
  invalidInstant: 'INVALID_INSTANT',
  invalidTimeZone: 'INVALID_TIME_ZONE',
  invalidCalendar: 'INVALID_CALENDAR',
  invalidFiscalYear: 'INVALID_FISCAL_YEAR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
export type MitiErrorCode = ErrorCode;

interface CodedError {
  readonly code: ErrorCode;
}

function setName(error: Error, name: string): void {
  error.name = name;
}

export class InvalidFieldError extends TypeError implements CodedError {
  readonly code = ERROR_CODES.invalidField;

  constructor(message = 'Date fields must be finite integers') {
    super(message);
    setName(this, 'InvalidFieldError');
  }
}

export class InvalidCivilDateError extends RangeError implements CodedError {
  readonly code = ERROR_CODES.invalidCivilDate;

  constructor(message = 'Invalid civil date') {
    super(message);
    setName(this, 'InvalidCivilDateError');
  }
}

export class UnsupportedDateError extends RangeError implements CodedError {
  readonly code = ERROR_CODES.unsupportedDate;

  constructor(message = 'Date is outside the supported range') {
    super(message);
    setName(this, 'UnsupportedDateError');
  }
}

export class InvalidArithmeticAmountError extends TypeError implements CodedError {
  readonly code = ERROR_CODES.invalidArithmeticAmount;

  constructor(message = 'Arithmetic amounts must be safe integers') {
    super(message);
    setName(this, 'InvalidArithmeticAmountError');
  }
}

/** Reserved for the strict parser introduced after the foundation phase. */
export class ParseError extends Error implements CodedError {
  readonly code = ERROR_CODES.parseError;

  constructor(message = 'Unable to parse date') {
    super(message);
    setName(this, 'ParseError');
  }
}

export class InvalidInstantError extends RangeError implements CodedError {
  readonly code = ERROR_CODES.invalidInstant;

  constructor(message = 'Invalid instant') {
    super(message);
    setName(this, 'InvalidInstantError');
  }
}

export class InvalidTimeZoneError extends RangeError implements CodedError {
  readonly code = ERROR_CODES.invalidTimeZone;

  constructor(message = 'Invalid IANA timezone', options?: ErrorOptions) {
    super(message, options);
    setName(this, 'InvalidTimeZoneError');
  }
}

export class InvalidCalendarError extends RangeError implements CodedError {
  readonly code = ERROR_CODES.invalidCalendar;

  constructor(message = 'Unsupported calendar') {
    super(message);
    setName(this, 'InvalidCalendarError');
  }
}

export class InvalidFiscalYearError extends RangeError implements CodedError {
  readonly code = ERROR_CODES.invalidFiscalYear;

  constructor(message = 'Invalid fiscal year') {
    super(message);
    setName(this, 'InvalidFiscalYearError');
  }
}
