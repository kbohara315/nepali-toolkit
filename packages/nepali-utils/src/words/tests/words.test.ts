import { describe, expect, it } from 'vitest';
import { InvalidWordsError } from '../errors.js';
import { NEPALI_ONES_0_99 } from '../tables.js';
import {
  amountToNepaliWordsNPR,
  amountToNepaliWordsNPRMinorUnits,
  numberWordsInText,
  numberToEnglishWords,
  numberToNepaliWords,
  parseNepaliWords,
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

describe('reverse Nepali words', () => {
  it('parses scale phrases exactly', () => {
    expect(parseNepaliWords('एक लाख तेइस हजार चार सय छपन्न')).toBe(123456n);
    expect(parseNepaliWords('एक खरब')).toBe(100000000000n);
    expect(parseNepaliWords('नौ सय उनानसय')).toBe(999n);
  });

  it('accepts generated negative words and currency suffixes', () => {
    expect(parseNepaliWords('शून्य')).toBe(0n);
    expect(parseNepaliWords('माइनस शून्य')).toBe(0n);
    expect(parseNepaliWords('माइनस पाँच')).toBe(-5n);
    expect(parseNepaliWords('ऋणात्मक एक सय')).toBe(-100n);
    expect(parseNepaliWords('एक सय रुपैयाँ मात्र')).toBe(100n);
  });

  it('rejects malformed word grammar and unknown words', () => {
    for (const input of ['', 'एक दुई', 'सय', 'एक xyz', 'एक दशमलव पाँच']) {
      expect(() => parseNepaliWords(input)).toThrow(InvalidWordsError);
    }
  });

  it('rejects values at or above the supported range', () => {
    expect(() => parseNepaliWords('नौ खरब नौ सय उनानसय')).not.toThrow();
    expect(() => parseNepaliWords('दश खरब')).toThrow(InvalidWordsError);
  });
});

describe('number words in text', () => {
  it('replaces standalone ASCII and Devanagari numbers', () => {
    expect(numberWordsInText('Pay 4750 now')).toBe('Pay चार हजार सात सय पचास now');
    expect(numberWordsInText('Fee २५ and tax 1,234')).toBe('Fee पच्चीस and tax एक हजार दुई सय चौंतीस');
  });

  it('does not replace numbers embedded in words', () => {
    expect(numberWordsInText('abc123 x९९ test')).toBe('abc123 x९९ test');
  });

  it('preserves unsupported numeric spans', () => {
    expect(numberWordsInText('Year 1000000000000 and value 1.1234567')).toBe(
      'Year 1000000000000 and value 1.1234567',
    );
  });
});

describe('Nepali NPR word options', () => {
  it('supports hiding paisa, removing only, and joining paisa with ra', () => {
    expect(amountToNepaliWordsNPR('4750.50', { showPaisa: false })).toBe('चार हजार सात सय पचास रुपैयाँ मात्र');
    expect(amountToNepaliWordsNPR('4750.50', { appendOnly: false, paisaSeparator: 'and' })).toBe(
      'चार हजार सात सय पचास रुपैयाँ र पचास पैसा',
    );
  });

  it('supports custom zero text and cheque spacing', () => {
    expect(amountToNepaliWordsNPR(0, { zeroRupeeText: 'NIL' })).toBe('NIL रुपैयाँ मात्र');
    expect(amountToNepaliWordsNPR(4750, { chequeStyle: true })).toBe('चार  हजार  सात  सय  पचास  रुपैयाँ  मात्र');
    expect(amountToNepaliWordsNPRMinorUnits(475050n, { appendOnly: false, showPaisa: false })).toBe(
      'चार हजार सात सय पचास रुपैयाँ',
    );
  });

  it('rejects invalid word options', () => {
    expect(() => amountToNepaliWordsNPR(10, { paisaSeparator: 'invalid' as 'space' })).toThrow(InvalidWordsError);
    expect(() => amountToNepaliWordsNPR(10, { zeroRupeeText: '' })).toThrow(InvalidWordsError);
  });
});
