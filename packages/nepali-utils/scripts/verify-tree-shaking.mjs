import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const packageRoot = new URL('../', import.meta.url);
const fixtureDirectory = new URL('.tmp/tree-shaking/', packageRoot);
const esbuild = new URL('../node_modules/.bin/esbuild', import.meta.url);
const fixtures = {
  'date-convert':
    "import { bs, toAD } from 'nepali-utils/date/convert'; console.log(toAD(bs(2082, 4, 7)));\n",
  'date-value':
    "import { NepaliDate } from 'nepali-utils/date/value'; console.log(new NepaliDate(2082, 4, 7).toAD());\n",
  'date-arithmetic':
    "import { addDaysBS } from 'nepali-utils/date/arithmetic'; console.log(addDaysBS({ year: 2082, month: 4, day: 7 }, 1));\n",
  'date-parse':
    "import { parseBS } from 'nepali-utils/date/parse'; console.log(parseBS('2082-04-07'));\n",
  'date-range':
    "import { range } from 'nepali-utils/date/range'; console.log(range.bsStart);\n",
  'date-format':
    "import { formatBS } from 'nepali-utils/date/format'; console.log(formatBS({ year: 2082, month: 4, day: 7 }, 'YYYY-MM-DD'));\n",
  'date-format-display':
    "import { formatBSDisplay } from 'nepali-utils/date/format-display'; console.log(formatBSDisplay({ year: 2082, month: 4, day: 7 }, 'YYYY-MM-DD'));\n",
  'number-digits':
    "import { toDevanagari } from 'nepali-utils/number/digits'; console.log(toDevanagari('2082'));\n",
  number:
    "import { formatNumber } from 'nepali-utils/number'; console.log(formatNumber('12345678'));\n",
  currency:
    "import { formatNPR } from 'nepali-utils/currency'; console.log(formatNPR('12345678.9'));\n",
  land: "import { hillArea, formatHillArea } from 'nepali-utils/land'; console.log(formatHillArea(hillArea({ ropani: 1 })));\n",
  words:
    "import { numberToNepaliWords } from 'nepali-utils/words'; console.log(numberToNepaliWords(123456));\n",
  collation:
    "import { createNepaliCollator } from 'nepali-utils/collation'; console.log(createNepaliCollator().sort(['ख', 'क', 'ग']));\n",
  phone:
    "import { parseNepalPhone, formatNepalPhone } from 'nepali-utils/phone'; console.log(formatNepalPhone(parseNepalPhone('+977 981-2345678')));\n",
  admin:
    "import { getPalika, isValidWard } from 'nepali-utils/admin'; console.log(getPalika('10106'), isValidWard('10106', 5));\n",
  'admin-provinces':
    "import { getProvince } from 'nepali-utils/admin/provinces'; console.log(getProvince('1'));\n",
  'admin-districts':
    "import { getDistrict } from 'nepali-utils/admin/districts'; console.log(getDistrict('101'));\n",
  'admin-palikas':
    "import { getPalika } from 'nepali-utils/admin/palikas'; console.log(getPalika('10106'));\n",
  'date-locale-en':
    "import { monthName } from 'nepali-utils/date/locale/en'; console.log(monthName(4));\n",
  'date-locale-ne':
    "import { monthName } from 'nepali-utils/date/locale/ne'; console.log(monthName(4));\n",
  'date-adapter-date':
    "import { dateToAD } from 'nepali-utils/date/adapters/date'; console.log(dateToAD(new Date(Date.UTC(2025, 7, 6))));\n",
  'date-adapter-timezone':
    "import * as tz from 'nepali-utils/date/adapters/timezone'; console.log(Object.keys(tz));\n",
  'date-fiscal':
    "import { getFiscalYear } from 'nepali-utils/date/fiscal'; console.log(getFiscalYear({ year: 2082, month: 4, day: 7 }));\n",
  'date-relative':
    "import { relativePhrase } from 'nepali-utils/date/relative'; console.log(relativePhrase(1));\n",
  root: "import 'nepali-utils'; console.log('root loaded');\n",
};

// Fixtures that must not pull conversion data tables into the bundle.
const leanFixtures = new Set([
  'date-format',
  'date-format-display',
  'number-digits',
  'number',
  'currency',
  'land',
  'date-locale-en',
  'date-locale-ne',
  'admin-provinces',
  'admin-districts',
]);

const budgets = {
  'date-convert': 2560,
  'date-value': 3.5 * 1024,
  'date-arithmetic': 3 * 1024,
  'date-parse': 2816,
  'date-range': 512,
  'date-format': 1536,
  'date-format-display': 2048,
  'number-digits': 512,
  number: 1536,
  currency: 2048,
  land: 2048,
  words: 4096,
  collation: 3072,
  phone: 2048,
  admin: 24 * 1024,
  'date-locale-en': 1024,
  'date-locale-ne': 1024,
  'admin-provinces': 1024,
  'admin-districts': 4096,
  'admin-palikas': 24 * 1024,
  'date-adapter-date': 2048,
  'date-adapter-timezone': 2048,
  'date-fiscal': 1536,
  'date-relative': 2560,
  root: 7 * 1024,
};

await mkdir(fixtureDirectory, { recursive: true });
try {
  const sizes = new Map();
  for (const [name, source] of Object.entries(fixtures)) {
    const input = new URL(`${name}.ts`, fixtureDirectory);
    const output = new URL(`${name}.js`, fixtureDirectory);
    await writeFile(input, source);
    const distDir = new URL('../dist/', import.meta.url).pathname;
    execFileSync(
      esbuild.pathname,
      [
        input.pathname,
        '--bundle',
        '--format=esm',
        '--minify',
        `--alias:nepali-utils=${distDir}`,
        `--outfile=${output.pathname}`,
      ],
      { cwd: packageRoot.pathname, stdio: 'ignore' },
    );
    const bundled = await readFile(output);
    sizes.set(name, { raw: bundled.byteLength, gzip: gzipSync(bundled).byteLength });
    if (leanFixtures.has(name)) {
      const text = bundled.toString('utf8');
      if (
        text.includes('33238') ||
        text.includes('working-2026-08-22') ||
        text.includes('Phaktanlung')
      ) {
        throw new Error(`${name} consumer retained conversion data`);
      }
    }
  }

  for (const [name, budget] of Object.entries(budgets)) {
    if (sizes.get(name).gzip > budget) {
      throw new Error(`${name} consumer is ${sizes.get(name).gzip} gzip bytes; budget is ${budget}`);
    }
  }

  for (const [name, size] of sizes) {
    console.log(`${name.padEnd(22)} ${size.raw} raw / ${size.gzip} gzip`);
  }
  console.log('Tree-shaking checks passed.');
} finally {
  await rm(fixtureDirectory, { recursive: true, force: true });
}
