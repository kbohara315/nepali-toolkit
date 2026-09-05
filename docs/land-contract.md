# Land Contract (Phase 3b)

Nepal-specific hill and Terai area systems with an exact canonical area.
No `Intl`, no DOM/Node APIs, no date/currency imports. Builds only on
`../number/digits.js` for numeral rendering (or the number engine where
exact decimal output is needed — never binary float).

## Canonical area (exact)

All areas are stored as `bigint` **square micrometres (µm²)**. Rationale:
every named unit below divides the published SI constants into whole µm²,
so representation is exact with plain bigint arithmetic:

- 1 Ropani = 508.72 m² = 508,720,000,000,000 µm² (exact)
- 1 Daam = 1/256 Ropani = 1,987,187,500,000 µm² (exact)
- 1 Bigha = 6,772.63 m² = 6,772,630,000,000,000 µm² (exact)
- 1 Dhur = 1/400 Bigha = 16,931,575,000,000 µm² (exact)

Provenance: 1 Ropani = 5,476 sq ft = 508.72 m² and
1 Bigha = 72,900 sq ft = 6,772.63 m² are the standard published figures
used by Nepal's land administration. If a more authoritative citation
(National Measurement Standard / Land Revenue Office publication) refines
these, the constants change in ONE place (`constants.ts`) and the
correction policy in the blueprint applies (data correction = patch/minor
per semver note, never silent).

## Unit ladders

```text
Hill:  1 Ropani = 16 Aana; 1 Aana = 4 Paisa; 1 Paisa = 4 Daam
Terai: 1 Bigha = 20 Kattha; 1 Kattha = 20 Dhur
```

## Constructors

```ts
hillArea({ ropani?, aana?, paisa?, daam? }): Area
teraiArea({ bigha?, kattha?, dhur? }): Area
```

- All fields default 0; must be finite, integral, non-negative numbers —
  else `InvalidAreaError` (`code = 'INVALID_AREA'`, extends `TypeError`).
- Overflowing subordinate units (e.g. 20 aana, 25 dhur) are NORMALIZED by
  carrying upward — documented, no silent loss. Negative or fractional
  input is rejected, never normalized.
- Fractional smallest units (0.5 daam) are rejected in v1 (no sub-daam
  precision claim).

## Conversions (exact decimal strings, never float)

```ts
toSquareMetres(area): string   // exact, e.g. '508.72'
toSquareFeet(area): string     // published-figure exact (see note below)
fromSquareMetres(value: NumeralInput): Area
fromSquareFeet(value: NumeralInput): Area
```

NOTE on `toSquareFeet`: the two published figures are mutually rounded
(508.72 m² = 5,475.82 sq ft, not 5,476; 6,772.63 m² = 72,899.98 sq ft,
not 72,900), so no single linear map reproduces both published integers.
`toSquareFeet` therefore uses each system's published relation for areas
exact in that system's ladder (hill-ladder-exact → 1 Ropani = 5,476 sq ft;
Terai-ladder-exact → 1 Bigha = 72,900 sq ft; everything else → the Ropani
figure, up to 12 fraction digits, half-up). Deterministic and documented;
revisit only with a more authoritative citation.

`from*` accepts ASCII/Devanagari decimal strings (reuse the number
engine's exact parser — import from `../../number/grouping.js`, do NOT
copy it). Rounds half-up to the nearest whole µm².

## Display

```ts
formatHillArea(area, options?: AreaFormatOptions): string
formatTeraiArea(area, options?: AreaFormatOptions): string

type AreaFormatOptions = {
  numerals?: 'ascii' | 'devanagari'; // default 'devanagari'
  style?: 'long' | 'short';          // default 'long'
  omitZero?: boolean;                // default true
};
```

- Decomposition is by integer division (floor) from the exact area;
  sub-smallest remainders are dropped in DISPLAY ONLY — the `Area` keeps
  full precision. Document this on both functions.
- Long Nepali labels: रोपनी/आना/पैसा/दाम, बिघा/कट्ठा/धुर.
  Short labels: रो/आ/पै/दा, बि/क/ध.
- `omitZero: true` drops zero-valued units (but renders `० दाम` /
  `० धुर` for a zero area rather than an empty string).
- Cross-system display (hill area shown as Bigha-Kattha-Dhur) is exact-area
  based and supported by design: `formatTeraiArea(hillArea({...}))`.

## Exports (`nepali-utils/land`)

`hillArea`, `teraiArea`, `toSquareMetres`, `toSquareFeet`,
`fromSquareMetres`, `fromSquareFeet`, `formatHillArea`,
`formatTeraiArea`, `InvalidAreaError`, `Area` + option types. Subpath
`./land`, budget 2048 gzip, isolation: no Patro tokens, no `Intl`, no
date/currency/words internals.

## Non-goals (v1)

Sub-daam/dhur precision, ropani↔bigha "official exchange" claims beyond
shared SI area, land-valuation/tax logic, parsing display strings back.
