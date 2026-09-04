# Test Contract

This document is the authority for what each test layer may and may not assert (T01).

## Layers

| Layer      | Location                                                          | Scope                                                  | Must NOT                                              |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| unit       | `tests/unit/`, top-level `tests/*.test.ts` feature/unit files     | Single module behaviour, fast, no network              | Reach into `dist/`, depend on TZ env                  |
| contract   | `tests/contract/`                                                 | Public export surface, error shapes, API stability     | Assert calendar correctness values beyond spot checks |
| invariants | `tests/invariants/`                                               | Round-trip laws, arithmetic laws, property-style loops | Be slow (>30s total); keep deterministic seeds        |
| data       | `tests/data/`                                                     | Generated data integrity, mutation guards              | Import from `dist/`                                   |
| package    | `tests/package-features.test.ts`, `tests/packed-consumer.test.ts` | Built `dist/` output, tree-shaking, exports map        | Run in `test:fast` (needs build)                      |

## Rules

1. New public export → add contract test in `tests/contract/`.
2. New calendar math → add invariant (round-trip / law) in `tests/invariants/`.
3. Data regeneration → `tests/data/` must stay green; run `npm run verify:data`.
4. Package tests are excluded from `test:fast`; they run only in the `package` CI job and via `npm run verify:package`.
5. TZ-sensitive tests must not depend on host TZ; CI runs a dedicated TZ matrix job.
6. Software gates (unit/contract/invariants/data/typecheck) block merge. Provenance gates (`verify:data`, `verify:release`) block release only — see `docs/testing.md`.
