# Miti-to-Date Migration Blueprint

## Goal

Move the current implementation from:

```text
/home/kshitij/Desktop/Projects/P/hobby-project/to-do/np-date
```

into the `date` domain of:

```text
packages/nepali-utils/src/date
```

The migration changes ownership and package boundaries, not date behavior. `miti` will not remain a separate package.

## Safety constraints

- Preserve the existing Git history; do not delete the source repository before history and tests are verified in the new root.
- Do not combine migration with API redesign, data correction, formatting changes, or feature implementation.
- Copy or move generated-data inputs and generation scripts together; generated output alone is insufficient.
- Preserve current stable errors, branded date types, exhaustive invariants, conformance vectors, and package tests.
- Keep the current Patro provenance limitation explicit.
- Compare old and new packed outputs before retiring the old directory.

## Target date structure

```text
packages/nepali-utils/
├── src/
│   ├── date/
│   │   ├── index.ts
│   │   ├── convert.ts
│   │   ├── value.ts
│   │   ├── arithmetic.ts
│   │   ├── format.ts
│   │   ├── format-display.ts
│   │   ├── parse.ts
│   │   ├── range.ts
│   │   ├── fiscal.ts
│   │   ├── relative.ts
│   │   ├── locale/
│   │   ├── adapters/
│   │   └── internal/
│   └── number/
│       └── digits.ts
├── data/
│   └── date/
├── scripts/
│   └── date/
└── tests/
    └── date/
```

Exact filenames may remain unchanged during the first migration pass. The important boundary is that Patro, Gregorian day-count, generated data, and conversion internals remain private to `date`.

## Source mapping

| Current area | Intended destination |
|---|---|
| `src/convert.ts`, `src/miti.ts`, `src/arithmetic.ts` | `src/date/` public modules |
| `src/format.ts`, `src/format-display.ts`, `src/parse.ts` | `src/date/` public modules |
| `src/fiscal.ts`, `src/relative.ts`, `src/range.ts` | `src/date/` public modules |
| `src/locale/*` | `src/date/locale/` |
| `src/adapters/*` | `src/date/adapters/` |
| `src/conversion.ts`, `src/civil-day.ts`, `src/gregorian.ts`, `src/patro.ts` | `src/date/internal/` |
| `src/generated-data.ts`, `data/**`, `conformance/**` | package-level date data/conformance areas |
| `scripts/generate-data.mjs`, `scripts/verify-data.mjs` | package scripts for date data |
| date tests | `tests/date/` or equivalent package-local test layout |

## Numeral extraction

The existing `src/numerals.ts` contains generic ASCII/Devanagari digit conversion and belongs in the new number domain. Migrate it in two controlled steps:

1. Move the implementation to `src/number/digits.ts` while preserving its API and tests.
2. Update date formatting and Nepali locale modules to depend only on that narrow digit module.

The number domain must not depend on date. Date importing a tiny digit primitive is acceptable and must be verified through bundle inspection.

## Public export direction

Required primary export:

```ts
import { bs, toAD, getFiscalYear } from 'nepali-utils/date';
```

Optional narrower exports may be retained where they provide measured value:

```ts
import { toAD } from 'nepali-utils/date/convert';
import { getFiscalYear } from 'nepali-utils/date/fiscal';
```

Do not reproduce every historical subpath automatically. Keep a subpath only when it represents a stable domain seam or materially improves bundle isolation.

## Migration sequence

1. Establish the new repository and package shell while preserving access to the existing Git history.
2. Bring over source, tests, data, conformance files, and scripts without editing behavior.
3. Make internal imports resolve under `src/date`.
4. Reproduce the existing date build and test suite inside `packages/nepali-utils`.
5. Add `nepali-utils/date` exports and packed-consumer tests.
6. Extract generic digit conversion into `number/digits` with behavior unchanged.
7. Compare generated data checksums, declarations, conformance results, and public runtime output with the current repository.
8. Extend bundle checks to prove date consumers exclude all unrelated new domains.
9. Retire the old standalone directory only after history, tests, and artifacts are verified.

## Migration acceptance criteria

- All existing date tests pass without weakening assertions.
- BS/AD conversion outputs and supported boundaries are unchanged.
- Generated Patro data and checksums are reproducible.
- Fiscal, parsing, formatting, arithmetic, locale, adapter, and relative-date behavior is unchanged.
- Public declarations contain no accidental `any` or leaked internal data types.
- `nepali-utils/date` works from the packed package in supported runtimes.
- Date-only bundles exclude currency, words, land, collation, phone, name, React, and React Native.
- Number-only bundles exclude Patro and date conversion data.
- No `miti` compatibility package is created.

## Deliberately deferred migration changes

- Renaming the `Miti` value class, if it remains useful as a date-domain concept.
- Expanding wall-clock or historical timezone behavior.
- Correcting or extending Patro data before provenance review.
- Adding new utility features during the source move.
- Building `nepali-ui` components.

Any of these should be a separate reviewed change after migration equivalence is established.
