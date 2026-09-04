export { toAD, toBS } from './convert.js';
import { B as BSDate, A as ADDate, a as ADDateFields, b as BSDateFields } from '../types-DiHJisXT.js';
export { D as DateFields, c as ad, d as bs } from '../types-DiHJisXT.js';
export { E as ERROR_CODES, I as InvalidArithmeticAmountError, a as InvalidCalendarError, b as InvalidCivilDateError, c as InvalidFieldError, d as InvalidFiscalYearError, e as InvalidInstantError, f as InvalidTimeZoneError, P as ParseError, U as UnsupportedDateError } from '../errors-C9ZtWKZp.js';
import { Weekday, MonthArithmeticOptions } from './arithmetic.js';
export { Age, MonthOverflow, addADMonths, addADYears, addBSMonths, addBSYears, addDays, addDaysAD, addDaysBS, addMonthsAD, addMonthsBS, addWeeks, addWeeksAD, addWeeksBS, addYearsAD, addYearsBS, ageOnAD, ageOnBS, compare, compareAD, compareBS, daysInMonthAD, daysInMonthBS, daysInYearBS, differenceInDays, differenceInDaysAD, differenceInDaysBS, differenceInMonthsAD, differenceInMonthsBS, differenceInYearsAD, differenceInYearsBS, equal, equalAD, equalBS, isLeapYearAD, isValidAD, isValidBS, iterateAD, iterateBS, weekday, weekdayAD, weekdayBS } from './arithmetic.js';
export { englishADLocale, englishBSLocale, formatAD, formatBS, formatWithLocale } from './format.js';
export { parseAD, parseBS } from './parse.js';
import { toDevanagari } from '../number/digits.js';
export { toAscii } from '../number/digits.js';
export { fiscalYear, fiscalYearEnd, fiscalYearInfo, fiscalYearStart, formatFiscalYear, getFiscalYear, isInFiscalYear } from './fiscal.js';
export { daysBetween, englishRelativeLocale, formatRelative, formatRelativeDays, nepaliRelativeLocale, differenceInDays as relativeDifferenceInDays, relativePhrase } from './relative.js';
export { range } from './range.js';

/** Immutable value for one supported BS/AD civil day. */
declare class Miti {
    #private;
    private constructor();
    static fromBS(value: BSDate): Miti;
    static fromAD(value: ADDate): Miti;
    toBS(): BSDate;
    toAD(): ADDate;
    equals(other: Miti): boolean;
    compare(other: Miti): -1 | 0 | 1;
    addDays(amount: number): Miti;
    addWeeks(amount: number): Miti;
    differenceInDays(other: Miti): number;
    weekday(): Weekday;
    clone(): Miti;
    addMonthsBS(amount: number, options?: MonthArithmeticOptions): Miti;
    addYearsBS(amount: number, options?: MonthArithmeticOptions): Miti;
    addMonthsAD(amount: number, options?: MonthArithmeticOptions): Miti;
    addYearsAD(amount: number, options?: MonthArithmeticOptions): Miti;
    startOfMonthBS(): Miti;
    endOfMonthBS(): Miti;
    startOfMonthAD(): Miti;
    endOfMonthAD(): Miti;
    serialize(): string;
    serializeBS(): string;
    static fromISO(value: string): Miti;
    static fromSerial(value: string): Miti;
    static fromBSString(value: string): Miti;
    toString(): string;
    toJSON(): string;
}

interface DisplayLocale {
    readonly months: readonly string[];
    readonly weekdays?: readonly string[];
    readonly weekdaysShort?: readonly string[];
    readonly numerals?: (value: string) => string;
    readonly ordinal?: (day: number) => string;
}
interface DisplayOptions {
    readonly locale?: DisplayLocale;
    readonly numerals?: 'ascii' | 'devanagari' | ((value: string) => string);
    /** Weekday index 0=Sunday..6=Saturday, required for ddd/dddd tokens. */
    readonly weekday?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}
/**
 * Format a BS date with display tokens: YYYY, YY, M, MM, MMMM, D, DD, do, ddd, dddd.
 * ddd/dddd require the weekday option. Punctuation is literal; use [text] or 'text' to escape.
 */
declare function formatBSDisplay(date: BSDateFields, pattern: string, localeOrOptions?: DisplayLocale | DisplayOptions): string;
/** Format an AD date with display tokens using Gregorian English month names by default. */
declare function formatADDisplay(date: ADDateFields, pattern: string, localeOrOptions?: DisplayLocale | DisplayOptions): string;
/** Format either date shape with display tokens and an explicitly supplied locale. */
declare function formatDisplayWithLocale(date: BSDateFields | ADDateFields, pattern: string, locale: DisplayLocale, options?: Omit<DisplayOptions, 'locale'>): string;

declare const locale$1: {
    readonly months: readonly ["Baisakh", "Jestha", "Asar", "Shrawan", "Bhadra", "Aswin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];
    readonly weekdays: readonly ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
};

declare const locale: {
    readonly months: readonly ["बैशाख", "जेठ", "असार", "श्रावण", "भाद्र", "आश्विन", "कार्तिक", "मंसिर", "पौष", "माघ", "फाल्गुण", "चैत्र"];
    readonly weekdays: readonly ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहिबार", "शुक्रबार", "शनिबार"];
    readonly numerals: typeof toDevanagari;
};

/** Project an instant to its UTC civil date. The host timezone is never consulted. */
declare function dateToAD(value: Date): ADDate;
/** Construct an instant at UTC midnight for an AD civil date. */
declare function adToDate(value: ADDateFields): Date;

interface PlainDateLike {
    readonly year: number;
    readonly month: number;
    readonly day: number;
    readonly calendarId?: string;
    readonly calendar?: string | {
        readonly id?: string;
    };
}
interface TemporalLike {
    readonly PlainDate: {
        new (year: number, month: number, day: number, calendar?: string): PlainDateLike;
        from?: (value: {
            year: number;
            month: number;
            day: number;
            calendar: string;
        }) => PlainDateLike;
    };
}
/** Convert an ISO-calendar Temporal.PlainDate without interpreting it as an instant. */
declare function plainDateToAD(value: PlainDateLike): ADDate;
/** Convert an AD civil date to Temporal.PlainDate, requiring an available Temporal runtime. */
declare function adToPlainDate(value: ADDateFields, temporal?: TemporalLike): PlainDateLike;

type Instant = Date | number | string;
/** Project an instant into an AD date using an explicit IANA timezone. */
declare function instantToAD(value: Instant, timeZone: string): ADDate;

export { ADDate, ADDateFields, BSDate, BSDateFields, type DisplayLocale, type DisplayOptions, Miti, MonthArithmeticOptions, adToDate, adToPlainDate, dateToAD, locale$1 as englishLocale, formatADDisplay, formatBSDisplay, formatDisplayWithLocale, instantToAD, locale as nepaliLocale, plainDateToAD, toDevanagari };
