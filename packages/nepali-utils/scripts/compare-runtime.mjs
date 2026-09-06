import { readFile } from 'node:fs/promises';

const [, , baselinePath, candidatePath, thresholdArg = '0.2'] = process.argv;
if (!baselinePath || !candidatePath) {
  console.error('Usage: node scripts/compare-runtime.mjs <baseline.json> <candidate.json> [max-regression]');
  process.exit(2);
}
const threshold = Number(thresholdArg);
if (!Number.isFinite(threshold) || threshold < 0) throw new Error('max-regression must be a non-negative number');
const [baseline, candidate] = await Promise.all([
  readFile(baselinePath, 'utf8').then(JSON.parse),
  readFile(candidatePath, 'utf8').then(JSON.parse),
]);
const current = new Map(candidate.results.map((result) => [result.name, result]));
const regressions = [];
for (const before of baseline.results) {
  const after = current.get(before.name);
  if (!after) throw new Error(`Candidate is missing benchmark ${before.name}`);
  const change = (after.opsPerSecond - before.opsPerSecond) / before.opsPerSecond;
  if (change < -threshold) regressions.push({ name: before.name, change });
  console.log(`${before.name.padEnd(24)} ${(change * 100).toFixed(1).padStart(7)}%`);
}
if (regressions.length > 0) {
  console.error(`Runtime regression exceeded ${(threshold * 100).toFixed(0)}%: ${regressions.map((r) => r.name).join(', ')}`);
  process.exit(1);
}
