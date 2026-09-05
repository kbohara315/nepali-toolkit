# Collation Contract (Phase 5)

Nepali string sorting with correct barnamala order. Hybrid architecture:
native `Intl` fast path when the runtime proves trustworthy, custom
weight-table core otherwise. No DOM/Node APIs. No imports from
date/number/currency/land/words (self-contained domain; only shared
idiom is the error-code pattern).

## Why custom core exists

CLDR's `ne` tailoring is `[reorder Deva]` only — no vowel/consonant,
matra, anusvara, or conjunct rules — and `Intl` is missing or
data-reduced on some Hermes/Android runtimes. The custom core is the
guaranteed path; `Intl` is the加速 fast path, never the only path.

## Public API (`nepali-utils/collation`)

```ts
createNepaliCollator(options?: CollationOptions): NepaliCollator

type CollationOptions = {
  backend?: 'auto' | 'intl' | 'basic'; // default 'auto'
  conjuncts?: 'school' | 'phonetic';   // default 'school'
  numeric?: boolean;                   // default false (lexicographic)
  sensitivity?: 'base' | 'full';       // default 'base'
  ignorePunctuation?: boolean;         // default false (v1 weights punct)
};

// Shared text primitives (same normalization the collator sees):
normalizeNepaliText(input: string): string; // NFC + guarded preposed-ि fix + control strip
containsDevanagari(input: string): boolean;
isDevanagariOnly(input: string): boolean;
countDevanagariChars(input: string): number;
countNepaliWords(input: string): number;
getNepaliTextStats(input: string): NepaliTextStats; // words, characters, noSpaces, sentences, paragraphs
isIgnorablePunctuation(ch: string): boolean;
stripIgnorablePunctuation(input: string): string;
nepaliIncludes(haystack: string, needle: string, options?: NepaliSearchOptions): boolean;
nepaliStartsWith(haystack: string, needle: string, options?: NepaliSearchOptions): boolean;
// NepaliSearchOptions = { caseInsensitive?: boolean; /* default true */ ignorePunctuation?: boolean /* default false */ }

type NepaliCollator = {
  compare(a: string, b: string): -1 | 0 | 1; // one-off path (documented slower)
  sort(values: readonly string[]): string[]; // precomputed-key path (fast)
  equals(a: string, b: string): boolean;     // === fast path, then keys
  readonly backend: 'intl' | 'basic';        // resolved backend (never 'auto')
};
```

Non-string inputs throw `InvalidCollationError` (`code =
'INVALID_COLLATION'`, extends `TypeError`).

## Backend resolution (`auto`)

1. `Intl.Collator` exists AND `new Intl.Collator('ne-NP')` passes the
   trust check: `resolvedOptions().locale` starts with `ne` AND orders
   the probe pair correctly (`compare('ख', 'क') > 0` and
   `compare('ग', 'ख') > 0`). The check is memoized per `Intl` identity
   (steady-state callers pay no re-probe; a swapped/stubbed `Intl`
   re-probes), never per comparison. `ignorePunctuation: true` is passed
   through to `Intl` as well.
2. Else `basic` (custom table). `backend: 'intl'` with a failed check
   throws `InvalidCollationError` (explicit request, no silent fallback);
   `backend: 'basic'` always uses the table.

## Custom table (`basic`)

Pipeline per string: NFC-normalize (native `String.prototype.normalize`,
never hand-rolled) → guarded preposed-ि fixup → strip ZWJ/ZWNJ/ZWSP/BOM →
weight lookup. The fixup swaps a misplaced preposed short-i past its
consonant (`िक` → `कि`) ONLY when the matra is not already preceded by a
consonant, halant or nukta — correct input like `किरण` is never touched
(capture-group form, no lookbehind: import-safe on older Hermes).

- **Primary weights** follow barnamala order:
  `ॐ अ आ इ ई उ ऊ ऋ ए ऐ ओ औ अं अः क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह`
  Matras map to their vowel's weight (क < का < कि < की < कु … — कि-words
  sort by vowel weight before any consonant second unit). Anusvara /
  chandrabindu / visarga sort as lighter-primary (कं < क). Halant is
  weight-ignored. Nukta is tertiary-only (क़ ≡ क at primary).
- **Conjuncts**: `school` (default) sorts क्ष त्र ज्ञ AFTER ह (Nepali
  school order); `phonetic` sorts them with their first consonant
  (`Intl`-like: sub-weight U+E080, above every base weight, so a phonetic
  conjunct follows same-initial words but precedes the next initial —
  probed 7/8 agreement with `Intl.Collator('ne-NP')`; known divergence is
  medial त्र: basic-phonetic स्तर < सत्र, Intl has सत्र < स्तर).
  Implemented as contraction weights on the sequences क+्+ष, त+्+र, ज+्+ञ,
  matched wherever they occur (e.g. सत्र takes the त्र contraction).
  Non-contracted clusters (स्त्र, श्र, द्य, क्र, द्ध) weigh as consonant
  sequences with the halant skipped.
