import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const files = ['src/date/internal/generated-data.ts', 'src/date/internal/data.ts'];

// The committed files are formatted with the repo formatter; the generator
// emits semantically identical but differently wrapped output. Compare a
// whitespace/quote-normalized form so the check validates data, not wrapping.
const normalize = (s) => s.replaceAll('"', "'").replaceAll(/\s+/g, ' ').trim();

const before = new Map(files.map((f) => [f, normalize(readFileSync(new URL(f, root), 'utf8'))]));

execFileSync(process.execPath, ['scripts/date/generate-data.mjs'], {
  cwd: root,
  stdio: 'inherit',
});

let failed = false;
for (const f of files) {
  const after = normalize(readFileSync(new URL(f, root), 'utf8'));
  if (before.get(f) !== after) {
    console.error(`verify:data: ${f} changed semantically — regenerate with \`pnpm generate:date\``);
    failed = true;
  }
}

// Restore formatter-managed wrapping.
execFileSync('git', ['checkout', '--', ...files], { cwd: root, stdio: 'inherit' });

if (failed) process.exit(1);
console.log('verify:data: generated sources are deterministic');
