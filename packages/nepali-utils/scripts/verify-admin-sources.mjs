// Verifies the GoN upstream bytes in src/admin/data/raw/upstream/
// against their recorded SHA-256 hashes (see PROVENANCE.md).
//
//   pnpm verify:admin
//
// Dependency-free (node:crypto/fs only). Re-extraction itself needs
// python3 + xlrd: `python3 src/admin/data/raw/tools/extract-upstream.py`.

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const upstream = join(root, 'src', 'admin', 'data', 'raw', 'upstream');

const sums = new Map();
for (const line of readFileSync(join(upstream, 'SHA256SUMS'), 'utf8')
  .split('\n')
  .filter((l) => l.trim().length > 0)) {
  const [hash, name] = line.split(/\s+/);
  sums.set(name, hash);
}

const files = [];
const walk = (dir, prefix) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'SHA256SUMS') continue;
    if (entry.isDirectory()) walk(join(dir, entry.name), `${prefix}${entry.name}/`);
    else files.push(`${prefix}${entry.name}`);
  }
};
walk(upstream, '');

if (files.length !== sums.size) {
  throw new Error(
    `verify:admin: ${files.length} upstream files, ${sums.size} hashes`,
  );
}
for (const name of files.sort()) {
  const expected = sums.get(name);
  if (!expected) throw new Error(`verify:admin: no hash recorded for ${name}`);
  const actual = createHash('sha256')
    .update(readFileSync(join(upstream, name)))
    .digest('hex');
  if (actual !== expected) {
    throw new Error(`verify:admin: hash mismatch for ${name}`);
  }
}
console.log(`verify:admin: ${files.length} upstream files match SHA256SUMS.`);
