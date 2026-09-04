const DEVANAGARI_ZERO = 0x0966;

export type NumeralInput = string | number;

function asText(value: NumeralInput): string {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new TypeError('numeral value must be finite');
  }
  return String(value);
}

/** Replace ASCII decimal digits with their Devanagari equivalents. */
export function toDevanagari(value: NumeralInput): string {
  return asText(value).replace(/[0-9]/g, (digit) =>
    String.fromCharCode(DEVANAGARI_ZERO + Number(digit)),
  );
}

/** Replace Devanagari decimal digits with ASCII digits. Other characters are preserved. */
export function toAscii(value: NumeralInput): string {
  return asText(value).replace(/[\u0966-\u096f]/g, (digit) =>
    String(digit.charCodeAt(0) - DEVANAGARI_ZERO),
  );
}
