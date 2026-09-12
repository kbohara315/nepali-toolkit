import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..', '..', '..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  readonly sideEffects: boolean;
  readonly files: readonly string[];
  readonly exports: Record<string, { readonly types: string; readonly import: string }>;
};

const subpaths = [
  '.',
  './date',
  './date/convert',
  './date/value',
  './date/arithmetic',
  './date/format',
  './date/parse',
  './date/fiscal',
  './date/relative',
  './date/range',
  './number',
  './number/digits',
] as const;

describe('package contract', () => {
  it('publishes every implemented subpath as an ESM entry with declarations', () => {
    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.files).toEqual(['dist']);
    for (const subpath of subpaths) {
      const entry = packageJson.exports[subpath];
      expect(entry).toBeDefined();
      expect(entry.import).toMatch(/^\.\/dist\/.*\.js$/);
      expect(entry.types).toMatch(/^\.\/dist\/.*\.d\.ts$/);
    }
  });

  it('keeps the language-neutral JSON out of source runtime imports', () => {
    const sourceFiles = [
      'src/date/internal/conversion.ts',
      'src/date/internal/patro.ts',
      'src/date/range.ts',
    ];
    for (const file of sourceFiles) {
      expect(readFileSync(resolve(root, file), 'utf8')).not.toContain('patro.json');
    }
  });
});
