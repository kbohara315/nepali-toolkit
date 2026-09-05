// Shared Nepali text primitives for the `collation` domain.
//
// Single source of truth for the normalization pipeline that `table.ts`
// applies before weighting (NFC + preposed short-i fix + format-control
// strip). Exported so consumers (e.g. word counters, search) normalize
// exactly the way the collator sees the string.
//
// Pure TypeScript, zero dependencies, no `Intl`, Hermes-safe.

import { InvalidCollationError } from './errors.js';

function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new InvalidCollationError(`Expected string, received ${typeof value}`);
  }
}

// Preposed short-i (U+093F) typed before its consonant, e.g. `िक` for `कि`.
// NFC does not equate the two, so swap the misplaced matra past its
// consonant. Guarded: the swap fires only when the matra is NOT already
// preceded by a consonant, halant or nukta — otherwise correct input like
// `किरण` would be corrupted into `करिन` order. Capture-group form (not a
// lookbehind) keeps this import-safe on older Hermes runtimes.
const PREPOSED_I = /(^|[^\u0915-\u0939\u0958-\u0961\u094D\u093C])\u093F([\u0915-\u0939\u0958-\u0961])/g;

// Format controls stripped before weighting: ZWJ, ZWNJ, ZWSP, BOM.
const FORMAT_CONTROLS = /[‍‌​﻿]/g;

// Devanagari block U+0900-U+097F (Nepali lives here).
const DEVANAGARI = /[\u0900-\u097F]/;

// Leading/trailing punctuation ignored for word identity: danda,
// double-danda and common ASCII/Unicode punctuation.
const EDGE_PUNCT = /^[।॥.,;:!?'"“”‘’()[\]{}<>…—–-]+|[।॥.,;:!?'"“”‘’()[\]{}<>…—–-]+$/g;

// Sentence terminators for stats: danda, double-danda, ? !
const SENTENCE_SPLIT = /[।॥?!]+/;

export type NepaliTextStats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
};

/** Canonical form the collator compares: NFC + i-fix + control strip. */
export function normalizeNepaliText(input: string): string {
  assertString(input);
  return input.normalize('NFC').replace(PREPOSED_I, '$1$2\u093F').replace(FORMAT_CONTROLS, '');
}

/** True when the string holds at least one Devanagari character. */
export function containsDevanagari(input: string): boolean {
  assertString(input);
  return DEVANAGARI.test(input.normalize('NFC'));
}

/**
 * True when every character is Devanagari (block U+0900-U+097F).
 * Spaces and punctuation break it — strip before calling if you want
 * a "Nepali words only" check. Empty string is false.
 */
export function isDevanagariOnly(input: string): boolean {
  assertString(input);
  if (input.length === 0) return false;
  return [...input.normalize('NFC')].every((ch) => DEVANAGARI.test(ch));
}

/** Count Devanagari characters (code points, not UTF-16 units). */
export function countDevanagariChars(input: string): number {
  assertString(input);
  let n = 0;
  for (const ch of input.normalize('NFC')) {
    if (DEVANAGARI.test(ch)) n += 1;
  }
  return n;
}

function wordsOf(normalized: string): string[] {
  const out: string[] = [];
  for (const raw of normalized.trim().split(/\s+/)) {
    if (raw.length === 0) continue;
    const word = raw.replace(EDGE_PUNCT, '');
    if (word.length > 0) out.push(word);
  }
  return out;
}

/**
 * Nepali-aware text stats (word-counter semantics): words split on
 * whitespace with danda/punctuation trimmed, sentences split on
 * । ॥ ? !, paragraphs on newline-separated lines.
 */
export function getNepaliTextStats(input: string): NepaliTextStats {
  assertString(input);
  const normalized = normalizeNepaliText(input);
  const words = normalized.trim().length === 0 ? [] : wordsOf(normalized);
  const characters = [...input].length;
  const charactersNoSpaces = [...input].filter((ch) => !/\s/.test(ch)).length;

  let sentences = 0;
  if (normalized.trim().length > 0) {
    const segments = normalized
      .split(SENTENCE_SPLIT)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    sentences = segments.length === 0 ? 1 : segments.length;
  }

  const paragraphs =
    normalized.trim().length === 0
      ? 0
      : normalized.split(/\n+/).filter((p) => p.trim().length > 0).length;

  return {
    words: words.length,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
  };
}

/** Word count with Nepali (danda-aware) tokenization. */
export function countNepaliWords(input: string): number {
  return getNepaliTextStats(input).words;
}

// Punctuation skipped when `ignorePunctuation` is set (collation keys and
// search): ASCII whitespace/punctuation plus danda and double-danda.
// Space, tab, hyphen, quotes, brackets, . , ; : ! ? … em/en dashes, । ॥.
const IGNORABLE_PUNCT_SRC = "\u002D\u0027\u0022\u2018\u2019\u201C\u201D\u0028\u0029\u005B\u005D\u007B\u007D\u003C\u003E\u002E\u002C\u003B\u003A\u0021\u003F\u2026\u2014\u2013";

const IGNORABLE_PUNCT = new Set([
  ' ',
  '\t',
  ...IGNORABLE_PUNCT_SRC,
  '\u0964',
  '\u0965',
]);

/**
 * True for punctuation/whitespace skipped under `ignorePunctuation`.
 * Single code point only — anything longer is never ignorable.
 */
export function isIgnorablePunctuation(ch: string): boolean {
  if (ch.length === 0 || [...ch].length !== 1) return false;
  return IGNORABLE_PUNCT.has(ch);
}

/** Remove `ignorePunctuation` characters (no case or NFC changes). */
export function stripIgnorablePunctuation(input: string): string {
  assertString(input);
  return [...input].filter((ch) => !isIgnorablePunctuation(ch)).join('');
}

export type NepaliSearchOptions = {
  /** Fold case before matching (default true; Latin-only effect). */
  caseInsensitive?: boolean;
  /** Strip punctuation/whitespace before matching (default false). */
  ignorePunctuation?: boolean;
};

function searchKey(value: string, options: NepaliSearchOptions | undefined): string {
  let out = normalizeNepaliText(value);
  if (options?.ignorePunctuation === true) {
    out = [...out].filter((ch) => !isIgnorablePunctuation(ch)).join('');
  }
  if (options?.caseInsensitive ?? true) out = out.toLowerCase();
  return out;
}

/**
 * Normalized substring search: NFC + preposed-i fix + control strip, so a
 * denormalized or punctuated needle still matches (e.g. `िक` finds `किरण`).
 */
export function nepaliIncludes(
  haystack: string,
  needle: string,
  options?: NepaliSearchOptions,
): boolean {
  assertString(haystack);
  assertString(needle);
  if (needle.length === 0) return true;
  return searchKey(haystack, options).includes(searchKey(needle, options));
}

/** Normalized prefix search (same pipeline as `nepaliIncludes`). */
export function nepaliStartsWith(
  haystack: string,
  needle: string,
  options?: NepaliSearchOptions,
): boolean {
  assertString(haystack);
  assertString(needle);
  if (needle.length === 0) return true;
  return searchKey(haystack, options).startsWith(searchKey(needle, options));
}
