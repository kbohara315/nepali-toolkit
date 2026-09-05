// Weight-table core for the `basic` backend.
//
// Encoding (order-preserving under native string `<`; all weights are
// single BMP chars):
// - Base letter weights: U+E020 + index into BARNAMALA (barnamala order).
// - Light primary mark (anusvara/chandrabindu/visarga): U+E000 (shared,
//   so they tie at `base` and differ only at `full` secondary).
// - Key terminator: U+E010 (below every base weight, above light marks).
//   The terminator is what makes a trailing light mark sort BEFORE the
//   bare base (कं < क): at the first differing char, light (U+E000)
//   < terminator (U+E010).
// - Phonetic conjunct sub-weight: U+E011 (above terminator, below every
//   base weight), so क < क्ष < ख.
// - School conjunct weights: U+E020 + BARNAMALA.length + {0,1,2} for
//   क्ष, त्र, ज्ञ (after ह).
// - Digits / other code points (numeric:false): U+E200 + (cp & 0x7FFF)
//   for cp < U+E000 (order-preserving within each script block); larger
//   code points fall back to U+EFFF + the raw char (pass-through).
// - Full-sensitivity separators: secondary U+0002, tertiary U+0003
//   (below every weight char, so a base key is always a strict prefix
//   of its full key).
//
// NOTE: contract reading — "matra identity already primary" is satisfied
// because each matra maps to its own vowel's weight (ि→इ vs ी→ई differ
// at primary); secondary only distinguishes anusvara-type marks.

export type ConjunctMode = 'school' | 'phonetic';

export const BARNAMALA = [
  'ॐ',
  'अ',
  'आ',
  'इ',
  'ई',
  'उ',
  'ऊ',
  'ऋ',
  'ए',
  'ऐ',
  'ओ',
  'औ',
  'अं',
  'अः',
  'क',
  'ख',
  'ग',
  'घ',
  'ङ',
  'च',
  'छ',
  'ज',
  'झ',
  'ञ',
  'ट',
  'ठ',
  'ड',
  'ढ',
  'ण',
  'त',
  'थ',
  'द',
  'ध',
  'न',
  'प',
  'फ',
  'ब',
  'भ',
  'म',
  'य',
  'र',
  'ल',
  'व',
  'श',
  'ष',
  'स',
  'ह',
] as const;

const BASE = 0xe020;
const TERMINATOR = '';
// Phonetic conjuncts sort after all matra-forms of their first consonant but before the next consonant (Intl-like).
const PHONETIC_SUB = '';
// One shared lighter-primary mark: anusvara, chandrabindu and visarga are
// equal at `base` sensitivity (हँ ≡ हं) and differ only at `full`
// (secondary). Still lighter than the terminator, so कं < क.
const LIGHT_MARK = '';
const SCHOOL_BASE = BASE + BARNAMALA.length;

const weightOf = (ch: string): string =>
  String.fromCharCode(BASE + BARNAMALA.indexOf(ch as (typeof BARNAMALA)[number]));

// Matra → its vowel's weight.
const MATRA_WEIGHT: Record<string, string> = {
  'ा': weightOf('आ'),
  'ि': weightOf('इ'),
  'ी': weightOf('ई'),
  'ु': weightOf('उ'),
  'ू': weightOf('ऊ'),
  'ृ': weightOf('ऋ'),
  'े': weightOf('ए'),
  'ै': weightOf('ऐ'),
  'ो': weightOf('ओ'),
  'ौ': weightOf('औ'),
  'ं': LIGHT_MARK,
  'ँ': LIGHT_MARK,
  'ः': LIGHT_MARK,
};

// Contractions: क+्+ष, त+्+र, ज+्+ञ → single weight.
const CONTRACTIONS: Record<string, { school: string; first: string }> = {
  'क\u094dष': { school: String.fromCharCode(SCHOOL_BASE), first: weightOf('क') },
  'त\u094dर': { school: String.fromCharCode(SCHOOL_BASE + 1), first: weightOf('त') },
  'ज\u094dञ': { school: String.fromCharCode(SCHOOL_BASE + 2), first: weightOf('ज') },
};

// Standalone अं / अः hold chart positions after औ (barnamala order),
// even though the marks are lighter-primary elsewhere (कं < क).
const CHART_CONTRACTIONS: Record<string, string> = {
  'अ\u0902': weightOf('अं'),
  'अ\u0903': weightOf('अः'),
};

