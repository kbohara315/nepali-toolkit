# nepali-ui package guidance

This is the Expo/React Native UI package. Keep UI work here and do not move
utility algorithms or generated Nepal datasets into components. Reuse the
public `nepali-utils` subpath APIs so Metro/Hermes consumers can avoid loading
unrelated domains.

Required check:

```bash
pnpm --filter nepali-ui typecheck
```

When components are added, include a small example in `apps/expo-example` and
test on the supported Expo runtime. Avoid importing the `nepali-utils` root;
choose the narrowest domain subpath needed by the component.
