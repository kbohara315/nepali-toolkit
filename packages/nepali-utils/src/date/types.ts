import { assertADFields } from './internal/gregorian.js';
import { assertBSFields } from './internal/patro.js';

export interface DateFields {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export type BSDateFields = DateFields;
export type ADDateFields = DateFields;

declare const bsDateBrand: unique symbol;
declare const adDateBrand: unique symbol;

export type BSDate = BSDateFields & { readonly [bsDateBrand]: 'BSDate' };
export type ADDate = ADDateFields & { readonly [adDateBrand]: 'ADDate' };

function makeDate(year: number, month: number, day: number): DateFields {
  return Object.freeze({ year, month, day });
}

/** Construct a validated, nominally branded BS date. */
export function bs(year: number, month: number, day: number): BSDate {
  assertBSFields(year, month, day);
  return makeDate(year, month, day) as BSDate;
}

/** Construct a validated, nominally branded proleptic Gregorian date. */
export function ad(year: number, month: number, day: number): ADDate {
  assertADFields(year, month, day);
  return makeDate(year, month, day) as ADDate;
}
