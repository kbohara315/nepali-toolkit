import { bs } from './types.js';
import type { BSDate, BSDateFields } from './types.js';
import { differenceInDaysBS } from './arithmetic.js';
import { toDevanagari } from '../number/digits.js';

export interface RelativeLocale {
  readonly today: string;
  readonly yesterday: string;
  readonly tomorrow: string;
  readonly daysAgo: (days: number) => string;
  readonly inDays: (days: number) => string;
}

export const englishRelativeLocale: RelativeLocale = {
  today: 'today',
  yesterday: 'yesterday',
  tomorrow: 'tomorrow',
  daysAgo: (days) => `${days} day${days === 1 ? '' : 's'} ago`,
  inDays: (days) => `in ${days} day${days === 1 ? '' : 's'}`,
};

export const nepaliRelativeLocale: RelativeLocale = {
  today: 'आज',
  yesterday: 'हिजो',
  tomorrow: 'भोलि',
  daysAgo: (days) => `${toDevanagari(days)} दिन अघि`,
  inDays: (days) => `${toDevanagari(days)} दिनमा`,
};

function dayDifference(later: BSDate | BSDateFields, earlier: BSDate | BSDateFields): number {
  return differenceInDaysBS(
    bs(later.year, later.month, later.day),
    bs(earlier.year, earlier.month, earlier.day),
  );
}

/** Difference in civil days: `differenceInDays(later, earlier)`. */
export function differenceInDays(
  later: BSDate | BSDateFields,
  earlier: BSDate | BSDateFields,
): number {
  return dayDifference(later, earlier);
}

export const relativeDays = differenceInDays;
export const relativeDayDifference = differenceInDays;

/** Return `end - start`, named to make argument order explicit at call sites. */
export function daysBetween(start: BSDate | BSDateFields, end: BSDate | BSDateFields): number {
  return differenceInDays(end, start);
}

export function formatRelativeDays(
  delta: number,
  locale: RelativeLocale = englishRelativeLocale,
): string {
  if (!Number.isSafeInteger(delta))
    throw new TypeError('relative day count must be a safe integer');
  if (delta === 0) return locale.today;
  if (delta === 1) return locale.tomorrow;
  if (delta === -1) return locale.yesterday;
  if (delta > 0) return locale.inDays(delta);
  return locale.daysAgo(Math.abs(delta));
}

export function relativePhrase(delta: number, locale?: RelativeLocale): string;
export function relativePhrase(
  target: BSDate | BSDateFields,
  reference: BSDate | BSDateFields,
  locale?: RelativeLocale,
): string;
export function relativePhrase(
  deltaOrTarget: number | BSDate | BSDateFields,
  referenceOrLocale?: RelativeLocale | BSDate | BSDateFields,
  locale: RelativeLocale = englishRelativeLocale,
): string {
  if (typeof deltaOrTarget === 'number') {
    return formatRelativeDays(
      deltaOrTarget,
      referenceOrLocale && 'today' in referenceOrLocale ? referenceOrLocale : locale,
    );
  }
  if (!referenceOrLocale || 'today' in referenceOrLocale) {
    throw new TypeError('a reference date is required');
  }
  return formatRelativeDays(differenceInDays(deltaOrTarget, referenceOrLocale), locale);
}

export function relativePhraseBetween(
  target: BSDate | BSDateFields,
  reference: BSDate | BSDateFields,
  locale: RelativeLocale = englishRelativeLocale,
): string {
  return relativePhrase(target, reference, locale);
}

export const formatRelative = relativePhrase;