- **Digits**: with `numeric: true`, maximal embedded runs of
  ASCII/Devanagari digits compare numerically (equal length → digit
  order); otherwise digits sort by their code-point-derived weight.
- **Case**: ASCII A–Z folds to a–z at primary (`base` ties across case,
  e.g. `Apple` ≡ `apple`); the raw form rides at tertiary so `full`
  distinguishes case — the same level scheme as nukta. Applies to the
  ASCII fast path and to embedded Latin in mixed-script strings.
- **Sensitivity**: `base` emits primary weights only (marks ignored);
  `full` appends secondary (anusvara-type distinctions, matra identity
  already primary) and tertiary (nukta, ASCII case) levels.
- **`ignorePunctuation` (opt-in, default false)**: skips the
  `isIgnorablePunctuation` set (space/tab, common punctuation,
  danda/double-danda) at primary, so `क-क` ≡ `कक` and `घर।` ≡ `घर`.
  Default `false` preserves the v1 weighted behavior below.

## Performance mandates (measured: keys beat naive 4×, beat Intl 3×)

1. `sort()` MUST precompute one sort key per string (O(N)) then compare
   keys — never normalize+weight per comparison.
2. Keys are single strings (weights encoded as chars), compared with
   native `<` — no element-loop array compares on the hot path.
3. ASCII fast path: `/^[\x00-\x7F]*$/` strings skip normalization and
   table lookup (case-folded; code-point order is correct for pure Latin).
4. `equals` short-circuits on `===` first.
5. Trust probe is memoized per `Intl` identity — no re-probe per collator
   in steady state. No cross-call key memoization in v1 (no WeakMap leak
   surface).

## Conformance corpus (tests must include)

- Full barnamala sequence sorts to itself (shuffled → sorted equals
  canonical order above).
- Pitfall pairs: क vs क् (near-equal, primary tie); क़ U+0958 vs क+़
  (equal at base); ज्ञ placement per `conjuncts` mode; हँ vs हं
  (equal at base, differ at full); denormalized ि+क input sorts with कि.
- Mixed Nepali/Latin list order; numeric vs lexicographic digit runs
  (`file2` vs `file10` with `numeric: true/false`).
- Backend resolution: forced `'basic'` works with `Intl` deleted
  (stub `globalThis.Intl` undefined in the test); forced `'intl'`
  throws when the trust check fails.
- Cross-check sample: `Intl`-resolved and `basic` backends agree on a
  fixed corpus (excluding conjuncts-school cases, which intentionally
  differ — assert the difference explicitly). Matra-vs-consonant pairs
  where basic and `Intl` genuinely differ are pinned by name
  (`volume-words.test.ts` backend parity); pairs fixed by the guarded
  preposed-ि fixup (विराटनगर/वीरगञ्ज, जितपुर/जुम्ला) are pinned as
  agreement.
- Case folding: `Apple` ≡ `apple` at `base`, distinct at `full`
  (`case-punct.test.ts`).
- `ignorePunctuation: true` ties hyphen/space/danda forms with the bare
  form; default keeps v1 weights (`case-punct.test.ts`).
- Search helpers: denormalized/case/punctuation-insensitive matching
  (`search.test.ts`); generic (non-contracted) conjunct behavior
  (`generic-conjuncts.test.ts`).

## Exports, budget, isolation

`createNepaliCollator`, `InvalidCollationError`, option/collator types.
Subpath `./collation`, budget 3072 gzip (tables + two paths; adjust only
with a recorded diff). Isolation: no Patro tokens, no date/currency/land/
words/number-engine internals.

## Punctuation and whitespace (documented actual behavior)

ZWJ/ZWNJ/ZWSP/BOM are stripped before weighting (format controls, no
order). By default Danda । and double danda ॥ sort as terminators after
all letters (`घर < घर। < घर॥`), and space and hyphen-minus carry primary
weight in code-point order (`कक < "क क" < क-क`) — NOT primary-ignorable
as UCA would have them. This default is pinned by tests in
`punctuation.test.ts`. Opt out per collator/search with
`ignorePunctuation: true` (pinned in `case-punct.test.ts`,
`search.test.ts`); the ignored set is `isIgnorablePunctuation` in
`text.ts`.

## Text primitives and search (`text.ts`, same subpath)

`normalizeNepaliText` is the single source of truth for the pipeline
above — `buildKey` calls it, so normalizer and collator cannot drift.
Detection (`containsDevanagari`, `isDevanagariOnly`,
`countDevanagariChars`) uses the Devanagari block U+0900–U+097F.
`getNepaliTextStats`/`countNepaliWords` tokenize Nepali-aware (whitespace
split, danda/punctuation trimmed, sentences on । ॥ ? !). `nepaliIncludes`/
`nepaliStartsWith` match on the normalized form (case-insensitive by
default, optional punctuation stripping), so a denormalized needle like
`िक` still finds `किरण`.

## Non-goals (v1)

Sort-stability beyond `Array.prototype.sort` guarantees, collation of
non-Devanagari scripts beyond pass-through code-point order, and
grapheme-cluster counting (stats count code points).
