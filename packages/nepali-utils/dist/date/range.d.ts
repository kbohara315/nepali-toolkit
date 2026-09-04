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

/** Frozen generated range and provenance metadata. Month data is not loaded here. */
declare const range: DateMetadata;

export { range };
