# Repository agent guidance

This repository is a pnpm monorepo. The primary production package is
`packages/nepali-utils`; `packages/nepali-ui` is an Expo/React Native package
and is currently scaffold-level work.

Before changing code, read the nearest package `AGENTS.md`. Keep changes scoped
to the requested package and preserve existing public APIs unless the task is
explicitly a breaking release.

For the utilities package, the required gates are:

```bash
pnpm --filter nepali-utils typecheck
pnpm --filter nepali-utils test
pnpm --filter nepali-utils verify:package
pnpm --filter nepali-utils benchmark:runtime
```

When a change affects a public utility, run the runtime benchmark before and
after the change. Save JSON output outside the repository while iterating:

```bash
pnpm --filter nepali-utils build >/dev/null
node packages/nepali-utils/scripts/benchmark-runtime.mjs --json > /tmp/nepali-utils-before.json
# make the change, rebuild
pnpm --filter nepali-utils build >/dev/null
node packages/nepali-utils/scripts/benchmark-runtime.mjs --json > /tmp/nepali-utils-after.json
node packages/nepali-utils/scripts/compare-runtime.mjs /tmp/nepali-utils-before.json /tmp/nepali-utils-after.json
```

Do not treat one noisy benchmark run as proof of a regression. Repeat a result
that crosses the 20% comparison threshold, and report the machine, Node
version, iterations, and whether the process was warm.
