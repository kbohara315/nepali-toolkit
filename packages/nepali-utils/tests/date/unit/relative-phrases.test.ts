import { describe, expect, it } from 'vitest';
import {
  englishRelativeLocale,
  formatRelativeDays,
  nepaliRelativeLocale,
  relativePhrase,
} from '../../../src/date/relative.js';
import { bs } from '../../../src/date/types.js';

describe('relative phrases', () => {
  it('covers thresholds in English', () => {
    const cases: Array<[number, string]> = [
      [-3, '3 days ago'],
      [-2, '2 days ago'],
      [-1, 'yesterday'],
      [0, 'today'],
      [1, 'tomorrow'],
      [2, 'in 2 days'],
      [3, 'in 3 days'],
    ];
    for (const [delta, expected] of cases) {
      expect(formatRelativeDays(delta, englishRelativeLocale)).toBe(expected);
    }
    expect(formatRelativeDays(-1)).toBe('yesterday'); // default locale is English
    expect(formatRelativeDays(1, englishRelativeLocale)).toBe('tomorrow');
  });

  it('covers thresholds in Nepali', () => {
    const cases: Array<[number, string]> = [
      [-2, '२ दिन अघि'],
      [-1, 'हिजो'],
      [0, 'आज'],
      [1, 'भोलि'],
      [2, '२ दिनमा'],
    ];
    for (const [delta, expected] of cases) {
      expect(formatRelativeDays(delta, nepaliRelativeLocale)).toBe(expected);
    }
  });

  it('derives phrases from fixed date pairs without the system clock', () => {
    const ref = bs(2082, 5, 10);
    expect(relativePhrase(bs(2082, 5, 10), ref)).toBe('today');
    expect(relativePhrase(bs(2082, 5, 9), ref)).toBe('yesterday');
    expect(relativePhrase(bs(2082, 5, 11), ref)).toBe('tomorrow');
    expect(relativePhrase(bs(2082, 5, 8), ref)).toBe('2 days ago');
    expect(relativePhrase(bs(2082, 5, 12), ref)).toBe('in 2 days');
    expect(relativePhrase(bs(2082, 5, 9), ref, nepaliRelativeLocale)).toBe('हिजो');
    expect(relativePhrase(bs(2082, 5, 12), ref, nepaliRelativeLocale)).toBe('२ दिनमा');
  });

  it('rejects non-integer deltas and missing reference dates', () => {
    expect(() => formatRelativeDays(1.5)).toThrow(TypeError);
    expect(() => relativePhrase(bs(2082, 5, 10), undefined as never)).toThrow(TypeError);
  });
});
