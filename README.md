# nepali-toolkit — JavaScript and TypeScript utilities for Nepal

[![npm version](https://img.shields.io/npm/v/nepali-toolkit.svg)](https://www.npmjs.com/package/nepali-toolkit)
[![npm downloads](https://img.shields.io/npm/dm/nepali-toolkit.svg)](https://www.npmjs.com/package/nepali-toolkit)

**Build for Nepal, down to every detail.** `nepali-toolkit` helps JavaScript and
TypeScript developers convert dates between Bikram Sambat (BS) and Gregorian
(AD) in both directions and build the rest of a Nepal-focused application.
The published package provides zero-dependency, tree-shakeable helpers for
Nepali numbers, NPR currency, land units, number words, phone numbers, Nepali
collation, and government-sourced administrative data.

[Documentation](https://kbohara315.github.io/nepali-toolkit/docs/) ·
[Playground](https://kbohara315.github.io/nepali-toolkit/playground/) ·
[npm](https://www.npmjs.com/package/nepali-toolkit) ·
[Package source](https://github.com/kbohara315/nepali-toolkit/tree/main/packages/nepali-toolkit)

## Use the package

```bash
npm install nepali-toolkit
```

Use domain subpaths rather than the empty root entrypoint. Save this runnable
JavaScript example as `example.mjs` and run `node example.mjs`; the same imports
work in TypeScript:

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

Months are **1-based**. Converting a calendar date does not depend on your device's
timezone. Use the Date, Temporal, or timezone adapters when working with timestamps.
Conversion supports BS **2000-01-01–2090-12-30** (AD
**1943-04-14–2034-04-13**), inclusive. The calendar table has not yet been
independently checked across that entire range.
See [date data sources](https://kbohara315.github.io/nepali-toolkit/docs/project/data-sources/).

## Tasks and domains

| Subpath | Task and documentation |
| --- | --- |
| `nepali-toolkit/date` | [Convert, parse, format, and calculate BS/AD dates and fiscal years](https://kbohara315.github.io/nepali-toolkit/docs/reference/date/) |
| `nepali-toolkit/number` | [Format lakh/crore grouping and parse decimals](https://kbohara315.github.io/nepali-toolkit/docs/reference/number/) |
| `nepali-toolkit/number/digits` | [Convert ASCII and Devanagari digits](https://kbohara315.github.io/nepali-toolkit/docs/reference/number/) |
| `nepali-toolkit/currency` | [Display NPR amounts from rupees or integer paisa](https://kbohara315.github.io/nepali-toolkit/docs/reference/currency/) |
| `nepali-toolkit/land` | [Convert ropani/aana and bigha/kattha to metric or square-foot areas](https://kbohara315.github.io/nepali-toolkit/docs/reference/land/) |
| `nepali-toolkit/words` | [Write English/Nepali number words and NPR amounts in words](https://kbohara315.github.io/nepali-toolkit/docs/reference/words/) |
| `nepali-toolkit/collation` | [Sort and search normalized Nepali text](https://kbohara315.github.io/nepali-toolkit/docs/reference/collation/) |
| `nepali-toolkit/phone` | [Parse, format, and structurally validate Nepal phone numbers](https://kbohara315.github.io/nepali-toolkit/docs/reference/phone/) |
| `nepali-toolkit/admin` | [Build province/district/palika selectors and ward/postal lookups](https://kbohara315.github.io/nepali-toolkit/docs/reference/admin/) |

Administrative levels also have independent entrypoints:

```js
import { getProvinces } from 'nepali-toolkit/admin/provinces';
import { getDistricts } from 'nepali-toolkit/admin/districts';
import { getPalikas } from 'nepali-toolkit/admin/palikas';

console.log(getProvinces().length);      // 7
console.log(getDistricts('1').length);   // 14 (Koshi)
console.log(getPalikas('101').length);   // 9 (Taplejung)
```

The `gov-2026-09` data snapshot contains 7 provinces, 77 districts, 753 palikas,
and ward counts totaling 6,743 wards. Codes are strings; wards are validated by
number range. Postal codes use the GPO palika/ward scheme rather than classic
post-office codes.

### Inputs, errors, and precision

Use `ad()` / `bs()` to validate date fields. Invalid fields, invalid civil dates,
and unsupported conversion dates throw distinct domain errors. For exact numeric
or NPR display, pass decimal strings; for exact paisa, use `bigint` minor-unit
APIs. JavaScript numbers cannot recover precision already lost to floating point.
Words have explicit magnitude/fraction limits, and land areas store integer
square micrometres. Phone structural validation does not establish ownership or
live service.

See the [package task examples](packages/nepali-toolkit/README.md),
[input and error guide](https://kbohara315.github.io/nepali-toolkit/docs/guides/errors-and-input/),
and the references above for supported inputs, options, and return values.

## Repository layout

```text
nepali-toolkit/
├── apps/
│   ├── expo-example/          # Expo integration scaffold
│   └── website/               # Documentation, landing page, and playground
├── packages/
│   ├── nepali-toolkit/        # Published pure TypeScript package
│   └── nepali-ui/             # React Native UI scaffold
├── docs/                      # Domain contracts and architecture docs
├── AGENTS.md                  # Repository-wide agent instructions
├── package.json               # Private monorepo manifest
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

The production package source is under `packages/nepali-toolkit/src/`. Read
`packages/nepali-toolkit/AGENTS.md` before changing that package.

## Agent pickup guide

For a new coding session or agent handoff:

1. Read `AGENTS.md` at the repository root.
2. Read the nearest package guidance in `packages/nepali-toolkit/AGENTS.md` or
   `packages/nepali-ui/AGENTS.md`.
3. Inspect the relevant domain contract in `docs/` before changing a public API.
4. Keep domains independent and preserve explicit subpath exports.
5. Do not edit generated admin or date data directly; use the documented
   generation scripts and inspect `PROVENANCE.md` first.
6. Run the relevant verification gates before handing work back.

When handing work to another agent, report the files changed, behavior added or
changed, verification commands and results, and any remaining uncertainty.

## Development commands

Run these from the repository root:

```bash
pnpm install
pnpm --filter nepali-toolkit typecheck
pnpm --filter nepali-toolkit test
pnpm --filter nepali-toolkit verify:package
node packages/nepali-toolkit/scripts/verify-tree-shaking.mjs
pnpm --filter nepali-toolkit benchmark:runtime
```

Build the published package directly when inspecting output:

```bash
pnpm --filter nepali-toolkit build
cd packages/nepali-toolkit
npm pack --dry-run
```

The package publishes ESM and CommonJS builds with TypeScript declarations.
Source maps are intentionally excluded from the npm tarball. The package root
is intentionally empty; importing a domain subpath is the stable API and the
tree-shaking contract.

## Data and correctness

Administrative tables are derived from cited Government of Nepal sources. Date
conversion uses year-specific BS month data rather than an approximate fixed
year offset. See these files before changing data or date behavior:

- `packages/nepali-toolkit/src/admin/data/PROVENANCE.md`
- `packages/nepali-toolkit/src/date/data/PROVENANCE.md`
- `docs/blueprint.md`
- `docs/implementation-plan.md`

The package has no runtime dependencies and must not depend on React, React
Native, Expo, browser globals, or Node.js APIs.

## Current status

`nepali-toolkit@0.1.0` is published on npm. The utility package is the primary
production surface. `nepali-ui` and the Expo example remain scaffold-level
work. APIs may change before `1.0.0`; public API changes require focused tests,
updated contracts, and tree-shaking verification.

## Documentation

- [Getting started](https://kbohara315.github.io/nepali-toolkit/docs/getting-started/)
- [Documentation and API reference](https://kbohara315.github.io/nepali-toolkit/docs/)
- [Interactive playground](https://kbohara315.github.io/nepali-toolkit/playground/)
- [Package README](packages/nepali-toolkit/README.md)
- [Architecture blueprint](docs/blueprint.md)
- [Implementation plan](docs/implementation-plan.md)
- [Date migration notes](docs/miti-date-migration.md)
- [Domain contracts](docs/)

## License

License metadata has not been selected yet. Choose a license before accepting
external contributions or presenting this repository as an open-source project.
