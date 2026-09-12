import { metadata } from './internal/data.js';
import type { DateMetadata } from './internal/data.js';

export type { DateMetadata } from './internal/data.js';

/**
 * Frozen generated range and provenance metadata. Month data is not loaded here.
 *
 * Owns range introspection: one-liner accessors over {@link metadata} so
 * callers need not reach into `internal/`.
 */
export const range: DateMetadata = metadata;

/** Minimum supported BS year (one-liner over {@link range}). */
export const minBSYear = range.bsStart.year;

/** Maximum supported BS year (one-liner over {@link range}). */
export const maxBSYear = range.bsEnd.year;

/** Minimum supported AD year (one-liner over {@link range}). */
export const minADYear = range.adStart.year;

/** Maximum supported AD year (one-liner over {@link range}). */
export const maxADYear = range.adEnd.year;
