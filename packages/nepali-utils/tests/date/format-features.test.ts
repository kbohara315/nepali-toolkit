import { describe, expect, it } from 'vitest';
import { formatAD, formatBS } from '../../src/date/format.js';

describe('format grammar', () => {
  it('supports every token and escaped literals', () => {
    expect(formatBS({ year: 2082, month: 4, day: 7 }, 'YY/M-MM/D-DD')).toBe('82/4-04/7-07');
    expect(formatBS({ year: 2082, month: 4, day: 7 }, '[YYYY] YYYY [D] DD')).toBe('YYYY 2082 D 07');
    expect(formatBS({ year: 2082, month: 4, day: 7 }, "'date:' YYYY")).toBe('date: 2082');
  });

  it('does not silently accept unknown alphabetic tokens', () => {
    expect(() => formatBS({ year: 2082, month: 4, day: 7 }, 'YYYY-Q')).toThrow(SyntaxError);
  });

  it('formats extended proleptic AD years canonically', () => {
    expect(formatAD({ year: -1, month: 1, day: 1 }, 'YYYY-MM-DD')).toBe('-0001-01-01');
    expect(formatAD({ year: 10000, month: 1, day: 1 }, 'YYYY-MM-DD')).toBe('10000-01-01');
  });
});
