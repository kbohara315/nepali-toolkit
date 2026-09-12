# nepali-toolkit

Blueprint workspace for Nepal-focused TypeScript utilities and Expo React Native components.

This directory currently contains planning documentation only. Package scaffolding, source migration, and feature implementation have not started.

## Intended workspace

```text
nepali-toolkit/
├── apps/
│   └── expo-example/          # Integration and Hermes verification app
├── packages/
│   ├── nepali-toolkit/          # Pure TypeScript, zero-runtime-dependency utilities
│   └── nepali-ui/             # Expo React Native components
├── docs/
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

The existing `np-date`/`miti` implementation will become the `date` domain inside the `nepali-toolkit` package. There will be no separate `miti` compatibility package because it has not been published.

## Documents

- [Product and architecture blueprint](docs/blueprint.md)
- [Implementation plan](docs/implementation-plan.md)
- [Miti-to-date migration blueprint](docs/miti-date-migration.md)
