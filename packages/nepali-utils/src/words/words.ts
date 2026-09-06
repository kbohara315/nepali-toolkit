import { toAscii } from '../number/digits.js';
import { InvalidWordsError } from './errors.js';
import { ENGLISH_ONES, ENGLISH_SCALES, ENGLISH_TENS, NEPALI_ONES_0_99, NEPALI_SCALES } from './tables.js';

export type WordsInput = string | number | bigint;

export type { InvalidWordsError };

const MAX = 1000000000000n;
const MAX_FRAC = 6;

interface Parsed {
  negative: boolean;
  intPart: string;
  fracPart: string;
}

function parseNumeral(value: WordsInput, maxFrac: number): Parsed {
  let text: string;
  if (typeof value === 'bigint') {
    text = value.toString();
  } else if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new InvalidWordsError('Value must be finite.');
    text = String(value);
    if (/[eE]/.test(text)) throw new InvalidWordsError('Scientific notation is not supported; pass an exact decimal string.');
  } else if (typeof value === 'string') {
    text = value;
  } else {
    throw new InvalidWordsError('Value must be a string, number, or bigint.');
  }
  text = toAscii(text).trim();
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(text);
  if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) {
    throw new InvalidWordsError('Malformed numeral input.');
  }
  const negative = m[1] === '-';
  const intPart = m[2] === '' ? '0' : m[2].replace(/^0+(?=\d)/, '');
  const fracPart = m[3] ?? '';
  if (fracPart.length > maxFrac) {
    throw new InvalidWordsError(`At most ${maxFrac} fraction digits allowed.`);
  }
  if (/[^0-9]/.test(intPart + fracPart)) throw new InvalidWordsError('Malformed numeral input.');
  const intVal = BigInt(intPart);
  if (intVal >= MAX) throw new InvalidWordsError('Integer out of range: 0 <= n < 10^12.');
  return { negative, intPart: intPart.replace(/^0+(?=\d)/, '') || '0', fracPart };
}

function nepaliInt(n: bigint): string {
  if (n === 0n) return NEPALI_ONES_0_99[0];
  let out = '';
  let rest = n;
  for (const s of NEPALI_SCALES) {
    const q = rest / s.value;
    if (q > 0n) {
      if (out) out += ' ';
      out += `${nepaliBelow100(Number(q))} ${s.word}`;
      rest %= s.value;
    }
  }
  if (rest > 0n) {
    if (out) out += ' ';
    out += nepaliBelow100(Number(rest));
  }
  return out;
}

function nepaliBelow100(n: number): string {
  if (n < 0 || n > 99 || !Number.isInteger(n)) throw new InvalidWordsError('Internal range error.');
  return NEPALI_ONES_0_99[n];
}

function englishBelow100(n: number): string {
  if (n < 20) return ENGLISH_ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o === 0 ? ENGLISH_TENS[t] : `${ENGLISH_TENS[t]} ${ENGLISH_ONES[o]}`;
}

function englishInt(n: bigint): string {
  if (n === 0n) return 'zero';
  let out = '';
  let rest = n;
  for (const s of ENGLISH_SCALES) {
    const q = rest / s.value;
    if (q > 0n) {
      if (out) out += ' ';
      out += `${englishBelow100(Number(q))} ${s.word}`;
      rest %= s.value;
    }
  }
  if (rest > 0n) {
    if (out) out += ' ';
    out += englishBelow100(Number(rest));
  }
  return out;
}

function renderNepali(p: Parsed): string {
  const intWords = nepaliInt(BigInt(p.intPart));
  let out = intWords;
  if (p.fracPart.length > 0) {
    let digits = '';
    for (const d of p.fracPart) {
      if (digits) digits += ' ';
      digits += NEPALI_ONES_0_99[Number(d)];
    }
    out = `${intWords} दशमलव ${digits}`;
  }
  return p.negative && !(BigInt(p.intPart) === 0n && /^0*$/.test(p.fracPart)) ? `माइनस ${out}` : out;
}

function renderEnglish(p: Parsed): string {
  const intWords = englishInt(BigInt(p.intPart));
  let out = intWords;
  if (p.fracPart.length > 0) {
    let digits = '';
    for (const d of p.fracPart) {
      if (digits) digits += ' ';
      digits += ENGLISH_ONES[Number(d)];
    }
    out = `${intWords} point ${digits}`;
  }
  return p.negative && !(BigInt(p.intPart) === 0n && /^0*$/.test(p.fracPart)) ? `minus ${out}` : out;
}

export function numberToNepaliWords(value: WordsInput): string {
  return renderNepali(parseNumeral(value, MAX_FRAC));
}

export function numberToEnglishWords(value: WordsInput): string {
  return renderEnglish(parseNumeral(value, MAX_FRAC));
}

export function amountToNepaliWordsNPR(value: WordsInput): string {
  const p = parseNumeral(value, 2);
  const rupees = BigInt(p.intPart);
  const paisa = p.fracPart === '' ? 0n : BigInt(p.fracPart.padEnd(2, '0'));
  const rupeeWords = `${p.negative && (rupees !== 0n || paisa !== 0n) ? 'माइनस ' : ''}${nepaliInt(rupees)}`;
  if (paisa === 0n) return `${rupeeWords} रुपैयाँ मात्र`;
  return `${rupeeWords} रुपैयाँ ${nepaliInt(paisa)} पैसा मात्र`;
}

export function amountToNepaliWordsNPRMinorUnits(paisa: bigint): string {
  if (typeof paisa !== 'bigint') throw new InvalidWordsError('Minor units must be a bigint.');
  const negative = paisa < 0n;
  const abs = negative ? -paisa : paisa;
  const rupees = abs / 100n;
  const rem = abs % 100n;
  if (rupees >= MAX) throw new InvalidWordsError('Integer out of range: 0 <= n < 10^12.');
  const prefix = negative && abs !== 0n ? 'माइनस ' : '';
  if (rem === 0n) return `${prefix}${nepaliInt(rupees)} रुपैयाँ मात्र`;
  return `${prefix}${nepaliInt(rupees)} रुपैयाँ ${nepaliInt(rem)} पैसा मात्र`;
}
