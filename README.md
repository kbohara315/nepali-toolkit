# nepali-toolkit

[![npm version](https://img.shields.io/npm/v/nepali-toolkit.svg)](https://www.npmjs.com/package/nepali-toolkit)
[![npm downloads](https://img.shields.io/npm/dm/nepali-toolkit.svg)](https://www.npmjs.com/package/nepali-toolkit)

TypeScript utilities for developers building applications for Nepal. The
published `nepali-toolkit` package provides zero-dependency, tree-shakeable
helpers for Bikram Sambat (BS) and Gregorian (AD) dates, Nepali numbers, NPR
currency, land units, number words, phone numbers, Nepali collation, and
official administrative data.

## Use the package

```bash
npm install nepali-toolkit
```

Use domain subpaths rather than the empty root entrypoint:

```ts
import { bs, formatBS, toAD } from 'nepali-toolkit/date';
import { formatNumber, toDevanagari } from 'nepali-toolkit/number';
import { formatNPR } from 'nepali-toolkit/currency';

const date = bs(2082, 4, 7);

formatBS(date, 'YYYY-MM-DD'); // '2082-04-07'
toAD(date); // Gregorian date fields
formatNumber('12345678'); // '1,23,45,678'
toDevanagari('2082'); // '२०८२'
formatNPR('123456.50');
```

## Domains

| Subpath | Purpose |
| --- | --- |
| `nepali-toolkit/date` | BS/AD conversion, parsing, formatting, arithmetic, fiscal years, relative dates, ranges, and adapters |
| `nepali-toolkit/number` | Nepali lakh/crore grouping and decimal parsing |
| `nepali-toolkit/number/digits` | ASCII and Devanagari digit conversion |
| `nepali-toolkit/currency` | NPR formatting and minor-unit formatting |
| `nepali-toolkit/land` | Hill and Terai land-area units and conversions |
| `nepali-toolkit/words` | English and Nepali number words and NPR amounts in words |
| `nepali-toolkit/collation` | Nepali-aware sorting and collation |
| `nepali-toolkit/phone` | Nepal phone parsing, formatting, and validation |
| `nepali-toolkit/admin` | Province, district, palika, ward, and postal-code lookups |

Administrative levels also have independent entrypoints:

```ts
import { getProvinces } from 'nepali-toolkit/admin/provinces';
import { getDistricts } from 'nepali-toolkit/admin/districts';
import { getPalikas } from 'nepali-toolkit/admin/palikas';

const provinces = getProvinces();
const districts = getDistricts('1');
const palikas = getPalikas('101');
```

## Repository layout

```text
nepali-toolkit/
├── apps/
│   └── expo-example/          # Expo integration scaffold
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

- [Package README](packages/nepali-toolkit/README.md)
- [Architecture blueprint](docs/blueprint.md)
- [Implementation plan](docs/implementation-plan.md)
- [Date migration notes](docs/miti-date-migration.md)
- [Domain contracts](docs/)

## License

License metadata has not been selected yet. Choose a license before accepting
external contributions or presenting this repository as an open-source project.
