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
import {
  amountToNepaliWordsNPR,
  numberToNepaliWords,
  numberWordsInText,
  parseNepaliWords,
} from '../dist/words/index.js';
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
const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--') && arg.includes('='))
    .map((arg) => {
      const [key, ...value] = arg.slice(2).split('=');
      return [key, value.join('=')];
    }),
);
const results = [];
const DEFAULT_ITERATIONS = 100_000;
const DEFAULT_SAMPLES = 9;
const DEFAULT_WARMUP = 20_000;
const DEFAULT_MIN_SAMPLE_MS = 50;
const only = args.get('only');

function positiveInteger(name, fallback) {
  const value = Number(args.get(name) ?? fallback);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`--${name} must be a positive integer`);
  return value;
}

const samples = positiveInteger('samples', DEFAULT_SAMPLES);
const warmup = positiveInteger('warmup', DEFAULT_WARMUP);
const minSampleMs = positiveInteger('min-ms', DEFAULT_MIN_SAMPLE_MS);

function runIterations(fn, iterations) {
  const start = performance.now();
  let lastResult;
  for (let i = 0; i < iterations; i++) lastResult = fn();
  const elapsed = performance.now() - start;
  globalThis.__nepaliBenchmarkSink = lastResult;
  return elapsed;
}

function benchmark(name, fn, iterations = DEFAULT_ITERATIONS) {
  if (only && only !== name) return;
  for (let i = 0; i < warmup; i++) fn();
  const calibrationElapsed = runIterations(fn, iterations);
  if (calibrationElapsed < minSampleMs) {
    iterations = Math.ceil(iterations * minSampleMs / Math.max(calibrationElapsed, 0.1));
  }
  const throughputs = [];
  for (let sample = 0; sample < samples; sample++) {
    const elapsed = runIterations(fn, iterations);
    throughputs.push((iterations / elapsed) * 1_000);
  }
  throughputs.sort((a, b) => a - b);
  const median = throughputs[Math.floor(throughputs.length / 2)];
  const p10 = throughputs[Math.floor((throughputs.length - 1) * 0.1)];
  const p90 = throughputs[Math.ceil((throughputs.length - 1) * 0.9)];
  const result = {
    name,
    iterations,
    samples,
    warmupIterations: warmup,
    minSampleMs,
    elapsedMs: Number((1_000 / median * iterations).toFixed(2)),
    opsPerSecond: Math.round(median),
    p10OpsPerSecond: Math.round(p10),
    p90OpsPerSecond: Math.round(p90),
    spreadPercent: Number(((p90 - p10) / median * 100).toFixed(1)),
  };
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
benchmark('words.parseNepaliWords', () => parseNepaliWords('एक लाख तेइस हजार चार सय छपन्न'));
benchmark('words.numberWordsInText', () => numberWordsInText('Pay 4750 now'));
benchmark('words.amountToNepaliWordsNPR', () => amountToNepaliWordsNPR('123456.50'));
benchmark('phone.parse+format', () => formatNepalPhone(phone));
benchmark('collation.sort', () => collator.sort(words));
benchmark('admin.getProvince', () => getProvince('1'));
benchmark('admin.getDistrict', () => getDistrict('101'));
benchmark('admin.getPalika', () => getPalika('10106'));
benchmark('admin.findPalikas', () => findPalikasByName('नगर', { script: 'ne' }), 10_000);

if (only && results.length === 0) throw new Error(`Unknown benchmark: ${only}`);
delete globalThis.__nepaliBenchmarkSink;

if (jsonOutput) {
  console.log(JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    node: process.version,
    results,
  }, null, 2));
}
