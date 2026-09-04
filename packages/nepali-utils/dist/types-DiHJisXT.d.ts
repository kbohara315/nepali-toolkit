interface DateFields {
    readonly year: number;
    readonly month: number;
    readonly day: number;
}
type BSDateFields = DateFields;
type ADDateFields = DateFields;
declare const bsDateBrand: unique symbol;
declare const adDateBrand: unique symbol;
type BSDate = BSDateFields & {
    readonly [bsDateBrand]: 'BSDate';
};
type ADDate = ADDateFields & {
    readonly [adDateBrand]: 'ADDate';
};
/** Construct a validated, nominally branded BS date. */
declare function bs(year: number, month: number, day: number): BSDate;
/** Construct a validated, nominally branded proleptic Gregorian date. */
declare function ad(year: number, month: number, day: number): ADDate;

export { type ADDate as A, type BSDate as B, type DateFields as D, type ADDateFields as a, type BSDateFields as b, ad as c, bs as d };
