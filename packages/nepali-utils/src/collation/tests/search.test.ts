import { describe, expect, it } from 'vitest';
import {
  isIgnorablePunctuation,
  nepaliIncludes,
  nepaliStartsWith,
  stripIgnorablePunctuation,
} from '../index.js';
import { InvalidCollationError } from '../errors.js';

describe('collation search helpers', () => {
  it('denormalized needle matches normalized haystack', () => {
    expect(nepaliIncludes('किरण', 'िक')).toBe(true);
    expect(nepaliStartsWith('किरण', 'िक')).toBe(true);
    expect(nepaliStartsWith('किरण', 'रण')).toBe(false);
    expect(nepaliIncludes('किरण', 'रण')).toBe(true);
  });

  it('case-insensitive by default, strict on opt-out', () => {
    expect(nepaliIncludes('Apple', 'apple')).toBe(true);
    expect(nepaliStartsWith('Apple', 'APP')).toBe(true);
    expect(nepaliIncludes('Apple', 'apple', { caseInsensitive: false })).toBe(false);
    expect(nepaliStartsWith('Apple', 'APP', { caseInsensitive: false })).toBe(false);
  });

  it('ignorePunctuation strips before matching', () => {
    expect(nepaliIncludes('क-क', 'कक')).toBe(false);
    expect(nepaliIncludes('क-क', 'कक', { ignorePunctuation: true })).toBe(true);
    expect(nepaliStartsWith('घर।', 'घर')).toBe(true); // substring anyway
    expect(nepaliIncludes('घर', 'घर।', { ignorePunctuation: true })).toBe(true);
    expect(nepaliIncludes('घर', 'घर।')).toBe(false);
  });

  it('empty needle matches everything', () => {
    expect(nepaliIncludes('क', '')).toBe(true);
    expect(nepaliStartsWith('', '')).toBe(true);
  });

  it('predicate and strip cover the documented set', () => {
    for (const ch of [' ', '-', '.', ',', '।', '॥', '!', '?', '—', "'", '"', '(', ')']) {
      expect(isIgnorablePunctuation(ch)).toBe(true);
    }
    for (const ch of ['क', 'a', '१', 'ं']) {
      expect(isIgnorablePunctuation(ch)).toBe(false);
    }
    expect(isIgnorablePunctuation('कक')).toBe(false);
    expect(stripIgnorablePunctuation('क-क घर।')).toBe('ककघर');
  });

  it('non-string inputs throw InvalidCollationError', () => {
    // @ts-expect-error testing
    expect(() => nepaliIncludes(1, 'क')).toThrow(InvalidCollationError);
    // @ts-expect-error testing
    expect(() => nepaliStartsWith('क', null)).toThrow(InvalidCollationError);
    // @ts-expect-error testing
    expect(() => stripIgnorablePunctuation(undefined)).toThrow(InvalidCollationError);
  });
});
