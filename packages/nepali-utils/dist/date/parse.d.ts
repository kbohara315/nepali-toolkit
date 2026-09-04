import { A as ADDate, B as BSDate } from '../types-DiHJisXT.js';
import { FormatLocale } from './format.js';

interface ParseOptions {
    readonly pattern?: string;
    readonly separator?: string;
    readonly allowDevanagari?: boolean;
    readonly numerals?: 'ascii' | 'devanagari' | 'both';
    readonly locale?: Pick<FormatLocale, 'months'>;
    /** Century base used to expand a YY token. Defaults to 2000. */
    readonly yearBase?: number;
}
declare function parseBS(input: string, options?: ParseOptions): BSDate;
declare function parseBS(input: string, pattern: string, options?: Omit<ParseOptions, 'pattern'>): BSDate;
declare function parseAD(input: string, options?: ParseOptions): ADDate;
declare function parseAD(input: string, pattern: string, options?: Omit<ParseOptions, 'pattern'>): ADDate;

export { type ParseOptions, parseAD, parseBS };
