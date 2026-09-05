interface MetadataDate {
    readonly year: number;
    readonly month: number;
    readonly day: number;
}
interface ReferencePair {
    readonly bs: MetadataDate;
    readonly ad: MetadataDate;
    readonly note: string;
}
interface DateMetadata {
    readonly bsStart: MetadataDate;
    readonly bsEnd: MetadataDate;
    readonly adStart: MetadataDate;
    readonly adEnd: MetadataDate;
    readonly totalDays: number;
    readonly checksum: string;
    readonly sourceRevision: string;
    readonly referencePair: ReferencePair;
}

/**
 * Frozen generated range and provenance metadata. Month data is not loaded here.
 *
 * Owns range introspection: one-liner accessors over {@link metadata} so
 * callers need not reach into `internal/`.
 */
declare const range: DateMetadata;
/** Minimum supported BS year (one-liner over {@link range}). */
declare const minBSYear: number;
/** Maximum supported BS year (one-liner over {@link range}). */
declare const maxBSYear: number;
/** Minimum supported AD year (one-liner over {@link range}). */
declare const minADYear: number;
/** Maximum supported AD year (one-liner over {@link range}). */
declare const maxADYear: number;

export { type DateMetadata, maxADYear, maxBSYear, minADYear, minBSYear, range };
