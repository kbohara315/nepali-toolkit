import { toAscii } from '../number/digits.js';
import { InvalidPhoneError } from './errors.js';

/**
 * Canonicalize raw phone text to a bare-national digit string.
 *
 * Steps: Devanagari digits become ASCII (via `toAscii`), then spaces,
 * dashes, parentheses, and dots are stripped. A leading `+977`, `00977`,
 * or bare `977` country marker is removed. Anything else that is not an
 * ASCII digit (letters, slashes, stray `+`, …) rejects with
 * `InvalidPhoneError`.
 */
export function normalizeNepalPhoneDigits(text: unknown): string {
  if (typeof text !== 'string') {
    throw new InvalidPhoneError('phone number must be a string');
  }
  let rest = toAscii(text).trim();
  if (rest.length === 0) {
    throw new InvalidPhoneError('phone number must not be empty');
  }
  let hadPlus = false;
  if (rest.startsWith('+')) {
    hadPlus = true;
    rest = rest.slice(1);
  }
  rest = rest.replace(/[\s\-().]/g, '');
  if (hadPlus) {
    if (!rest.startsWith('977')) {
      throw new InvalidPhoneError(`unsupported country marker in ${JSON.stringify(String(text))}`);
    }
    rest = rest.slice(3);
  } else if (rest.startsWith('00977')) {
    rest = rest.slice(5);
  } else if (rest.startsWith('977') && (rest.length === 12 || rest.length === 13)) {
    // Bare `977`-prefixed NSN (12 digits for landline, 13 for mobile).
    // A 10-digit national mobile such as `977xxxxxxx` must NOT be
    // stripped, hence the length gate.
    rest = rest.slice(3);
  }
  if (rest.length === 0 || !/^[0-9]+$/.test(rest)) {
    throw new InvalidPhoneError(`invalid characters in ${JSON.stringify(String(text))}`);
  }
  return rest;
}
