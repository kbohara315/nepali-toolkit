import { Weekday, MonthArithmeticOptions } from './arithmetic.js';
import { B as BSDate, A as ADDate } from '../types-DiHJisXT.js';
import '../errors-C9ZtWKZp.js';

/** Immutable value for one supported BS/AD civil day. */
declare class NepaliDate {
    #private;
    private constructor();
    static fromBS(value: BSDate): NepaliDate;
    static fromAD(value: ADDate): NepaliDate;
    toBS(): BSDate;
    toAD(): ADDate;
    equals(other: NepaliDate): boolean;
    compare(other: NepaliDate): -1 | 0 | 1;
    addDays(amount: number): NepaliDate;
    addWeeks(amount: number): NepaliDate;
    differenceInDays(other: NepaliDate): number;
    weekday(): Weekday;
    clone(): NepaliDate;
    addMonthsBS(amount: number, options?: MonthArithmeticOptions): NepaliDate;
    addYearsBS(amount: number, options?: MonthArithmeticOptions): NepaliDate;
    addMonthsAD(amount: number, options?: MonthArithmeticOptions): NepaliDate;
    addYearsAD(amount: number, options?: MonthArithmeticOptions): NepaliDate;
    startOfMonthBS(): NepaliDate;
    endOfMonthBS(): NepaliDate;
    startOfMonthAD(): NepaliDate;
    endOfMonthAD(): NepaliDate;
    serialize(): string;
    serializeBS(): string;
    static fromISO(value: string): NepaliDate;
    static fromSerial(value: string): NepaliDate;
    static fromBSString(value: string): NepaliDate;
    toString(): string;
    toJSON(): string;
}

export { NepaliDate };
