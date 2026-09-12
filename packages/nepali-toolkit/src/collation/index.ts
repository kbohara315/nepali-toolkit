export { InvalidCollationError } from './errors.js';
export { createNepaliCollator } from './collator.js';
export type {
  CollationBackend,
  CollationOptions,
  NepaliCollator,
  ResolvedBackend,
} from './collator.js';
export type { BuildKeyOptions, ConjunctMode } from './table.js';
export {
  containsDevanagari,
  countDevanagariChars,
  countNepaliWords,
  getNepaliTextStats,
  isDevanagariOnly,
  isIgnorablePunctuation,
  nepaliIncludes,
  nepaliStartsWith,
  normalizeNepaliText,
  stripIgnorablePunctuation,
} from './text.js';
export type { NepaliSearchOptions, NepaliTextStats } from './text.js';
