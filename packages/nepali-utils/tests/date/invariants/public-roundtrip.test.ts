import { describe, expect, it } from 'vitest';
import { NepaliDate, ad, bs, range, toAD, toBS } from '../../../src/date/index.js';

describe('public round-trip invariants', () => {
  it('every BS->AD->BS round-trips via public APIs', () => {
    const start = NepaliDate.fromBS(bs(range.bsStart.year, range.bsStart.month, range.bsStart.day));
    for (let i = 0; i < range.totalDays; i++) {
      const m = start.addDays(i);
      const b = m.toBS();
      expect(toBS(toAD(b))).toEqual(b);
      expect(NepaliDate.fromBS(b).toBS()).toEqual(b);
    }
  }, 60000);

  it('every AD->BS->AD round-trips via public APIs', () => {
    const start = NepaliDate.fromAD(ad(range.adStart.year, range.adStart.month, range.adStart.day));
    for (let i = 0; i < range.totalDays; i++) {
      const m = start.addDays(i);
      const a = m.toAD();
      expect(toAD(toBS(a))).toEqual(a);
      expect(NepaliDate.fromAD(a).toAD()).toEqual(a);
    }
  }, 60000);

  it('adjacent days differ by one via public APIs', () => {
    const start = NepaliDate.fromBS(bs(range.bsStart.year, range.bsStart.month, range.bsStart.day));
    let prev = start;
    for (let i = 1; i < range.totalDays; i++) {
      const cur = start.addDays(i);
      expect(cur.differenceInDays(prev)).toBe(1);
      expect(prev.differenceInDays(cur)).toBe(-1);
      expect(cur.toAD()).toEqual(toAD(cur.toBS()));
      expect(cur.toBS()).toEqual(toBS(cur.toAD()));
      prev = cur;
    }
  }, 60000);
});
