import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const entries = Object.entries(packageJson.exports);

const isolated = {
  './date/format': ['working-2026-08-22', 'YEAR_PATTERN_IDS'],
  './number': ['working-2026-08-22', 'YEAR_PATTERN_IDS', 'MONTH_PATTERNS', 'Intl'],
  './number/digits': ['working-2026-08-22', 'YEAR_PATTERN_IDS', 'MONTH_PATTERNS', 'Intl'],
  './currency': ['working-2026-08-22', 'YEAR_PATTERN_IDS', 'MONTH_PATTERNS', 'Intl'],
  './land': ['working-2026-08-22', 'YEAR_PATTERN_IDS', 'MONTH_PATTERNS', 'Intl'],
  './words': ['working-2026-08-22', 'YEAR_PATTERN_IDS', 'MONTH_PATTERNS', 'Intl', 'formatNumber', 'formatNPR', 'hillArea', 'fromSquareMetres', 'toDevanagariTables'],
  './collation': ['working-2026-08-22', 'YEAR_PATTERN_IDS', 'MONTH_PATTERNS', "from '../number", "from '../date", "from '../currency", "from '../land", "from '../words", 'toDevanagariTables', 'formatNumber', 'formatNPR', 'hillArea'],
  './date/range': ['YEAR_PATTERN_IDS', 'MONTH_PATTERNS'],
  './date/locale/en': ['working-2026-08-22', 'YEAR_PATTERN_IDS'],
  './date/locale/ne': ['working-2026-08-22', 'YEAR_PATTERN_IDS'],
};
for (const [subpath, forbidden] of Object.entries(isolated)) {
  const entry = packageJson.exports[subpath];
  const source = await readFile(new URL(`../${entry.import.slice(2)}`, import.meta.url), 'utf8');
  for (const token of forbidden) {
    if (source.includes(token)) throw new Error(`${subpath} retains forbidden token ${token}`);
  }
}

for (const [, entry] of entries) {
  await import(new URL(`../${entry.import.slice(2)}`, import.meta.url));
  const cjsFile = new URL(`../${entry.require.slice(2)}`, import.meta.url);
  await readFile(cjsFile);
}

const packOutput = execFileSync('npm', ['pack', '--ignore-scripts'], {
  encoding: 'utf8',
  cwd: new URL('../', import.meta.url),
});
console.log(packOutput);

console.log(`Verified ${entries.length} ESM+CJS package entries.`);
const tgz = join(new URL('../', import.meta.url).pathname, 'nepali-utils-0.1.0.tgz');
rmSync(tgz, { force: true });
void mkdtempSync;
void tmpdir;
void pathToFileURL;