const HALANT = '्';
const NUKTA = '़';
const SECONDARY_MARKS: Record<string, string> = {
  'ं': 'a',
  'ँ': 'b',
  'ः': 'c',
};
const TERTIARY_NUKTA = 'a';

const ASCII_PATTERN = /^[\x00-\x7f]*$/;

const digitValue = (ch: string): string | null => {
  const cp = ch.codePointAt(0) as number;
  if (cp >= 0x30 && cp <= 0x39) return String.fromCharCode(cp);
  if (cp >= 0x966 && cp <= 0x96f) return String.fromCharCode(0x30 + (cp - 0x966));
  return null;
};

const codePointWeight = (ch: string): string => {
  const cp = ch.codePointAt(0) as number;
  if (cp < 0xe000) return String.fromCharCode(0xe200 + (cp & 0x7fff));
  return '' + ch;
};

export function buildKey(
  input: string,
  mode: ConjunctMode,
  sensitivity: 'base' | 'full',
  numeric: boolean,
): string {
  if (ASCII_PATTERN.test(input)) {
    if (!numeric) return '' + input;
    return '' + encodeNumericRuns(input, (s) => s);
  }
  const text = input
    .normalize('NFC')
    // NFC does not reorder a preposed short-i (ि+क is not canonically
    // equivalent to कि); fix it up so denormalized input sorts with कि.
    .replace(/ि([क-हक़-ॡ])/g, '$1ि')
    .replace(/[‍‌​]/g, '');
  const primary: string[] = [];
  const secondary: string[] = [];
  const tertiary: string[] = [];
  const chars = [...text];
  let digitRun = '';
  const flushDigits = (): void => {
    if (digitRun.length === 0) return;
    if (numeric) {
      const stripped = digitRun.replace(/^0+/, '') || '0';
      primary.push('\0' + String.fromCharCode(stripped.length) + stripped);
    } else {
      for (const d of digitRun) primary.push(codePointWeight(d));
    }
    digitRun = '';
  };
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    const tri = ch + (chars[i + 1] ?? '') + (chars[i + 2] ?? '');
    const contraction = CONTRACTIONS[tri];
    if (contraction !== undefined) {
      flushDigits();
      if (mode === 'school') {
        primary.push(contraction.school);
      } else {
        primary.push(contraction.first, PHONETIC_SUB);
      }
      i += 3;
      continue;
    }
    const dv = digitValue(ch);
    if (dv !== null) {
      if (numeric) {
        digitRun += dv;
      } else {
        flushDigits();
        primary.push(codePointWeight(ch));
      }
      i += 1;
      continue;
    }
    flushDigits();
    const pair = ch + (chars[i + 1] ?? '');
    const chart = CHART_CONTRACTIONS[pair];
    if (chart !== undefined) {
      primary.push(chart);
      if (sensitivity === 'full') secondary.push(SECONDARY_MARKS[chars[i + 1]]);
      i += 2;
      continue;
    }
    if (ch === HALANT) {
      i += 1;
      continue;
    }
    if (ch === NUKTA) {
      if (sensitivity === 'full') tertiary.push(TERTIARY_NUKTA);
      i += 1;
      continue;
    }
    const matra = MATRA_WEIGHT[ch];
    if (matra !== undefined) {
      primary.push(matra);
      const sec = SECONDARY_MARKS[ch];
      if (sec !== undefined && sensitivity === 'full') secondary.push(sec);
      i += 1;
      continue;
    }
    const barnamalaIndex = (BARNAMALA as readonly string[]).indexOf(ch);
    if (barnamalaIndex >= 0) {
      primary.push(String.fromCharCode(BASE + barnamalaIndex));
      i += 1;
      continue;
    }
    primary.push(codePointWeight(ch));
    i += 1;
  }
  flushDigits();
  // ASCII fast-path keys already start with \x01; non-ASCII keys use PUA.
  // Digit-run segments start with \0. Prefix the text body so digit runs
  // (in numeric mode) sort before text, deterministically.
  const body = primary.join('');
  const textKey = numeric ? '' + body + TERMINATOR : body + TERMINATOR;
  if (sensitivity === 'base') return textKey;
  return textKey + '' + secondary.join('') + '' + tertiary.join('');
}

function encodeNumericRuns(input: string, map: (segment: string) => string): string {
  return input.replace(/[0-9]+/g, (run) => {
    const stripped = run.replace(/^0+/, '') || '0';
    return '\0' + String.fromCharCode(map(stripped).length) + map(stripped);
  });
}
