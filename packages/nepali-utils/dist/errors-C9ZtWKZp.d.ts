declare const ERROR_CODES: {
    readonly invalidField: "INVALID_FIELD";
    readonly invalidCivilDate: "INVALID_CIVIL_DATE";
    readonly unsupportedDate: "UNSUPPORTED_DATE";
    readonly invalidArithmeticAmount: "INVALID_ARITHMETIC_AMOUNT";
    readonly parseError: "PARSE_ERROR";
    readonly invalidInstant: "INVALID_INSTANT";
    readonly invalidTimeZone: "INVALID_TIME_ZONE";
    readonly invalidCalendar: "INVALID_CALENDAR";
    readonly invalidFiscalYear: "INVALID_FISCAL_YEAR";
};
type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
interface CodedError {
    readonly code: ErrorCode;
}
declare class InvalidFieldError extends TypeError implements CodedError {
    readonly code: "INVALID_FIELD";
    constructor(message?: string);
}
declare class InvalidCivilDateError extends RangeError implements CodedError {
    readonly code: "INVALID_CIVIL_DATE";
    constructor(message?: string);
}
declare class UnsupportedDateError extends RangeError implements CodedError {
    readonly code: "UNSUPPORTED_DATE";
    constructor(message?: string);
}
declare class InvalidArithmeticAmountError extends TypeError implements CodedError {
    readonly code: "INVALID_ARITHMETIC_AMOUNT";
    constructor(message?: string);
}
/** Reserved for the strict parser introduced after the foundation phase. */
declare class ParseError extends Error implements CodedError {
    readonly code: "PARSE_ERROR";
    constructor(message?: string);
}
declare class InvalidInstantError extends RangeError implements CodedError {
    readonly code: "INVALID_INSTANT";
    constructor(message?: string);
}
declare class InvalidTimeZoneError extends RangeError implements CodedError {
    readonly code: "INVALID_TIME_ZONE";
    constructor(message?: string, options?: ErrorOptions);
}
declare class InvalidCalendarError extends RangeError implements CodedError {
    readonly code: "INVALID_CALENDAR";
    constructor(message?: string);
}
declare class InvalidFiscalYearError extends RangeError implements CodedError {
    readonly code: "INVALID_FISCAL_YEAR";
    constructor(message?: string);
}

export { ERROR_CODES as E, InvalidArithmeticAmountError as I, ParseError as P, UnsupportedDateError as U, InvalidCalendarError as a, InvalidCivilDateError as b, InvalidFieldError as c, InvalidFiscalYearError as d, InvalidInstantError as e, InvalidTimeZoneError as f };
