type NumeralInput = string | number;
/** Replace ASCII decimal digits with their Devanagari equivalents. */
declare function toDevanagari(value: NumeralInput): string;
/** Replace Devanagari decimal digits with ASCII digits. Other characters are preserved. */
declare function toAscii(value: NumeralInput): string;

export { type NumeralInput, toAscii, toDevanagari };
