# tests/ — Organization (T02)

Header map for contributors. Authority for placement questions is `tests/contract/README.md` (test contract).

| Path                                                              | What goes here                     | Example                                               |
| ----------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| `tests/unit/`                                                     | Single-module fast tests           | `grammar.test.ts`, `fiscal-boundaries.test.ts`        |
| `tests/contract/`                                                 | Public API / error-shape stability | `errors.test.ts` + `README.md` (contract doc, T01)    |
| `tests/invariants/`                                               | Round-trip + arithmetic laws       | `public-roundtrip.test.ts`, `arithmetic-laws.test.ts` |
| `tests/data/`                                                     | Generated data integrity           | `mutation.test.ts`                                    |
| `tests/*.test.ts` (top level)                                     | Feature/unit coverage per module   | `format.test.ts`, `miti.test.ts`                      |
| `tests/package-features.test.ts`, `tests/packed-consumer.test.ts` | Built-package only (needs `dist/`) | excluded from `test:fast`                             |

Placement rule: unit → contract → invariants → data → package, in that priority order.
If a test needs `dist/`, it belongs in package. If it asserts a law over many inputs, invariants.
