import { B as BSDate, b as BSDateFields } from '../types-DiHJisXT.js';

interface RelativeLocale {
    readonly today: string;
    readonly yesterday: string;
    readonly tomorrow: string;
    readonly daysAgo: (days: number) => string;
    readonly inDays: (days: number) => string;
}
declare const englishRelativeLocale: RelativeLocale;
declare const nepaliRelativeLocale: RelativeLocale;
/** Difference in civil days: `differenceInDays(later, earlier)`. */
declare function differenceInDays(later: BSDate | BSDateFields, earlier: BSDate | BSDateFields): number;
declare const relativeDays: typeof differenceInDays;
declare const relativeDayDifference: typeof differenceInDays;
/** Return `end - start`, named to make argument order explicit at call sites. */
declare function daysBetween(start: BSDate | BSDateFields, end: BSDate | BSDateFields): number;
declare function formatRelativeDays(delta: number, locale?: RelativeLocale): string;
declare function relativePhrase(delta: number, locale?: RelativeLocale): string;
declare function relativePhrase(target: BSDate | BSDateFields, reference: BSDate | BSDateFields, locale?: RelativeLocale): string;
declare function relativePhraseBetween(target: BSDate | BSDateFields, reference: BSDate | BSDateFields, locale?: RelativeLocale): string;
declare const formatRelative: typeof relativePhrase;

export { type RelativeLocale, daysBetween, differenceInDays, englishRelativeLocale, formatRelative, formatRelativeDays, nepaliRelativeLocale, relativeDayDifference, relativeDays, relativePhrase, relativePhraseBetween };
