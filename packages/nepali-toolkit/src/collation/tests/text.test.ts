import { describe, expect, it } from 'vitest';
import {
  containsDevanagari,
  countDevanagariChars,
  countNepaliWords,
  createNepaliCollator,
  getNepaliTextStats,
  isDevanagariOnly,
  normalizeNepaliText,
} from '../index.js';
import { InvalidCollationError } from '../errors.js';

describe('collation text primitives', () => {
  it('normalize is NFC + i-fix + control strip, idempotent', () => {
    expect(normalizeNepaliText('िक')).toBe('कि');
    expect(normalizeNepaliText('क‌')).toBe('क');
    expect(normalizeNepaliText('क‍ष')).toBe('कष');
    const n = normalizeNepaliText('राम घर गयो।');
    expect(normalizeNepaliText(n)).toBe(n);
  });

  it('normalize parity: collator sees normalized and raw identically', () => {
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.equals('िक', normalizeNepaliText('िक'))).toBe(true);
    expect(c.equals('क‌', 'क')).toBe(true);
  });

  it('contains/is Devanagari detection', () => {
    expect(containsDevanagari('राम went home')).toBe(true);
    expect(containsDevanagari('hello')).toBe(false);
    expect(isDevanagariOnly('राम')).toBe(true);
    expect(isDevanagariOnly('राम घर')).toBe(false); // space breaks strict check
    expect(isDevanagariOnly('')).toBe(false);
    expect(isDevanagariOnly('hello')).toBe(false);
  });

  it('countDevanagariChars counts code points', () => {
    expect(countDevanagariChars('राम')).toBe(3);
    expect(countDevanagariChars('राम abc')).toBe(3);
    expect(countDevanagariChars('abc')).toBe(0);
  });

  it('word count is Nepali-aware (danda trimmed, controls ignored)', () => {
    expect(countNepaliWords('राम घर गयो।')).toBe(3);
    expect(countNepaliWords('  कमल,  कमला!  ')).toBe(2);
    expect(countNepaliWords('')).toBe(0);
    expect(countNepaliWords('   ')).toBe(0);
    expect(countNepaliWords('।')).toBe(0);
    expect(countNepaliWords('क‌ घर')).toBe(2);
  });

  it('stats: words, characters, sentences, paragraphs', () => {
    expect(getNepaliTextStats('राम घर गयो। सीता आयो।')).toEqual({
      words: 5,
      characters: 21,
      charactersNoSpaces: 17,
      sentences: 2,
      paragraphs: 1,
    });
    expect(getNepaliTextStats('')).toEqual({
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
    });
    expect(getNepaliTextStats('पहिलो\n\nदोस्रो')).toMatchObject({
      words: 2,
      sentences: 1,
      paragraphs: 2,
    });
  });

  it('non-string inputs throw InvalidCollationError', () => {
    // @ts-expect-error testing
    expect(() => normalizeNepaliText(1)).toThrow(InvalidCollationError);
    // @ts-expect-error testing
    expect(() => containsDevanagari(null)).toThrow(InvalidCollationError);
    // @ts-expect-error testing
    expect(() => countNepaliWords(undefined)).toThrow(InvalidCollationError);
  });
});
