import { describe, expect, it } from 'vitest';
import { InvalidWordsError } from '../errors.js';
import {
  amountToNepaliWordsNPR, amountToNepaliWordsNPRMinorUnits,
  numberToEnglishWords, numberToNepaliWords,
} from '../words.js';

describe('words scale boundaries', () => {
  const boundaries: Array<[number, string]> = [
    [999, 'नौ सय उनानसय'],
    [1000, 'एक हजार'],
    [99999, 'उनानसय हजार नौ सय उनानसय'],
    [100000, 'एक लाख'],
    [9999999, 'उनानसय लाख उनानसय हजार नौ सय उनानसय'],
    [10000000, 'एक करोड'],
    [1000000000, 'एक अरब'],
    [100000000000, 'एक खरब'],
  ];
  for (const [n, expected] of boundaries) {
    it(`nepali ${n}`, () => {
      expect(numberToNepaliWords(n)).toBe(expected);
    });
  }

  it('english scale words', () => {
    expect(numberToEnglishWords(1000)).toBe('one thousand');
    expect(numberToEnglishWords(100000)).toBe('one lakh');
    expect(numberToEnglishWords(10000000)).toBe('one crore');
    expect(numberToEnglishWords(1000000000)).toBe('one arab');
    expect(numberToEnglishWords(100000000000)).toBe('one kharab');
  });

  it('every irregular decade representative (historically error-prone spellings)', () => {
    const reps: Array<[number, string]> = [
      [18, 'अठार'], [28, 'अठ्ठाइस'], [38, 'अठतीस'], [48, 'अठचालीस'],
      [58, 'अन्ठाउन्न'], [68, 'अठसठ्ठी'], [78, 'अठहत्तर'], [88, 'अठासी'], [98, 'अन्ठान्नब्बे'],
      [29, 'उनन्तीस'], [39, 'उनन्चालीस'], [49, 'उनन्चास'], [59, 'उनन्साठी'],
      [69, 'उनन्सत्तरी'], [79, 'उनासी'], [89, 'उनान्नब्बे'], [99, 'उनानसय'],
    ];
    for (const [n, expected] of reps) {
      expect(numberToNepaliWords(n)).toBe(expected);
    }
  });

  it("decimal edge: 0.5, and '1.50' spells the trailing zero (documented digit-wise contract)", () => {
    expect(numberToNepaliWords(0.5)).toBe('शून्य दशमलव पाँच');
    expect(numberToNepaliWords('1.50')).toBe('एक दशमलव पाँच शून्य');
  });

  it('bigint input path agrees with number input', () => {
    expect(numberToNepaliWords(123456789012n)).toBe(numberToNepaliWords('123456789012'));
    expect(numberToEnglishWords(987654321n)).toBe(numberToEnglishWords('987654321'));
  });

  it('minor-units zero paisa phrasing', () => {
    expect(amountToNepaliWordsNPRMinorUnits(100n)).toBe('एक रुपैयाँ मात्र');
    expect(amountToNepaliWordsNPRMinorUnits(0n)).toBe('शून्य रुपैयाँ मात्र');
    expect(amountToNepaliWordsNPRMinorUnits(101n)).toBe('एक रुपैयाँ एक पैसा मात्र');
  });

  it('Devanagari-digit string input', () => {
    expect(numberToNepaliWords('१०००')).toBe('एक हजार');
    expect(numberToEnglishWords('१०००')).toBe('one thousand');
  });

  it('out-of-range boundary: 10^12-1 ok, 10^12 throws INVALID_WORDS', () => {
    expect(numberToNepaliWords(999999999999)).toBeTruthy();
    try {
      numberToNepaliWords(1000000000000);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidWordsError);
      expect((error as InvalidWordsError).code).toBe('INVALID_WORDS');
    }
  });
});
