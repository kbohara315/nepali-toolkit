import { B as BSDate, b as BSDateFields } from '../types-DiHJisXT.js';

interface FiscalYear {
    readonly year: number;
    readonly start: BSDate;
    readonly end: BSDate;
}
/** Return the BS year in which the Shrawan-to-Ashadh fiscal year starts. */
declare function getFiscalYear(date: BSDateFields): number;
declare const fiscalYear: typeof getFiscalYear;
/** The first day of a BS fiscal year, Shrawan 1. */
declare function fiscalYearStart(year: number): BSDate;
/** The last day of a BS fiscal year, the final day of Ashadh. */
declare function fiscalYearEnd(year: number): BSDate;
declare function fiscalYearInfo(year: number): FiscalYear;
declare function isInFiscalYear(date: BSDateFields, year: number): boolean;
/** Format the conventional Nepali fiscal-year label, for example `2082/83`. */
declare function formatFiscalYear(year: number): string;

export { type FiscalYear, fiscalYear, fiscalYearEnd, fiscalYearInfo, fiscalYearStart, formatFiscalYear, getFiscalYear, isInFiscalYear };
