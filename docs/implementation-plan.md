# Implementation Plan

Status: migration complete. Date behavior preserved; no new features added.

## Phase 0: Establish the workspace

- Confirm npm package-name availability and final repository name.
- Preserve the existing `np-date` Git history when making this directory the repository root.
- Add the pnpm workspace, shared TypeScript configuration, formatting, linting, testing, and release conventions.
- Scaffold `packages/nepali-utils`, `packages/nepali-ui`, and `apps/expo-example` without implementing UI components.
- Define supported Node, bundler, React Native, Expo, and Hermes versions.

Exit condition: both packages can be built and packed, and the Expo example can consume a trivial utility through its public package export.

## Phase 1: Migrate the date domain

- Follow [Miti-to-date migration blueprint](miti-date-migration.md).
- Move the existing implementation without changing calendar behavior.
- Preserve current conformance, invariant, data-generation, package, and bundle tests.
- Publish it internally as `nepali-utils/date` with narrower optional date subpaths if bundle evidence requires them.
- Keep unresolved Patro provenance visible as a release gate.

Exit condition: old and migrated test vectors produce identical results, generated data is reproducible, and date-only consumers retain no future utility domains.

## Phase 2: Build the number foundation

- Extract the existing ASCII/Devanagari digit mapping into the number domain without changing date formatting behavior.
- Specify deterministic Nepali grouping, signs, decimal input, fraction digits, and rounding.
- Support precision-safe decimal strings and appropriate `bigint` operations.
- Establish shared conventions used by currency, words, land, and phone without creating a broad internal dependency.

Exit condition: number behavior is deterministic without `Intl`, works on Hermes, and its bundle excludes date data.

## Phase 3: Add currency and land

- Implement NPR formatting over number primitives.
- Freeze symbol, spacing, placement, negative-value, fraction, and rounding contracts.
- Establish cited Nepal-specific land conversion constants.
- Implement exact hill/Terai decomposition and SI/imperial conversion.
- Keep parsing, normalization, conversion, and display as separate operations.

Exit condition: precision and boundary tests pass, `formatNPR` meets its recorded bundle budget, and neither domain imports Patro data.

## Phase 4: Add words

- Resolve the Nepali versus English API naming before coding (public wording is Nepali grouping/lakh-crore throughout; the CLDR "Indian numbering system" name appears only in an internal maintainer note, if at all).
- Freeze supported magnitudes, zero, negatives, decimals, currency minor units, conjunctions, and spelling policy.
- Build a reviewed conformance corpus for irregular Nepali number words.
- Keep word tables out of number-only and currency-format-only bundles.

Exit condition: every supported magnitude boundary and irregular form has reviewed fixtures, and importing `formatNPR` does not retain word tables.

## Phase 5: Add collation

- Define Unicode normalization and ordering behavior.
- Add capability detection for `Intl.Collator` without import-time assumptions.
- Implement and document the basic deterministic fallback.
- Test vowels, consonants, matras, halant, diacritics, conjuncts, punctuation, mixed scripts, and embedded numbers.
- Record differences permitted between the ICU and fallback backends.

Exit condition: limited-ICU/Hermes execution cannot crash and fallback output is stable against a reviewed corpus.

## Phase 6: Add phone and name utilities

- Define phone normalization and national/international display formats.
- Separate structural validity from current-prefix allocation validity.
- Add versioned, cited numbering metadata only if allocation-aware validation ships.
- Define conservative name normalization, validation, and display contracts.
- Reject cultural inference and automatic free-form name splitting.

Exit condition: validators expose their certainty and policy boundaries, accept Devanagari input where specified, and do not overclaim identity or allocation correctness.

## Phase 7: Harden packaging and runtime support

- Add ESM and CJS conditional exports for each public subpath.
- Verify declaration files and packed-package consumption.
- Extend consumer fixtures, metafile inspection, forbidden-domain assertions, and gzip budgets.
- Test Node, Vite/web bundling, Expo Go Android/Hermes, and at least one production-style Expo build.
- Verify missing or partial `Intl` never causes an import-time crash.

Exit condition: every published subpath has package, type, bundle-isolation, and supported-runtime evidence.

## Phase 8: Begin UI work separately

- Freeze utility interfaces consumed by each component.
- Design accessibility, controlled/uncontrolled state, keyboard, localization, and error-display contracts.
- Implement Expo React Native components only after those contracts are approved.
- Keep web/shadcn components deferred.

This phase is intentionally outside the utility implementation blueprint.

## Cross-cutting release gates

Every public domain must have:

- A documented behavioral contract and non-goals.
- Stable validation/error behavior.
- Unit, boundary, and property tests where applicable.
- A packed-consumer test through its public export.
- A measured ESM consumer bundle and forbidden-domain assertions.
- Hermes-safe module initialization.
- Source provenance for factual tables or Nepal-specific standards.
- A correction and semantic-versioning policy for data changes.
