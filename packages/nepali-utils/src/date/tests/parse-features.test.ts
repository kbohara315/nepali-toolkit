import { describe, expect, it } from 'vitest';
import { ParseError } from '../errors.js';
import { parseAD, parseBS } from '../parse.js';

describe('strict parsing', () => {
  it('requires full canonical input and an explicit separator', () => {
    expect(parseBS('2082-04-07')).toEqual({ year: 2082, month: 4, day: 7 });
    expect(parseBS('2082/04/07', { separator: '/' })).toEqual({ year: 2082, month: 4, day: 7 });
    expect(() => parseBS('2082/04/07')).toThrow(ParseError);
    expect(() => parseAD('2025-07-23x')).toThrow(ParseError);
    expect(() => parseAD('2025-07-23\n')).toThrow(ParseError);
  });

  it('supports escaped pattern text and optional Devanagari digits', () => {
    expect(parseBS('BS 2082/04/07', '[BS] YYYY/MM/DD')).toEqual({ year: 2082, month: 4, day: 7 });
    expect(parseBS('२०८२-०४-०७', { allowDevanagari: true })).toEqual({
      year: 2082,
      month: 4,
      day: 7,
    });
  });

  it('rejects duplicate fields and invalid dates distinctly from syntax', () => {
    expect(() => parseBS('2082-04-07-04', 'YYYY-MM-DD-MM')).toThrow(ParseError);
    expect(() => parseBS('2082-13-01')).toThrow(/month/i);
  });

  it('round-trips extended proleptic AD years', () => {
    expect(parseAD('-0001-01-01')).toEqual({ year: -1, month: 1, day: 1 });
    expect(parseAD('10000-01-01')).toEqual({ year: 10000, month: 1, day: 1 });
  });
});
