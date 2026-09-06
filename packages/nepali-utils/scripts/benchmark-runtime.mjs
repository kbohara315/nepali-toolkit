import { performance } from 'node:perf_hooks';
import { ad, bs, toAD, toBS } from '../dist/date/convert.js';
import { addDaysBS } from '../dist/date/arithmetic.js';
import { formatBS } from '../dist/date/format.js';
import { formatBSDisplay } from '../dist/date/format-display.js';
import { parseBS } from '../dist/date/parse.js';
import { getFiscalYear } from '../dist/date/fiscal.js';
import { relativePhrase } from '../dist/date/relative.js';
import { monthName } from '../dist/date/locale/en.js';
import { dateToAD } from '../dist/date/adapters/date.js';
import { toDevanagari } from '../dist/number/digits.js';
import { formatNumber } from '../dist/number/index.js';
import { formatNPR } from '../dist/currency/index.js';
import { hillArea, formatHillArea } from '../dist/land/index.js';
import { numberToNepaliWords } from '../dist/words/index.js';
import { parseNepalPhone, formatNepalPhone } from '../dist/phone/index.js';
import { createNepaliCollator } from '../dist/collation/index.js';
import { getProvince } from '../dist/admin/provinces.js';
import { getDistrict } from '../dist/admin/districts.js';
import { getPalika, findPalikasByName } from '../dist/admin/palikas.js';

const date = bs(2082, 4, 7);
const adDate = ad(2025, 8, 6);
const phone = parseNepalPhone('+977 981-2345678');
const area = hillArea({ ropani: 1, aana: 2 });
const collator = createNepaliCollator({ backend: 'basic' });
const words = ['ख', 'क', 'ग', 'ज्ञ', 'नेपाल', 'काठमाडौं'];
const jsonOutput = process.argv.includes('--json');
const results = [];

function benchmark(name, fn, iterations = 10_000) {
  for (let i = 0; i < 1_000; i++) fn();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;
  const ops = (iterations / elapsed) * 1_000;
  const result = { name, iterations, elapsedMs: Number(elapsed.toFixed(2)), opsPerSecond: Math.round(ops) };
  results.push(result);
  if (!jsonOutput) console.log(`${name.padEnd(24)} ${result.elapsedMs.toFixed(2).padStart(9)} ms  ${result.opsPerSecond.toString().padStart(10)} ops/s`);
}

if (!jsonOutput) {
  console.log('nepali-utils runtime smoke benchmark (warm process)');
  console.log('operation'.padEnd(24) + ' elapsed'.padStart(13) + ' throughput'.padStart(14));
}
benchmark('date.toAD', () => toAD(date));
benchmark('date.toBS', () => toBS(adDate));
benchmark('date.addDaysBS', () => addDaysBS(date, 1));
benchmark('date.formatBS', () => formatBS(date, 'YYYY-MM-DD'));
benchmark('date.formatBSDisplay', () => formatBSDisplay(date, 'YYYY MMMM DD'));
benchmark('date.parseBS', () => parseBS('2082-04-07'));
benchmark('date.fiscal', () => getFiscalYear(date));
benchmark('date.relative', () => relativePhrase(1));
benchmark('date.locale', () => monthName(4));
benchmark('date.adapter', () => dateToAD(new Date(Date.UTC(2025, 7, 6))));
benchmark('number.toDevanagari', () => toDevanagari('2082-04-07'));
benchmark('number.formatNumber', () => formatNumber('12345678.9'));
benchmark('currency.formatNPR', () => formatNPR('12345678.9'));
benchmark('land.formatHillArea', () => formatHillArea(area));
benchmark('words.numberToWords', () => numberToNepaliWords(123456));
benchmark('phone.parse+format', () => formatNepalPhone(phone));
benchmark('collation.sort', () => collator.sort(words));
benchmark('admin.getProvince', () => getProvince('1'));
benchmark('admin.getDistrict', () => getDistrict('101'));
benchmark('admin.getPalika', () => getPalika('10106'));
benchmark('admin.findPalikas', () => findPalikasByName('नगर', { script: 'ne' }), 1_000);

if (jsonOutput) {
  console.log(JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    node: process.version,
    results,
  }, null, 2));
}
