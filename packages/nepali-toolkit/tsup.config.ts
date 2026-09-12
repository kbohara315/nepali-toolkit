import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/date/index.ts',
    'src/date/convert.ts',
    'src/date/value.ts',
    'src/date/arithmetic.ts',
    'src/date/format.ts',
    'src/date/format-display.ts',
    'src/date/parse.ts',
    'src/date/fiscal.ts',
    'src/date/relative.ts',
    'src/date/range.ts',
    'src/date/locale/en.ts',
    'src/date/locale/ne.ts',
    'src/date/adapters/date.ts',
    'src/date/adapters/temporal.ts',
    'src/date/adapters/timezone.ts',
    'src/number/index.ts',
    'src/number/digits.ts',
    'src/currency/index.ts',
    'src/land/index.ts',
    'src/words/index.ts',
    'src/collation/index.ts',
    'src/phone/index.ts',
    'src/admin/index.ts',
    'src/admin/provinces.ts',
    'src/admin/districts.ts',
    'src/admin/palikas.ts',
    'src/admin/hierarchy.ts',
    'src/admin/postal.ts',
    'src/admin/validate.ts',
  ],
  format: ['esm', 'cjs'],
  outExtension: ({ format }) => (format === 'cjs' ? { js: '.cjs' } : { js: '.js' }),
  dts: true,
  // Source maps are useful during development but are not needed by
  // consumers and embed the original TypeScript into the published tarball.
  sourcemap: false,
  clean: true,
  // Keep each public entry self-contained. Shared chunks currently cause
  // unrelated entrypoints to import every generated chunk, defeating
  // subpath tree shaking for consumers.
  splitting: false,
  minify: true,
  treeshake: true,
});
