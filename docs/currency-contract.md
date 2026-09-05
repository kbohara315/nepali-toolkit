# Currency Contract (Phase 3a)

Deterministic NPR formatting over the number primitives. No `Intl`, no
DOM/Node APIs, no date imports. Public wording follows the Nepali-only
rule (no "Indian" anywhere user-facing).

## Inputs

- `formatNPR(value: NumeralInput, options?: NPRFormatOptions): string`
  where `NumeralInput = string | number | bigint` (same meaning as number).
- `formatNPRMinorUnits(paisa: bigint, options?: NPRFormatOptions): string`
  — exact accounting path: integer paisa → rupees.paisa (2 fraction digits
  forced). Negative bigint = negative amount.
- Plain `number` rupees are accepted but documented as approximate past
  float precision; exact callers use strings or minor units.

## Options

```ts
type NPRFormatOptions = {
  symbol?: 'रु' | 'रू' | 'नेरू' | 'NPR'; // default 'रु'
  placement?: 'before' | 'after';        // default 'before'
  spacing?: 'none' | 'space' | 'nbsp';   // default 'space'; ignored placement detail below
  numerals?: 'ascii' | 'devanagari';     // default 'devanagari'
  grouping?: 'nepali' | 'western' | 'none'; // default 'nepali'
  minimumFractionDigits?: number;        // default 2
  maximumFractionDigits?: number;        // default 2
  negative?: 'minus' | 'parentheses';    // default 'minus'
};
```

- `before` + spacing renders `रु १,२३४.००`, `nbsp` uses `\u00A0`;
  `after` renders `१,२३४.०० रु`.
- `minus` renders `-रु १०.००` (sign before symbol); `parentheses` renders
  `(रु १०.००)`.
- Fraction validation mirrors number (min>max → `InvalidCurrencyError`).
- Separators are NOT separately configurable in v1 (`,` and `.` fixed) —
  currency display convention is fixed; full separator control stays in
  `formatNumber`.

## Amount model

Internally: sign + integer rupees + exactly the requested fraction digits,
computed with the number engine's exact decimal math (never binary float).
Minor-units path converts paisa → rupees by decimal shift on the digit
string, not division.

## Errors

- `InvalidCurrencyError`, `code = 'INVALID_CURRENCY'`, extends `TypeError`
  (same idiom as `InvalidNumberError`).
- Reuse `InvalidNumberError` for malformed numeric input (don't wrap it).

## Exports (`nepali-utils/currency`)

`formatNPR`, `formatNPRMinorUnits`, `InvalidCurrencyError`,
`NPRFormatOptions` type. Package subpath `./currency` (+ tsup entry,
bundle budget 2048 gzip, isolation: no Patro tokens, no `Intl`, no date
internals, no words tables).

## Non-goals (v1)

Parsing currency strings back to amounts, other currencies, percent/
compact notation, Devanagari minus sign, fraction digits beyond 2 by
default (allowed via options, not encouraged).
