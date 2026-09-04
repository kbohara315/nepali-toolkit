import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import source from '../data/generated/patro.json' with { type: 'json' };
import { metadata } from '../internal/data.js';
import { MONTH_PATTERNS, YEAR_PATTERN_IDS, YEAR_PREFIX } from '../internal/generated-data.js';

describe('generated Patro runtime data', () => {
  it('reconstructs every source year exactly', () => {
    expect(YEAR_PATTERN_IDS).toHaveLength(source.table.length);
    expect(YEAR_PREFIX).toEqual(source.prefix);
    for (const [index, row] of source.table.entries()) {
      expect(MONTH_PATTERNS[YEAR_PATTERN_IDS[index]]).toEqual(row.months);
    }
  });

  it('checksums the source table and preserves metadata', () => {
    const checksum = createHash('sha256')
      .update(JSON.stringify(source.table))
      .digest('hex')
      .slice(0, 16);
    expect(checksum).toBe(source.checksum);
    expect(metadata.checksum).toBe(checksum);
    expect(metadata.totalDays).toBe(source.prefix.at(-1));
    expect(metadata.adStart).toEqual({ year: 1943, month: 4, day: 14 });
    expect(metadata.adEnd).toEqual({ year: 2034, month: 4, day: 13 });
  });

  it('keeps the generated source deterministic', () => {
    const generated = readFileSync(new URL('../internal/generated-data.ts', import.meta.url), 'utf8');
    expect(generated).toContain('MONTH_PATTERNS');
    expect(generated).toContain('YEAR_PATTERN_IDS');
    expect(generated).toContain('YEAR_PREFIX');
  });
});
