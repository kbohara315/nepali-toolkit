# nepali-toolkit — JavaScript and TypeScript utilities for Nepal

`nepali-toolkit` provides JavaScript and TypeScript utilities for apps built for
Nepal. Convert dates between Bikram Sambat (BS) and Gregorian (AD), format
Nepali numbers and NPR amounts, convert land units, write number words, validate
phones, sort Nepali text, and look up administrative records. The package has
zero runtime dependencies.

[Documentation](https://kbohara315.github.io/nepali-toolkit/docs/) ·
[Playground](https://kbohara315.github.io/nepali-toolkit/playground/) ·
[npm](https://www.npmjs.com/package/nepali-toolkit) ·
[Source](https://github.com/kbohara315/nepali-toolkit/tree/main/packages/nepali-toolkit) ·
[Issues](https://github.com/kbohara315/nepali-toolkit/issues)

## Install

```bash
npm install nepali-toolkit
```

## Convert BS to AD and AD to BS

Import from a domain subpath; the package root intentionally exports nothing.
The following is plain JavaScript and also works in TypeScript. Save it as
`example.mjs` after installing the package, then run `node example.mjs`:

```js
import { ad, bs, formatBS, toAD, toBS } from 'nepali-toolkit/date';

// BS to AD: Shrawan 7, 2082 → July 23, 2025.
console.log(toAD(bs(2082, 4, 7)));
// { year: 2025, month: 7, day: 23 }

// AD to BS: July 23, 2025 → Shrawan 7, 2082.
const nepaliDate = toBS(ad(2025, 7, 23));
console.log(nepaliDate);
// { year: 2082, month: 4, day: 7 }
console.log(formatBS(nepaliDate, 'YYYY-MM-DD'));
// 2082-04-07
```

Months are **1-based** in `ad()` and `bs()`. These are civil dates, not instants;
conversion does not depend on the device timezone. Use the explicit Date,
Temporal, or timezone adapters when bridging timestamps.

The date domain also includes parsing, arithmetic, fiscal years, relative dates,
and ranges. See the [date guide](https://kbohara315.github.io/nepali-toolkit/docs/guides/dates-and-calendars/)
and [date reference](https://kbohara315.github.io/nepali-toolkit/docs/reference/date/).

### Calendar bounds and provenance

The current implementation accepts BS **2000-01-01 through 2090-12-30**,
corresponding to AD **1943-04-14 through 2034-04-13**, inclusive. Conversion
uses year-specific month lengths rather than a fixed year offset.

The month-length dataset is a working transcription (`working-2026-08-22`).
Its source review and independent checks of the full table are incomplete. See the
[date provenance](https://github.com/kbohara315/nepali-toolkit/blob/main/packages/nepali-toolkit/src/date/data/PROVENANCE.md)
and [data sources](https://kbohara315.github.io/nepali-toolkit/docs/project/data-sources/).

## Format Nepali numbers and digits

```js
import { formatNumber } from 'nepali-toolkit/number';
import { toAscii, toDevanagari } from 'nepali-toolkit/number/digits';

console.log(formatNumber('12345678.50')); // 1,23,45,678.50
console.log(toDevanagari('2082'));        // २०८२
console.log(toAscii('२०८२'));             // 2082
```

Use lakh/crore grouping and exact decimal strings for display. The default
number formatter rounds half-up to at most three fraction digits. For parsing
localized input and choosing separators or fraction digits, see the
[number reference](https://kbohara315.github.io/nepali-toolkit/docs/reference/number/).

## Format NPR currency without losing paisa

```js
import { formatNPR, formatNPRMinorUnits } from 'nepali-toolkit/currency';

console.log(formatNPR('123456.50'));          // रु १,२३,४५६.५०
console.log(formatNPRMinorUnits(12345650n));  // रु १,२३,४५६.५०
```

Pass an exact decimal string in rupees or an integer `bigint` in paisa.
Default currency formatting rounds half-up to two decimal places. See the
[currency reference](https://kbohara315.github.io/nepali-toolkit/docs/reference/currency/).

## Write numbers and amounts in words

```js
import { amountToNepaliWordsNPR, numberToNepaliWords } from 'nepali-toolkit/words';

console.log(numberToNepaliWords('123'));        // एक सय तेइस
console.log(amountToNepaliWordsNPR('123.50'));  // एक सय तेइस रुपैयाँ पचास पैसा मात्र
```

English number words and exact paisa-based amount words are also available.
Number words accept up to six fraction digits; NPR amount words accept up to
two. The integer magnitude must be below `10^12`. See the
[words reference](https://kbohara315.github.io/nepali-toolkit/docs/reference/words/).

## Convert hill and Terai land units

```js
import { hillArea, teraiArea, toSquareFeet, toSquareMetres } from 'nepali-toolkit/land';

console.log(toSquareMetres(hillArea({ ropani: 1 }))); // 508.72
console.log(toSquareFeet(teraiArea({ bigha: 1 })));   // 72900
```

Hill fields are ropani/aana/paisa/daam; Terai fields are bigha/kattha/dhur.
They accept non-negative integers; excess smaller units carry into larger ones.
Areas store whole square micrometres as `bigint`; metric imports round half-up
to that precision. Square-foot conversions use system-specific published
relations; displayed hill/Terai units drop sub-unit remainders. See the
[land reference](https://kbohara315.github.io/nepali-toolkit/docs/reference/land/).

## Parse and validate Nepal phone numbers

```js
import { isValidNepalPhone, parseNepalPhone } from 'nepali-toolkit/phone';

const phone = parseNepalPhone('९८४१२३४५६७');
console.log(phone.e164);             // +9779841234567
console.log(isValidNepalPhone(phone)); // true
```

Parsing, structural validity, and allocation-table checks are separate tasks.
Validation does not prove a number is active or owned by a user. See the
[phone reference](https://kbohara315.github.io/nepali-toolkit/docs/reference/phone/).

## Sort and search Nepali text

```js
import { createNepaliCollator, nepaliIncludes } from 'nepali-toolkit/collation';

const collator = createNepaliCollator({ backend: 'basic' });
console.log(collator.sort(['गमला', 'कमल', 'खबर'])); // [ 'कमल', 'खबर', 'गमला' ]
console.log(nepaliIncludes('किरण', 'िक'));          // true
```

The basic backend uses the same sorting rules across runtimes. With phonetic
ordering, `auto` can use the runtime's Nepali `Intl.Collator` support; the default
school ordering uses basic. Search normalizes text, including misplaced short-i
in supported patterns such as `िक`. See the
[collation reference](https://kbohara315.github.io/nepali-toolkit/docs/reference/collation/).

## Build administrative address selectors

Import only the administrative level you need:

```js
import { getProvinces } from 'nepali-toolkit/admin/provinces';
import { getDistricts } from 'nepali-toolkit/admin/districts';
import { getPalikas } from 'nepali-toolkit/admin/palikas';

console.log(getProvinces().length);      // 7
console.log(getDistricts('1').length);   // 14 (Koshi)
console.log(getPalikas('101').length);   // 9 (Taplejung)
```

The `gov-2026-09` snapshot contains 7 provinces, 77 districts, 753 palikas,
and ward counts covering 6,743 wards, transcribed from cited Government of
Nepal sources. Codes are strings. Ward validation is range-based; ward names
and boundaries are not shipped. Postal helpers use the GPO palika/ward scheme,
not the classic post-office code system (such as Kathmandu 44600).
See the [admin reference](https://kbohara315.github.io/nepali-toolkit/docs/reference/admin/)
and [administrative provenance](https://github.com/kbohara315/nepali-toolkit/blob/main/packages/nepali-toolkit/src/admin/data/PROVENANCE.md).

## Inputs, errors, and precision

- Construct validated dates with `ad()` / `bs()` instead of casting raw objects.
  Malformed fields, invalid civil dates, and out-of-range conversions have
  distinct errors: `InvalidFieldError`, `InvalidCivilDateError`, and
  `UnsupportedDateError`.
- Handle parser and formatter errors when accepting user input. Validation
  helpers return booleans; check each function's expected input type.
- Number/currency formatters accept strings, numbers, and `bigint`. Decimal
  strings retain exact input digits before configured display rounding;
  JavaScript numbers cannot recover precision already lost to binary floating
  point. Use `bigint` minor-unit APIs for exact money.
- Words reject scientific notation and excessive fractional precision rather
  than silently rounding. See each reference for its accepted input and limits.

See the [input and error guide](https://kbohara315.github.io/nepali-toolkit/docs/guides/errors-and-input/)
and [expanded API documentation](https://kbohara315.github.io/nepali-toolkit/docs/).

## Design

- Zero runtime dependencies.
- TypeScript-first with ESM and CommonJS builds.
- Explicit subpath exports for tree-shaking and small consumer bundles.
- Civil-date APIs do not depend on timezones or browser globals.
- Administrative data is derived from cited Government of Nepal sources.

Use [imports and bundling](https://kbohara315.github.io/nepali-toolkit/docs/guides/imports-and-bundling/)
and [compatibility](https://kbohara315.github.io/nepali-toolkit/docs/project/compatibility/)
for entrypoint and runtime details.

Machine-readable documentation routes are
[llms.txt](https://kbohara315.github.io/nepali-toolkit/llms.txt) and
[llms-full.txt](https://kbohara315.github.io/nepali-toolkit/llms-full.txt)
and become available when the documentation site is deployed.

## Status

This package is in early development. APIs may change before the `1.0.0`
release. See [releases](https://kbohara315.github.io/nepali-toolkit/docs/project/releases/)
or [report an issue](https://github.com/kbohara315/nepali-toolkit/issues).
License metadata has not been selected yet.
