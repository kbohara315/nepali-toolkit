import { A as ADDate, B as BSDate } from '../types-DiHJisXT.js';
export { c as ad, d as bs } from '../types-DiHJisXT.js';
export { I as InvalidArithmeticAmountError } from '../errors-C9ZtWKZp.js';

/** Proleptic Gregorian leap-year rule. */
declare function isLeapYearAD(year: number): boolean;

type MonthOverflow = 'constrain' | 'reject';
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
interface MonthArithmeticOptions {
    readonly overflow?: MonthOverflow;
}
declare function compareAD(left: ADDate, right: ADDate): -1 | 0 | 1;
declare function equalAD(left: ADDate, right: ADDate): boolean;
declare function differenceInDaysAD(left: ADDate, right: ADDate): number;
declare function addDaysAD(value: ADDate, amount: number): ADDate;
declare function addWeeksAD(value: ADDate, amount: number): ADDate;
declare function weekdayAD(value: ADDate): Weekday;
declare function compareBS(left: BSDate, right: BSDate): -1 | 0 | 1;
declare function equalBS(left: BSDate, right: BSDate): boolean;
declare function differenceInDaysBS(left: BSDate, right: BSDate): number;
declare function addDaysBS(value: BSDate, amount: number): BSDate;
declare function addWeeksBS(value: BSDate, amount: number): BSDate;
declare function weekdayBS(value: BSDate): Weekday;
/** Add calendar months in BS, constraining the day by default. */
declare function addMonthsBS(value: BSDate, amount: number, options?: MonthArithmeticOptions): BSDate;
/** Add calendar years in BS, constraining the day by default. */
declare function addYearsBS(value: BSDate, amount: number, options?: MonthArithmeticOptions): BSDate;
declare const addBSMonths: typeof addMonthsBS;
declare const addBSYears: typeof addYearsBS;
/** Days in a BS month; range-checked. */
declare function daysInMonthBS(value: BSDate): number;
/** Days in an AD month. */
declare function daysInMonthAD(value: ADDate): number;
/** Total days in a BS year. */
declare function daysInYearBS(year: number): number;
/** Non-throwing BS validation for form use. */
declare function isValidBS(year: number, month: number, day: number): boolean;
/** Non-throwing AD validation for form use. */
declare function isValidAD(year: number, month: number, day: number): boolean;
/** Add calendar months in AD with constrain|reject overflow. */
declare function addMonthsAD(value: ADDate, amount: number, options?: MonthArithmeticOptions): ADDate;
/** Add calendar years in AD with constrain|reject overflow. */
declare function addYearsAD(value: ADDate, amount: number, options?: MonthArithmeticOptions): ADDate;
declare const addADMonths: typeof addMonthsAD;
declare const addADYears: typeof addYearsAD;
/** Whole BS calendar months between left and right, truncated toward zero. */
declare function differenceInMonthsBS(left: BSDate, right: BSDate): number;
/** Whole AD calendar months between left and right, truncated toward zero. */
declare function differenceInMonthsAD(left: ADDate, right: ADDate): number;
/** Whole BS calendar years between left and right. */
declare function differenceInYearsBS(left: BSDate, right: BSDate): number;
/** Whole AD calendar years between left and right. */
declare function differenceInYearsAD(left: ADDate, right: ADDate): number;
interface Age {
    readonly years: number;
    readonly months: number;
    readonly days: number;
}
declare function ageOnBS(birth: BSDate, on: BSDate): Age;
declare function ageOnAD(birth: ADDate, on: ADDate): Age;

/** Iterate inclusive BS dates in civil-day order. */
declare function iterateBS(start: BSDate, end: BSDate): Generator<BSDate>;
/** Iterate inclusive AD dates in civil-day order. */
declare function iterateAD(start: ADDate, end: ADDate): Generator<ADDate>;
declare const compare: typeof compareAD;
declare const equal: typeof equalAD;
declare const differenceInDays: typeof differenceInDaysAD;
declare const addDays: typeof addDaysAD;
declare const addWeeks: typeof addWeeksAD;
declare const weekday: typeof weekdayAD;

export { ADDate, type Age, BSDate, type MonthArithmeticOptions, type MonthOverflow, type Weekday, addADMonths, addADYears, addBSMonths, addBSYears, addDays, addDaysAD, addDaysBS, addMonthsAD, addMonthsBS, addWeeks, addWeeksAD, addWeeksBS, addYearsAD, addYearsBS, ageOnAD, ageOnBS, compare, compareAD, compareBS, daysInMonthAD, daysInMonthBS, daysInYearBS, differenceInDays, differenceInDaysAD, differenceInDaysBS, differenceInMonthsAD, differenceInMonthsBS, differenceInYearsAD, differenceInYearsBS, equal, equalAD, equalBS, isLeapYearAD, isValidAD, isValidBS, iterateAD, iterateBS, weekday, weekdayAD, weekdayBS };
