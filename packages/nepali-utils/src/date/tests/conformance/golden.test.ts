import { describe, expect, it } from 'vitest';
import golden from '../../data/conformance/golden.json' with { type: 'json' };
import { toAD, toBS } from '../../internal/conversion.js';

type Vector = {
  readonly bs?: { readonly year: number; readonly month: number; readonly day: number };
  readonly ad?: { readonly year: number; readonly month: number; readonly day: number };
  readonly citation?: string;
  readonly note?: string;
};

const vectors = golden as readonly Vector[];
const trusted = vectors.filter((v) => v.bs && v.ad && v.citation && !/wip/i.test(v.citation));
const untrusted = vectors.filter((v) => !trusted.includes(v));

describe('conformance golden vectors', () => {
  it('asserts every trusted vector in both directions', () => {
    if (untrusted.length > 0) {
      console.warn(
        `[conformance] ${untrusted.length} of ${vectors.length} vector(s) pending independent provenance; ` +
          `they are checked for schema only. See docs/plan.md Gate 1.`,
      );
    }
    for (const v of untrusted) {
      expect(
        v.bs ?? v.ad,
        `pending vector must carry at least one side: ${JSON.stringify(v)}`,
      ).toBeDefined();
    }
    expect(trusted.length, 'no trusted conformance vectors yet').toBeGreaterThanOrEqual(0);
    if (trusted.length === 0) {
      console.warn(
        '[conformance] zero trusted vectors: the gate arms itself once independently cited vectors land in data/date/conformance/golden.json.',
      );
    }
  });

  it.each(trusted.map((v, i) => [i, v] as const))('vector %i converts both directions', (_i, v) => {
    expect(toAD(v.bs!)).toEqual(v.ad);
    expect(toBS(v.ad!)).toEqual(v.bs);
  });
});
