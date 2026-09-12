# Phone Contract (Phase 6a)

Nepal phone parsing, validation, and formatting. Normative sources:
NTA National Numbering Plan (`98-X-ZZZZZZZ`, operator codes, `97`
CDMA-evolution range), ITU NNP (+977, IDD 00, no trunk prefix),
Wikipedia/ITU formats (NSN 8 fixed / 10 mobile; Kathmandu `1 YXXXXXX`
Y=4/5/6 AND newer 8-digit ranges — both valid). Verified patterns from
nepali-phone (two-stage shape→lookup, typed result, longest-match area
codes) and valid-nepal-phone (separator tolerance). Known flaws we do
NOT repeat: unknown-operator-means-invalid, no Devanagari support,
single fixed landline length, unversioned tables.

## Public API (`nepali-toolkit/phone`)

```ts
parseNepalPhone(text: string): NepalPhone
isPossibleNepalPhone(text: string): boolean
isValidNepalPhone(phone: NepalPhone): boolean
getNepalPhoneType(phone: NepalPhone): 'mobile' | 'landline' | 'toll-free' | 'premium' | 'unknown'
formatNepalPhone(phone: NepalPhone, options?: PhoneFormatOptions): string
isSameNepalPhone(a: NepalPhone | string, b: NepalPhone | string): boolean
isAllocatedNepalPhone(phone: NepalPhone): boolean
metadataRevision: 'nta-2026-09'

type NepalPhone = {
  readonly kind: 'mobile' | 'landline';
  readonly country: '977';
  readonly national: string;
  readonly e164: `+977${string}`;
  readonly areaOrPrefix: string;
  readonly operator?: string;
  readonly areas?: readonly string[];
};
type PhoneFormatOptions = {
  style?: 'national' | 'international' | 'e164'; // default 'national'
};
```

- `parseNepalPhone` accepts +977 / 977 / 00-977-prefixed / bare national,
  ASCII + Devanagari digits, spaces/dashes/parens/dots. Malformed input
  throws `InvalidPhoneError` (`code = 'INVALID_PHONE'`, extends
  `TypeError`). Non-string input throws the same.
- Structural validity: mobile = 10 digits, 97/98-led with plausible
  prefix shape; landline = leading 0, longest-match area code, per-class
  subscriber lengths (Kathmandu 7–8 digits after 01). Unknown-but-shaped
  prefix/area → VALID phone with `operator`/`areas` undefined (never
  rejected — the nepali-phone flaw, regression-pinned).
- `isPossibleNepalPhone` = cheap length/shape gate on raw text (no
  tables). `isAllocatedNepalPhone` = prefix/area hits versioned tables.
- Formats: national `981-234-5678` / `01-4412345`; international
  `+977 981-234-5678`; e164 `+9779812345678`.
- `getNepalPhoneType`: toll-free / premium classified by pattern, never
  rejected as invalid.

## Files (`src/phone/`)

`normalize.ts` (canonical digit string), `tables.ts` (versioned data +
`metadataRevision`), `parse.ts`, `validate.ts`, `format.ts`,
`errors.ts`, `index.ts` (contract exports only), `tests/`.
Dependency: `../number/digits.js` ONLY.

## Data (versioned, NTA-cited in comments)

Mobile prefixes → operator-or-null (984/985/986, 974/975/976 NTC;
980/981/982 Ncell; 961/962/988, 972, 963 + other 96x/97x → operator or
null; uncertain rows ship as null). Full district area-code table with
longest-match (`01` vs `010`/`011`/`019`). Toll-free/premium patterns.

## Tests (every rule needs a failing-if-removed test)

Normalization matrix; every mobile family; Kathmandu 7- AND 8-digit;
2-digit-area landlines; unknown-prefix valid+unallocated; longest-match
010/011/019 + 01 district list; all 3 styles exact strings; canonical
compare incl. Devanagari equivalence; error codes; non-strings.

## Gates

`tsc` clean · full suite green · `tsup` builds · tree-shaking (`./phone`
fixture, 2048 budget, no Patro/Intl/sibling leakage) · `verify-package`
· `verify-data` deterministic · no "Indian" wording · no other-domain
changes.

## Non-goals

As-you-type masking, live carrier/portability lookup, SMS, name module.
