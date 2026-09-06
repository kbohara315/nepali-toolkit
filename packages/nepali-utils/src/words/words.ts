import { toAscii } from '../number/digits.js';
import { InvalidWordsError } from './errors.js';
import { ENGLISH_ONES, ENGLISH_SCALES, ENGLISH_TENS, NEPALI_ONES_0_99, NEPALI_SCALES } from './tables.js';

export type WordsInput = string | number | bigint;

export type NepaliAmountWordsOptions = {
  appendOnly?: boolean;
  showPaisa?: boolean;
  paisaSeparator?: 'space' | 'and';
  zeroRupeeText?: string;
  chequeStyle?: boolean;
};

export type { InvalidWordsError };

const MAX = 1000000000000n;
const MAX_FRAC = 6;
const NEPALI_WORD_VALUES = new Map(NEPALI_ONES_0_99.map((word, value) => [word, value]));
const NEPALI_SCALE_VALUES = new Map(NEPALI_SCALES.map((scale) => [scale.word, scale.value]));
const NEGATIVE_WORDS = new Set(['माइनस', 'ऋणात्मक']);
const CURRENCY_WORDS = new Set(['रुपैयाँ', 'रुपैया', 'रूपैयाँ', 'रूपैया', 'मात्र']);

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

export function parseNepaliWords(input: string): bigint {
  if (typeof input !== 'string') throw new InvalidWordsError('Value must be a string.');
  const text = input.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (text === '') throw new InvalidWordsError('Word input must not be empty.');

  const tokens = text.split(' ');
  let index = 0;
  let negative = false;
  if (NEGATIVE_WORDS.has(tokens[0])) {
    negative = true;
    index = 1;
  }

  let total = 0n;
  let current = 0n;
  let hasCurrent = false;
  let previousWasNumber = false;
  let previousScale = MAX;
  let foundWord = false;

  for (; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (CURRENCY_WORDS.has(token)) continue;

    const number = NEPALI_WORD_VALUES.get(token);
    if (number !== undefined) {
      if (previousWasNumber) throw new InvalidWordsError(`Unexpected number word ${token}.`);
      current = BigInt(number);
      hasCurrent = true;
      previousWasNumber = true;
      foundWord = true;
      continue;
    }

    const scale = NEPALI_SCALE_VALUES.get(token);
    if (scale === undefined || !hasCurrent || scale >= previousScale) {
      throw new InvalidWordsError(`Unexpected word ${token}.`);
    }
    total += current * scale;
    if (total >= MAX) throw new InvalidWordsError('Integer out of range: 0 <= n < 10^12.');
    current = 0n;
    hasCurrent = false;
    previousWasNumber = false;
    previousScale = scale;
    foundWord = true;
  }

  if (!foundWord || (tokens.length > 1 && !hasCurrent && total === 0n)) {
    throw new InvalidWordsError('Word input contains no number.');
  }
  total += current;
  if (total >= MAX) throw new InvalidWordsError('Integer out of range: 0 <= n < 10^12.');
  return negative && total !== 0n ? -total : total;
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

const STANDALONE_NUMBER = /(?<![-\p{L}\p{N}_])[+-]?(?:[0-9०-९]+(?:,[0-9०-९]{2,3})*)(?:\.[0-9०-९]+)?(?![-\p{L}\p{N}_])/gu;

export function numberWordsInText(input: string): string {
  if (typeof input !== 'string') throw new InvalidWordsError('Value must be a string.');
  return input.replace(STANDALONE_NUMBER, (token) => {
    try {
      return numberToNepaliWords(token.replace(/,/g, ''));
    } catch {
      return token;
    }
  });
}

function checkAmountOptions(options?: NepaliAmountWordsOptions): Required<NepaliAmountWordsOptions> {
  const checked = {
    appendOnly: options?.appendOnly ?? true,
    showPaisa: options?.showPaisa ?? true,
    paisaSeparator: options?.paisaSeparator ?? 'space',
    zeroRupeeText: options?.zeroRupeeText ?? 'शून्य',
    chequeStyle: options?.chequeStyle ?? false,
  };
  if (typeof checked.appendOnly !== 'boolean' || typeof checked.showPaisa !== 'boolean') {
    throw new InvalidWordsError('appendOnly and showPaisa must be booleans.');
  }
  if (checked.paisaSeparator !== 'space' && checked.paisaSeparator !== 'and') {
    throw new InvalidWordsError('paisaSeparator must be "space" or "and".');
  }
  if (typeof checked.zeroRupeeText !== 'string' || checked.zeroRupeeText.trim() === '') {
    throw new InvalidWordsError('zeroRupeeText must be a non-empty string.');
  }
  if (typeof checked.chequeStyle !== 'boolean') throw new InvalidWordsError('chequeStyle must be a boolean.');
  return checked;
}

function formatAmountWords(
  negative: boolean,
  rupees: bigint,
  paisa: bigint,
  options?: NepaliAmountWordsOptions,
): string {
  const checked = checkAmountOptions(options);
  const visibleNegative = negative && (rupees !== 0n || (checked.showPaisa && paisa !== 0n));
  let out = `${visibleNegative ? 'माइनस ' : ''}${rupees === 0n ? checked.zeroRupeeText : nepaliInt(rupees)} रुपैयाँ`;
  if (checked.showPaisa && paisa !== 0n) {
    out += `${checked.paisaSeparator === 'and' ? ' र ' : ' '}${nepaliInt(paisa)} पैसा`;
  }
  if (checked.appendOnly) out += ' मात्र';
  return checked.chequeStyle ? out.replaceAll(' ', '  ') : out;
}

export function numberToNepaliWords(value: WordsInput): string {
  return renderNepali(parseNumeral(value, MAX_FRAC));
}

export function numberToEnglishWords(value: WordsInput): string {
  return renderEnglish(parseNumeral(value, MAX_FRAC));
}

export function amountToNepaliWordsNPR(value: WordsInput, options?: NepaliAmountWordsOptions): string {
  const p = parseNumeral(value, 2);
  const rupees = BigInt(p.intPart);
  const paisa = p.fracPart === '' ? 0n : BigInt(p.fracPart.padEnd(2, '0'));
  return formatAmountWords(p.negative, rupees, paisa, options);
}

export function amountToNepaliWordsNPRMinorUnits(paisa: bigint, options?: NepaliAmountWordsOptions): string {
  if (typeof paisa !== 'bigint') throw new InvalidWordsError('Minor units must be a bigint.');
  const negative = paisa < 0n;
  const abs = negative ? -paisa : paisa;
  const rupees = abs / 100n;
  const rem = abs % 100n;
  if (rupees >= MAX) throw new InvalidWordsError('Integer out of range: 0 <= n < 10^12.');
  return formatAmountWords(negative, rupees, rem, options);
}
