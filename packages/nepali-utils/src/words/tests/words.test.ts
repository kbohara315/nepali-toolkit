import { describe, expect, it } from 'vitest';
import { InvalidWordsError } from '../errors.js';
import { NEPALI_ONES_0_99 } from '../tables.js';
import {
  amountToNepaliWordsNPR,
  amountToNepaliWordsNPRMinorUnits,
  numberToEnglishWords,
  numberToNepaliWords,
} from '../words.js';

describe('words corpus', () => {
  it('nepali examples', () => {
    expect(numberToNepaliWords(123456)).toBe('एक लाख तेइस हजार चार सय छपन्न');
    expect(numberToNepaliWords(100)).toBe('एक सय');
    expect(numberToNepaliWords(101)).toBe('एक सय एक');
    expect(numberToNepaliWords(1000)).toBe('एक हजार');
    expect(numberToNepaliWords(100000)).toBe('एक लाख');
    expect(numberToNepaliWords(10000000)).toBe('एक करोड');
    expect(numberToNepaliWords(0)).toBe('शून्य');
    expect(numberToNepaliWords(1.5)).toBe('एक दशमलव पाँच');
    expect(numberToNepaliWords(-5)).toBe('माइनस पाँच');
    expect(numberToNepaliWords('१२३')).toBe('एक सय तेइस');
    expect(numberToNepaliWords(123456n)).toBe('एक लाख तेइस हजार चार सय छपन्न');
    expect(numberToNepaliWords(999999999999)).toBeTruthy();
  });
  it('english examples', () => {
    expect(numberToEnglishWords(123456)).toBe('one lakh twenty three thousand four hundred fifty six');
    expect(numberToEnglishWords(0)).toBe('zero');
    expect(numberToEnglishWords(-5)).toBe('minus five');
    expect(numberToEnglishWords(1.5)).toBe('one point five');
  });
  it('NPR examples', () => {
    expect(amountToNepaliWordsNPR('123.45')).toBe('एक सय तेइस रुपैयाँ पैंतालीस पैसा मात्र');
    expect(amountToNepaliWordsNPR(0)).toBe('शून्य रुपैयाँ मात्र');
    expect(amountToNepaliWordsNPRMinorUnits(12345n)).toBe('एक सय तेइस रुपैयाँ पैंतालीस पैसा मात्र');
    expect(amountToNepaliWordsNPRMinorUnits(100n)).toBe('एक रुपैयाँ मात्र');
  });
  it('rejections', () => {
    expect(() => numberToNepaliWords(1000000000000)).toThrow(InvalidWordsError);
    expect(() => numberToNepaliWords('1.1234567')).toThrow(InvalidWordsError);
    expect(() => amountToNepaliWordsNPR('1.234')).toThrow(InvalidWordsError);
    expect(() => numberToNepaliWords('abc')).toThrow(InvalidWordsError);
    for (const fn of [() => numberToNepaliWords(1000000000000), () => numberToNepaliWords('abc')]) {
      try {
        fn();
        expect.unreachable();
      } catch (e) {
        expect((e as InvalidWordsError).code).toBe('INVALID_WORDS');
        expect(e).toBeInstanceOf(TypeError);
      }
    }
  });
  it('table has 100 Devanagari entries', () => {
    expect(NEPALI_ONES_0_99).toHaveLength(100);
    for (const w of NEPALI_ONES_0_99) {
      expect(w).toMatch(/^[\u0900-\u097F]+$/);
    }
  });
});
