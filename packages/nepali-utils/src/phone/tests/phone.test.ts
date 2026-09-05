import { describe, expect, it } from 'vitest';
import { InvalidPhoneError } from '../errors.js';
import {
  formatNepalPhone,
  getNepalPhoneType,
  isAllocatedNepalPhone,
  isPossibleNepalPhone,
  isSameNepalPhone,
  isValidNepalPhone,
  metadataRevision,
  parseNepalPhone,
} from '../index.js';

describe('normalization matrix', () => {
  const cases: Array<[string, string]> = [
    ['981-2345678', '9812345678'],
    ['981 234 5678', '9812345678'],
    ['(981) 234-5678', '9812345678'],
    ['981.234.5678', '9812345678'],
    ['+977 981-2345678', '9812345678'],
    ['+977-9812345678', '9812345678'],
    ['9779812345678', '9812345678'],
    ['00977-9812345678', '9812345678'],
    ['009779812345678', '9812345678'],
    ['+977 01-4412345', '014412345'],
    ['९८१-२३४५६७८', '9812345678'],
    ['+९७७ ९८१२३४५६७८', '9812345678'],
    ['०१-४४१२३४५', '014412345'],
  ];
  for (const [input, expected] of cases) {
    it(`normalizes ${JSON.stringify(input)}`, () => {
      expect(parseNepalPhone(input).national).toBe(expected);
    });
  }

  it('keeps a 10-digit 977-led bare mobile intact', () => {
    expect(parseNepalPhone('9771234567').national).toBe('9771234567');
  });
});

describe('mobile families', () => {
  const allocated: Array<[string, string]> = [
    ['9841234567', 'NTC'],
    ['9851234567', 'NTC'],
    ['9861234567', 'NTC'],
    ['9741234567', 'NTC'],
    ['9751234567', 'NTC'],
    ['9761234567', 'NTC'],
    ['9801234567', 'Ncell'],
    ['9812345678', 'Ncell'],
    ['9821234567', 'Ncell'],
    ['9611234567', 'SmartCell'],
    ['9621234567', 'SmartCell'],
    ['9881234567', 'SmartCell'],
    ['9721234567', 'UTL'],
    ['9631234567', 'HelloMobile'],
  ];
  for (const [input, operator] of allocated) {
    it(`${input} → ${operator}`, () => {
      const phone = parseNepalPhone(input);
      expect(phone.kind).toBe('mobile');
      expect(phone.operator).toBe(operator);
      expect(phone.areaOrPrefix).toBe(input.slice(0, 3));
      expect(phone.country).toBe('977');
      expect(phone.e164).toBe(`+977${input}`);
      expect(isValidNepalPhone(phone)).toBe(true);
      expect(isAllocatedNepalPhone(phone)).toBe(true);
      expect(getNepalPhoneType(phone)).toBe('mobile');
    });
  }

  it('null-prefix row is valid but unallocated', () => {
    const phone = parseNepalPhone('9701234567');
    expect(isValidNepalPhone(phone)).toBe(true);
    expect(phone.operator).toBeUndefined();
    expect(isAllocatedNepalPhone(phone)).toBe(false);
  });

  it('unknown-prefix shaped mobile is valid and unallocated (regression)', () => {
    const phone = parseNepalPhone('9831234567');
    expect(phone.kind).toBe('mobile');
    expect(phone.operator).toBeUndefined();
    expect(isValidNepalPhone(phone)).toBe(true);
    expect(isAllocatedNepalPhone(phone)).toBe(false);
  });
});

describe('landlines', () => {
  it('Kathmandu 7-digit subscriber', () => {
    const phone = parseNepalPhone('01-4412345');
    expect(phone.kind).toBe('landline');
    expect(phone.areaOrPrefix).toBe('01');
    expect(phone.areas).toEqual(['Kathmandu', 'Lalitpur', 'Bhaktapur']);
    expect(isValidNepalPhone(phone)).toBe(true);
    expect(isAllocatedNepalPhone(phone)).toBe(true);
  });

  it('Kathmandu 8-digit subscriber', () => {
    const phone = parseNepalPhone('01-59012345');
    expect(phone.areaOrPrefix).toBe('01');
    expect(phone.national).toBe('0159012345');
    expect(isValidNepalPhone(phone)).toBe(true);
  });

  it('2-digit-area landline', () => {
    const phone = parseNepalPhone('021-123456');
    expect(phone.areaOrPrefix).toBe('021');
    expect(phone.areas).toEqual(['Morang']);
    expect(isAllocatedNepalPhone(phone)).toBe(true);
  });

  it('longest match prefers 010 over 01', () => {
    const phone = parseNepalPhone('0101234567');
    expect(phone.areaOrPrefix).toBe('010');
    expect(phone.areas).toEqual(['Sindhupalchok']);
    expect(isValidNepalPhone(phone)).toBe(true);
  });

  it('longest match prefers 011 over 01', () => {
    const phone = parseNepalPhone('011-123456');
    expect(phone.areaOrPrefix).toBe('011');
    expect(phone.areas).toEqual(['Kavrepalanchok']);
  });

  it('longest match prefers 019 over 01', () => {
    const phone = parseNepalPhone('019-123456');
    expect(phone.areaOrPrefix).toBe('019');
    expect(phone.areas).toEqual(['Dolakha']);
  });

  it('01 district list covers the valley trio', () => {
    expect(parseNepalPhone('014412345').areas).toEqual([
      'Kathmandu',
      'Lalitpur',
      'Bhaktapur',
    ]);
  });
});

