import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import source from '../../data/generated/patro.json' with { type: 'json' };
import { metadata } from '../../internal/data.js';
import { MONTH_PATTERNS, YEAR_PATTERN_IDS, YEAR_PREFIX } from '../../internal/generated-data.js';

const checksumOf = (table: unknown) =>
  createHash('sha256').update(JSON.stringify(table)).digest('hex').slice(0, 16);

function validate(table: { months: number[] }[], prefix: number[]): string | null {
  if (prefix[0] !== 0) return 'prefix must start at zero';
  for (const [i, row] of table.entries()) {
    if (row.months.length !== 12) return `year index ${i} month count`;
    if (row.months.some((d) => !Number.isInteger(d) || d < 29 || d > 32))
      return `year index ${i} month length`;
    const expected = prefix[i] + row.months.reduce((s, d) => s + d, 0);
    if (expected !== prefix[i + 1]) return `prefix mismatch at ${i}`;
  }
  return null;
}

describe('data mutation detection', () => {
  it('detects a single-day month mutation via checksum + prefix', () => {
    const mutated = structuredClone(source.table);
    mutated[0].months[0] += 1;
    expect(checksumOf(mutated)).not.toBe(source.checksum);
    expect(checksumOf(mutated)).not.toBe(metadata.checksum);
    expect(validate(mutated, source.prefix)).not.toBeNull();
  });

  it('detects a prefix tamper', () => {
    const mutatedPrefix = [...source.prefix];
    mutatedPrefix[1] += 1;
    expect(validate(structuredClone(source.table), mutatedPrefix)).not.toBeNull();
  });

  it('detects a pattern/prefix inconsistency in generated runtime tables', () => {
    const ids = [...YEAR_PATTERN_IDS];
    ids[0] = (ids[0] + 1) % MONTH_PATTERNS.length;
    const row = source.table[0].months;
    expect(MONTH_PATTERNS[ids[0]]).not.toEqual(row);
    expect(YEAR_PREFIX).toEqual(source.prefix);
  });

  it('clean data validates', () => {
    expect(validate(structuredClone(source.table), [...source.prefix])).toBeNull();
    expect(checksumOf(source.table)).toBe(source.checksum);
  });
});
