# Number Contract (Phase 2)

Public wording is **Nepali grouping** (lakh/crore) throughout. The word
"Indian" must not appear in any public API name, option, doc comment, or
error message. (Maintainer note: this is the same digit layout CLDR/ICU
calls the Indian numbering system — 3,2,2… — but that name stays out of
this library.)

## Inputs

`NumeralInput = string | number | bigint`, plus an explicit decimal-string
path for exact values:

- `number`: must be finite, else `InvalidNumberError` (new stable error in
  `src/number/errors.ts`, following the date `errors.ts` idiom: class +
  `code`). Non-safe-integer `number`s with fraction digits beyond float
  precision are accepted but documented as approximate — exact callers must
  pass strings.
- `bigint`: integers only. Absent fraction options format as a plain integer;
  explicitly passing a nonzero `minimumFractionDigits` or
  `maximumFractionDigits` throws `InvalidNumberError`.
- `string`: canonical decimal shape, optionally signed, Devanagari or ASCII
  digits, at most one `.`; surrounding whitespace trimmed; anything else →
  `InvalidNumberError`. No exponent notation in v1.

## Options

```ts
type NumberFormatOptions = {
  grouping?: 'nepali' | 'western' | 'none'; // default 'nepali'
  numerals?: 'ascii' | 'devanagari';        // default 'ascii'
  minimumFractionDigits?: number;           // default 0
  maximumFractionDigits?: number;           // default 3
  rounding?: 'half-up';                     // default 'half-up'; only mode in v1
  groupSeparator?: string;                  // default ','
  decimalSeparator?: string;                // default '.'
};
```

- `minimumFractionDigits > maximumFractionDigits` → `InvalidNumberError`.
- Separators must be single non-digit characters distinct from each other,
  else `InvalidNumberError`.
- Negative values render with a leading `-` (ASCII) regardless of numerals
  setting in v1 (Devanagari minus is out of scope).

## Grouping rules

- `nepali`: rightmost group of 3, then groups of 2
  (`1,23,45,678`). Applied to the integer part only.
- `western`: groups of 3 (`12,345,678`).
- `none`: no separators.
- Rounding happens on the exact decimal value BEFORE grouping; fraction
  padding/truncation per min/max digits.

## Functions (`nepali-utils/number`)

- `formatNumber(value: NumeralInput, options?: NumberFormatOptions): string`
- `parseNumber(value: string): string` — accepts ASCII/Devanagari digits,
  either separator style, trims whitespace; returns canonical ASCII decimal
  string (no grouping, `.` separator, no `+`, no leading zeros except `0`
  itself). Throws `InvalidNumberError` on anything else.
- Re-exported unchanged: `toAscii`, `toDevanagari`, `NumeralInput` (digits
  stays the transliteration primitive; grouping engine in `grouping.ts`).

Round-trip law: `parseNumber(formatNumber(x, {grouping:'nepali'}))` is the
canonical form of `x` for every valid `x`.

## Errors

- `InvalidNumberError` with `code = 'INVALID_NUMBER'`, extending `TypeError`
  (matches date taxonomy where invalid *shape* is a TypeError-family error).
- No other new error classes in v1.

## Non-goals (v1)

Currency symbols, number-to-words, percent/compact notation, exponent
notation, locale sniffing, `Intl` fallback path, Devanagari minus sign.