describe('formats', () => {
  it('national mobile', () => {
    expect(formatNepalPhone(parseNepalPhone('9812345678'))).toBe('981-234-5678');
  });

  it('national landline', () => {
    expect(formatNepalPhone(parseNepalPhone('01-4412345'))).toBe('01-4412345');
  });

  it('international mobile', () => {
    expect(formatNepalPhone(parseNepalPhone('9812345678'), { style: 'international' })).toBe(
      '+977 981-234-5678',
    );
  });

  it('e164 mobile', () => {
    expect(formatNepalPhone(parseNepalPhone('9812345678'), { style: 'e164' })).toBe(
      '+9779812345678',
    );
  });

  it('international landline drops the trunk zero', () => {
    expect(formatNepalPhone(parseNepalPhone('01-4412345'), { style: 'international' })).toBe(
      '+977 1-4412345',
    );
  });
});

describe('canonical compare', () => {
  it('matches across country markers and separators', () => {
    expect(isSameNepalPhone('+977 981-234-5678', '9812345678')).toBe(true);
    expect(isSameNepalPhone('00977-9812345678', '9779812345678')).toBe(true);
  });

  it('matches Devanagari equivalence', () => {
    expect(isSameNepalPhone('९८१-२३४५६७८', '9812345678')).toBe(true);
  });

  it('accepts parsed objects', () => {
    expect(isSameNepalPhone(parseNepalPhone('9812345678'), '+9779812345678')).toBe(true);
  });

  it('rejects different numbers and garbage', () => {
    expect(isSameNepalPhone('9812345678', '9822345678')).toBe(false);
    expect(isSameNepalPhone('9812345678', 'not-a-number')).toBe(false);
  });
});

describe('types and gates', () => {
  it('classifies a 1660-led number as toll-free', () => {
    const phone = parseNepalPhone('1660-123456');
    expect(getNepalPhoneType(phone)).toBe('toll-free');
    expect(isValidNepalPhone(phone)).toBe(true);
  });

  it('classifies a 1800-led number as toll-free', () => {
    expect(getNepalPhoneType(parseNepalPhone('1800123456'))).toBe('toll-free');
  });

  it('classifies a 19xx-led number as premium', () => {
    expect(getNepalPhoneType(parseNepalPhone('19001234'))).toBe('premium');
  });

  it('isPossibleNepalPhone gates on shape only', () => {
    expect(isPossibleNepalPhone('9812345678')).toBe(true);
    expect(isPossibleNepalPhone('01-4412345')).toBe(true);
    expect(isPossibleNepalPhone('9831234567')).toBe(true);
    expect(isPossibleNepalPhone('abc')).toBe(false);
    expect(isPossibleNepalPhone('123')).toBe(false);
    expect(isPossibleNepalPhone('')).toBe(false);
  });

  it('pins the metadata revision', () => {
    expect(metadataRevision).toBe('nta-2026-09');
  });
});

describe('errors', () => {
  const bad = ['abc', '98a1234567', '981/2345678', '', '   ', '123', '981234567', '+978 9812345678'];
  for (const input of bad) {
    it(`throws InvalidPhoneError for ${JSON.stringify(input)}`, () => {
      try {
        parseNepalPhone(input);
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidPhoneError);
        expect(error).toBeInstanceOf(TypeError);
        expect((error as InvalidPhoneError).code).toBe('INVALID_PHONE');
      }
    });
  }

  it('throws the same error for non-strings', () => {
    for (const value of [undefined, null, 9812345678, {}, ['9812345678']]) {
      expect(() => parseNepalPhone(value as unknown as string)).toThrow(InvalidPhoneError);
      try {
        parseNepalPhone(value as unknown as string);
      } catch (error) {
        expect((error as InvalidPhoneError).code).toBe('INVALID_PHONE');
      }
    }
  });

  it('exposes the error name', () => {
    expect(new InvalidPhoneError('x').name).toBe('InvalidPhoneError');
  });
});
