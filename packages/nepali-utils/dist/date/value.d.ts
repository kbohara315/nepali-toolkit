import { Weekday, MonthArithmeticOptions } from './arithmetic.js';
import { B as BSDate, A as ADDate } from '../types-DiHJisXT.js';
import '../errors-C9ZtWKZp.js';

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

export { Miti };
