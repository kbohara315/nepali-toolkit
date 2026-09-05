# Data provenance — `admin` domain

Transcribed from Government of Nepal sources only. No third-party
datasets, no hand-written names, no guessed spellings. Revision:
`gov-2026-09`.

Regenerate the runtime tables with `pnpm generate:admin` (reads
`data/raw/*.json`, re-derives every join, asserts every invariant).

## Reproduction chain (all checked in)

`data/raw/upstream/` holds the GoN bytes verbatim (55 files, 4.7 MB):

- `nso-geocodes-local-unit.xls` — S1 workbook.
- `nso-coding-methodology.pdf`, `nso-district-coding-map.pdf` — S1 notes;
  the map PDF duplicates the workbook (English names + codes) with worse
  Nepali extraction, so the `.xls` stays canonical.
- `census-portal-ward-1724.js`, `census-portal-ward-8539.js` — S2 bundle
  chunks carrying the ward dropdown records.
- `mofaga-pages/01.html` … `51.html` — S3 contact-table pages as served.

`data/raw/tools/extract-upstream.py` (needs `pip install xlrd`) regenerates
`data/raw/*.json` from `upstream/` with asserted counts — byte-identical to
the checked-in raws. `pnpm verify:admin` re-hashes `upstream/` against
`upstream/SHA256SUMS`. `scripts/generate-admin.mjs` then derives
`data/{provinces,districts,palikas}.ts` with asserted joins.

## Sources

| # | Source | Artifact | Vintage / accessed |
|---|--------|----------|--------------------|
| S1 | National Statistics Office, _प्रदेश, जिल्ला र स्थानीय तहको भौगोलिक कोड र नक्सा_ (`nsonepal.gov.np/content/7694/…`) | `1695378470_83.xls` (sha256 `b6d139e1…72279`) — sheets `pradesh_code`, `district_code` (77 rows), `localunit_code` (753 rows) | Published ५ असोज २०८०; workbook saved 2023-09-22; fetched 2026-09-05 |
| S2 | NSO National Population and Housing Census 2021 portal (`censusresults.nsonepal.gov.np`) | Bundled dropdown data (`1724-….js` sha256 `65bec503…890fa83`, `8539-….js` sha256 `a943b325…dc45f9`): 753 `{district,value,label,no_of_wards}` palika records + 77 `{label,value,province}` district records | Bundle build 2023; fetched 2026-09-05 |
| S3 | Ministry of Federal Affairs and General Administration, _स्थानीय तहको सम्पर्क_ (`mofaga.gov.np/local-contact`, 51 pages) | 753 contact-table rows (province / palika / district names in Nepali Unicode) | Scraped 2026-09-05 |
| S4 | NSO NPHC 2021 provincial reports + thematic publications | Province English names in official use (Koshi / Madhesh / Bagmati / Gandaki / Lumbini / Karnali / Sudurpashchim + “ Province”) | 2023–2026 |
| S5 | General Post Office, _Postal Code Of Nepal_ (`gpo.gov.np/pages/postal-code-1259614658/`) | 753-row palika/ward postal table (`upstream/gpo-postal.html` → `raw/gpo-postal.json`): per-palika 5-digit code, ward ranges `{code5}{01} देखि {wards:02d}` | Fetched 2026-09-05 |

Cross-checks: MoFAGA English-notice PDF `Notices-20260513150631619.pdf`
(district + palika English names, 288 listed rows inspected for the four
conflict cases); NSO district-coding-map PDF (English names + codes only —
its Nepali column extracts worse than S1, so S1 stays canonical).

## Canonical rules (applied by `scripts/generate-admin.mjs`)

- **R1** — Codes and palika English/Nepali names are canonical from S1
  (code-linked). 5-digit palika = district code + sequence; 3-digit
  district = province digit + sequence; province = single digit 1–7.
- **R2** — District and province Nepali names are canonical from S3:
  S1 carries them only in legacy Preeti encoding (e.g. `tfKn]hª` for
  ताप्लेजुङ), which this package does not decode. The S3↔S1 district join
  is a per-district majority vote over 623 shared exact palika names
  (palika names repeat across districts — e.g. मिक्लाजुङ in Morang and
  Panchthar — so a global unique match is impossible); all 77 districts
  map 1:1 with a strict majority.
- **R3** — Province English names per S4 usage.
- **R4** — Names are transcribed faithfully except mechanical whitespace
  normalization (NFC, collapse, trim). Three palika names needed it
  (फालेलुङ, लिम्चुङबुङ, बैतेश्वर double spaces); district `RAUTAHAT `
  trailing space trimmed.
- **R5** — Ward counts from S2, joined positionally (S2 value order ===
  S1 row order within each district; district S.N. and province
  cross-checked exactly). Total 6,743 wards.
- **R6** — Palika type from the English suffix (`Rural/Urban
  Municipality`, incl. S1’s official `Metropolitian` typo), cross-checked
  100% against the Nepali suffix (incl. S1’s `गाउंपालिका`/`नगरापालिका`
  typos). Counts: rural 460, municipality 276, sub-metropolitan 11,
  metropolitan 6.

## Known inter-source variants (transcribed, not adjudicated)

- S2 ward-list labels differ on 4 palikas (positional join kept):
  11405 Limchungbung/Limchunbung, 30304 Shuva Kalika/Kalika,
  60702 Kushe/Kuse, 70905 Mahakali/Dodhara Chandani.
- S3 palika Nepali spellings differ from S1 on 224/753 rows — mostly
  systematic anusvara variation (S1 फुङलिङ्ग vs S3 फुङलिङ). Canonical is
  S1 per R1.
- S1↔S3 conflicts on record: 30304 Rasuwa (S1 शुभ कालीका / S3 कालिका),
  60702 Jajarkot (S1 कुशे / S3 कुसे), 70905 Kanchanpur (S1 महाकाली /
  S3 दोधारा चाँदनी). Canonical is S1 per R1.
- District English is title-cased S1 (`TAPLEJUNG` → `Taplejung`,
  `CHITAWAN` → `Chitawan` — the CBS `w` spelling, kept deliberately;
  `NAWALPARASI EAST` → `Nawalparasi East`, matching phone-table usage).

## Postal codes (S5, derived — no new tables)

Under the GPO scheme a palika's pin code IS its 5-digit NSO code, and a
ward's pin is that code plus the zero-padded 2-digit ward number
(`1010101`–`1010107` for 7-ward palika `10101`). `generate:admin`
machine-checks all 753 GPO rows against the NSO tables (code sets equal,
ward counts equal, range shapes exact) on every regeneration; the runtime
API (`getPostalCode`, `getWardPostalCode`, `parsePostalCode`) derives from
the admin tables. The classic 1991 post-office system (e.g. Kathmandu
44600) is per-post-office, not per-palika, and is out of scope.

## Non-goals for this revision

Province/district capitals and headquarters, coordinates, postal codes,
population figures, ward names and boundaries, and VDC-era codes are not
shipped. Ward validity is range-based (`1..wards`); contiguity follows
the official ward-numbering scheme.

## Correction policy

A source revision (new NSO/MoFAGA snapshot) bumps `adminRevision` and
regenerates. Spelling corrections are accepted only as a newer official
snapshot, never as hand edits — `generate:admin` must stay reproducible
from `data/raw/*.json`.
