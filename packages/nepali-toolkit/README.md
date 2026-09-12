# nepali-toolkit

TypeScript utilities for developers building applications for Nepal.
`nepali-toolkit` provides accurate, dependency-free helpers for Bikram Sambat
(BS) and Gregorian (AD) dates, Nepali numbers, NPR currency, land units,
Nepali words, phone numbers, collation, and Nepal's administrative hierarchy.

## Install

```bash
npm install nepali-toolkit
```

## Quick start

Import from a domain subpath so bundlers retain only the code you use:

```ts
import { bs, formatBS, toAD } from 'nepali-toolkit/date';
import { formatNumber, toDevanagari } from 'nepali-toolkit/number';
import { formatNPR } from 'nepali-toolkit/currency';

const date = bs(2082, 4, 7);

formatBS(date, 'YYYY-MM-DD'); // '2082-04-07'
toAD(date); // { year: ..., month: ..., day: ... }
formatNumber('12345678'); // '1,23,45,678'
toDevanagari('2082'); // '२०८२'
formatNPR('123456.50');
```

## Domains

- **`nepali-toolkit/date`**: BS/AD conversion, parsing, formatting, date
  arithmetic, fiscal years, relative dates, ranges, and adapters.
- **`nepali-toolkit/number`**: Nepali lakh/crore grouping and decimal parsing.
- **`nepali-toolkit/number/digits`**: ASCII and Devanagari digit conversion.
- **`nepali-toolkit/currency`**: NPR formatting, including minor units.
- **`nepali-toolkit/land`**: Hill and Terai land-area units and conversions.
- **`nepali-toolkit/words`**: English and Nepali number words plus NPR amounts.
- **`nepali-toolkit/collation`**: Nepali-aware sorting and collation.
- **`nepali-toolkit/phone`**: Nepal phone parsing, formatting, and validation.
- **`nepali-toolkit/admin`**: Official province, district, palika, ward, and
  postal-code lookups.

Administrative levels can also be imported independently:

```ts
import { getProvinces } from 'nepali-toolkit/admin/provinces';
import { getDistricts } from 'nepali-toolkit/admin/districts';
import { getPalikas } from 'nepali-toolkit/admin/palikas';

const provinces = getProvinces();
const districts = getDistricts('1');
const palikas = getPalikas('101');
```

## Design

- Zero runtime dependencies.
- TypeScript-first with ESM and CommonJS builds.
- Explicit subpath exports for tree-shaking and small consumer bundles.
- Civil-date APIs do not depend on timezones or browser globals.
- Administrative data is derived from cited Government of Nepal sources.

## Status

This package is in early development. APIs may change before the `1.0.0`
release. Contributions and issue reports are welcome.
