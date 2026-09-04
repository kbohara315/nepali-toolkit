import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/date/index.ts',
    'src/date/convert.ts',
    'src/date/value.ts',
    'src/date/arithmetic.ts',
    'src/date/format.ts',
    'src/date/parse.ts',
    'src/date/fiscal.ts',
    'src/date/relative.ts',
    'src/date/range.ts',
    'src/number/index.ts',
    'src/number/digits.ts',
  ],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  minify: true,
  treeshake: true,
});
