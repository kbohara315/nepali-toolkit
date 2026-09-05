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
};

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
   `compare('ग', 'ख') > 0`). The check runs ONCE per collator (cached),
   never per comparison.
2. Else `basic` (custom table). `backend: 'intl'` with a failed check
   throws `InvalidCollationError` (explicit request, no silent fallback);
   `backend: 'basic'` always uses the table.

## Custom table (`basic`)

Pipeline per string: NFC-normalize (native `String.prototype.normalize`,
never hand-rolled) → strip ZWJ/ZWNJ/ZWSP → weight lookup.

- **Primary weights** follow barnamala order:
  `ॐ अ आ इ ई उ ऊ ऋ ए ऐ ओ औ अं अः क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह`
  Matras map to their vowel's weight (क < का < कि < की). Anusvara /
  chandrabindu / visarga sort as lighter-primary (कं < क). Halant is
  weight-ignored. Nukta is tertiary-only (क़ ≡ क at primary).
- **Conjuncts**: `school` (default) sorts क्ष त्र ज्ञ AFTER ह (Nepali
  school order); `phonetic` sorts them with their first consonant
  (`Intl`-like). Implemented as contraction weights on the sequences
  क+्+ष, त+्+र, ज+्+ञ.
- **Digits**: with `numeric: true`, maximal embedded runs of
  ASCII/Devanagari digits compare numerically (equal length → digit
  order); otherwise digits sort by their code-point-derived weight.
- **Sensitivity**: `base` emits primary weights only (marks ignored);
  `full` appends secondary (anusvara-type distinctions, matra identity
  already primary) and tertiary (nukta) levels.

## Performance mandates (measured: keys beat naive 4×, beat Intl 3×)

1. `sort()` MUST precompute one sort key per string (O(N)) then compare
   keys — never normalize+weight per comparison.
2. Keys are single strings (weights encoded as chars), compared with
   native `<` — no element-loop array compares on the hot path.
3. ASCII fast path: `/^[\x00-\x7F]*$/` strings skip normalization and
   table lookup (code-point order is correct for pure Latin).
4. `equals` short-circuits on `===` first.
5. No cross-call key memoization in v1 (no WeakMap leak surface).

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
  differ — assert the difference explicitly).

## Exports, budget, isolation

`createNepaliCollator`, `InvalidCollationError`, option/collator types.
Subpath `./collation`, budget 3072 gzip (tables + two paths; adjust only
with a recorded diff). Isolation: no Patro tokens, no date/currency/land/
words/number-engine internals.

## Punctuation and whitespace (documented actual behavior)

ZWJ/ZWNJ/ZWSP are stripped before weighting (format controls, no order).
Danda । and double danda ॥ sort as terminators after all letters
(`घर < घर। < घर॥`). Space and hyphen-minus carry primary weight in
code-point order (`कक < "क क" < क-क`) — NOT primary-ignorable as UCA
would have them. This is a known v1 deviation, pinned by tests in
`punctuation.test.ts`; revisit only on user evidence.

## Non-goals (v1)

Case folding rules beyond basic Latin, UCA-style variable weighting for
punctuation/whitespace (see above), sort-stability beyond
`Array.prototype.sort` guarantees, collation of non-Devanagari scripts
beyond pass-through code-point order.
