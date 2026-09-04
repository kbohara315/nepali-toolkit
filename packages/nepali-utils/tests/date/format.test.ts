import { describe, it, expect } from 'vitest';
import { formatBS } from '../../src/date/format.js';
describe('formatBS', () => {
  it('YYYY-MM-DD', () =>
    expect(formatBS({ year: 2082, month: 4, day: 7 }, 'YYYY-MM-DD')).toBe('2082-04-07'));
  it('MMMM', () => expect(formatBS({ year: 2082, month: 4, day: 7 }, 'MMMM')).toBe('Shrawan'));
  it('padded', () =>
    expect(formatBS({ year: 2082, month: 1, day: 2 }, 'YYYY/MM/DD')).toBe('2082/01/02'));
});
