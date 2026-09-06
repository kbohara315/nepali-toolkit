# nepali-utils package guidance

This package is pure TypeScript with zero runtime dependencies. It publishes
ESM and CJS builds through explicit subpath exports. The ESM subpaths are the
size-sensitive contract.

## Architecture rules

- Keep domains independent: date, number, currency, land, words, collation,
  phone, and admin must not import each other unless the API requires it.
- Prefer `nepali-utils/admin/provinces`, `admin/districts`, and
  `admin/palikas` when a consumer only needs one administrative level. Do not
  add large generated tables to a shared helper.
- Keep generated data under the generated-data ownership comments; update it
  through the documented generation scripts.
- Preserve `sideEffects: false` correctness: modules must not perform observable
  work at import time. Lazy indexes are preferred for large tables.
- Public functions should have direct functional exports. Avoid a default
  singleton or a root barrel that eagerly imports every domain.
- Avoid adding dependencies for functionality available in the platform.

## Required verification

Run these from the repository root after source or packaging changes:

```bash
pnpm --filter nepali-utils typecheck
pnpm --filter nepali-utils test
pnpm --filter nepali-utils verify:package
node packages/nepali-utils/scripts/verify-tree-shaking.mjs
```

For performance-sensitive changes, also run:

```bash
pnpm --filter nepali-utils build >/dev/null
node scripts/benchmark-runtime.mjs --json > /tmp/nepali-utils-after.json
```

The benchmark is warm-process smoke evidence, not a statistically rigorous
microbenchmark. Compare before and after with
`benchmark:runtime:compare`; use the same Node version and machine, and repeat
any apparent regression or improvement.

If a public entrypoint, table, or algorithm changes, update the relevant
tree-shaking fixture and add a focused regression test. Bundle budgets are
measured as minified ESM consumer bundles and should not be replaced by raw
source size.

## Performance review checklist

Check import-time allocations, generated table retention, repeated validation,
normalization inside loops, accidental `Intl` work on the basic path, and
whether a cache increases startup memory or bundle size. Record bundle bytes
and benchmark output in the change description when the task targets speed or
size.
