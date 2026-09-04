import { NumeralInput, toAscii, toDevanagari } from './number/digits.js';

declare const index_NumeralInput: typeof NumeralInput;
declare const index_toAscii: typeof toAscii;
declare const index_toDevanagari: typeof toDevanagari;
declare namespace index {
  export { index_NumeralInput as NumeralInput, index_toAscii as toAscii, index_toDevanagari as toDevanagari };
}

export { index as i };
