# Product and Architecture Blueprint

## Product direction

`nepali-utils` is the central utility package. Date handling is one independently importable domain, not the identity of the whole library.

The workspace will publish two packages:

- `nepali-utils`: Expo-first, web-friendly, pure TypeScript utilities.
- `nepali-ui`: Expo React Native components built on `nepali-utils`; web components are deferred.

The npm names remain subject to an availability check before publication.

## Locked decisions

- pnpm workspace.
- tsup builds with ESM as the primary format and CJS as a compatibility format.
- `sideEffects: false` and explicit package subpath exports.
- Utilities use no DOM or Node.js runtime APIs and have zero runtime dependencies.
- Expo Go on Android/Hermes is a required runtime.
- Core behavior must not require full ICU.
- No PAN, transliteration, holidays, festivals, or web/shadcn components in v1.
- No deprecated `miti` package or re-export stub.

## Intended repository layout

```text
nepali-utils/
├── apps/
│   └── expo-example/
├── packages/
│   ├── nepali-utils/
│   │   ├── src/
│   │   │   ├── date/
│   │   │   ├── number/
│   │   │   ├── currency/
│   │   │   ├── words/
│   │   │   ├── land/
│   │   │   ├── collation/
│   │   │   ├── phone/
│   │   │   └── name/
│   │   ├── package.json
│   │   └── tsup.config.ts
│   └── nepali-ui/
│       ├── src/
│       ├── package.json
│       └── tsup.config.ts
├── docs/
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Utility domains

### Date

Port the existing BS/AD civil-date implementation, including conversion, arithmetic, formatting, parsing, locales, adapters, relative dates, and Nepali fiscal years. Preserve the distinction between civil dates and instants.

The current Patro dataset is functional but still requires the publication-level provenance and independent conformance work identified in the existing repository. Migration must not silently turn provisional data into a stronger correctness claim.

### Number

Provide ASCII/Devanagari digit conversion and deterministic Nepali grouping (lakh/crore). Formatting must work without `Intl`. Decimal strings and `bigint` should be supported where precision matters.

### Currency

Provide deterministic NPR formatting over the number primitives. Symbol (`रु`, `रू`, `नेरू`, or `NPR`), placement, spacing, fraction digits, negative values, and rounding are explicit options. Exact money APIs should accept decimal strings or minor-unit `bigint` values.

### Words

Provide number and NPR amount-to-words behavior only after freezing language, scale, range, decimal, negative-number, and spelling policies. APIs must distinguish Nepali-language output from English output using the Nepali (lakh/crore) numbering system.

### Land

Provide Nepal-specific hill and Terai area systems:

- Ropani–Aana–Paisa–Daam.
- Bigha–Kattha–Dhur.

Use an exact canonical area representation. Source Nepal-specific SI/imperial conversion constants, normalize or reject overflowing components explicitly, and round only at display boundaries.

### Collation

Use an `auto` strategy: a capability-checked `Intl.Collator('ne-NP')` backend where suitable and a deterministic basic fallback for Hermes or limited-ICU environments. Document the fallback as basic Nepali ordering rather than complete linguistic collation.

### Phone

Separate normalization, formatting, structural validation, and allocation-aware validation. Normalize ASCII and Devanagari digits. Version any prefix metadata because Nepal's numbering plan can change.

### Name

Perform conservative structural validation and explicit display formatting. Do not infer surname position, caste, ethnicity, gender, or whether a family name is required. Do not automatically split free-form names.

## Public package boundaries

Planned imports:

```ts
import { toBS } from 'nepali-utils/date';
import { formatNumber } from 'nepali-utils/number';
import { formatNPR } from 'nepali-utils/currency';
import { numberToNepaliWords } from 'nepali-utils/words';
import { formatHillArea } from 'nepali-utils/land';
import { createNepaliCollator } from 'nepali-utils/collation';
import { validateNepalPhone } from 'nepali-utils/phone';
import { validateNepaliName } from 'nepali-utils/name';
```

The package root may expose a small ergonomic set later, but subpaths are the stable size-sensitive contract. Importing one domain must not retain unrelated domains.

## Frozen v1 API surface (date + number only)

The granular date subpaths (`./date/convert`, `./date/value`,
`./date/arithmetic`, `./date/format`, `./date/format-display`,
`./date/parse`, `./date/fiscal`, `./date/relative`, `./date/range`,
`./date/locale/en`, `./date/locale/ne`, `./date/adapters/date`,
`./date/adapters/temporal`, `./date/adapters/timezone`) are intentionally
frozen: they mirror the ported module boundaries, each has a packed-consumer
and bundle-budget entry, and removing any of them is a breaking change.
`./date/range` additionally exports one-liner introspection accessors
(`minBSYear`, `maxBSYear`, `minADYear`, `maxADYear`) and the `DateMetadata`
type. No new date subpaths will be added without bundle evidence. Digits are
available only from `./number` and `./number/digits` — `nepali-utils/date`
imports the digit primitive internally but does not re-export it.

## Dependency direction

```text
number/digits  <- date locale, currency, words, land, phone
number         <- currency, land
date           <- nepali-ui date components
currency       <- nepali-ui NPR input
land           <- nepali-ui Ropani input
collation      independent
name           independent
phone          <- number/digits only
```

No utility domain may depend on React, React Native, Expo, browser globals, or Node.js APIs.

## UI boundary

`nepali-ui` may depend on React, React Native, Expo packages, and `nepali-utils`. These are not dependencies of the utility package.

Initial intended components are:

- `BSDatePicker`
- `NPRInput`
- `RopaniInput`

Their implementation is deferred until the utility contracts they consume are stable. The first UI step is package scaffolding and an Expo example application, not component implementation.

## Compatibility policy

- ESM is the tree-shakable contract.
- CJS is provided for compatibility, not advertised as tree-shakable.
- Package exports include explicit `types`, `import`, and `require` targets.
- Importing any utility must be safe on Hermes even when `Intl` or full locale data is unavailable.
- Capability-dependent functionality must fall back or return a documented stable error; it must not crash during module import.

## Verification principles

- Test public subpaths from a packed package, not only source imports.
- Build one minimal consumer fixture per subpath.
- Measure complete minified and gzipped ESM consumer bundles.
- Inspect bundler metafiles and assert forbidden domains are absent.
- Verify `formatNPR` independently with an initial target near 2 KiB gzip; change the budget only with a recorded bundle diff.
- Run utility integration tests in the Expo example on Android/Hermes.
- Keep Node and browser tests, but do not treat them as substitutes for Hermes verification.
