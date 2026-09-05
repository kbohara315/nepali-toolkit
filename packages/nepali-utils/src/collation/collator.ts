import { InvalidCollationError } from './errors.js';
import { buildKey, type ConjunctMode } from './table.js';

export type CollationBackend = 'auto' | 'intl' | 'basic';
export type ResolvedBackend = 'intl' | 'basic';
export type CollationOptions = {
  backend?: CollationBackend;
  conjuncts?: ConjunctMode;
  numeric?: boolean;
  sensitivity?: 'base' | 'full';
  /** Skip punctuation/whitespace at primary (default false — v1 weights them). */
  ignorePunctuation?: boolean;
};

export type NepaliCollator = {
  compare(a: string, b: string): -1 | 0 | 1;
  sort(values: readonly string[]): string[];
  equals(a: string, b: string): boolean;
  readonly backend: ResolvedBackend;
};

function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new InvalidCollationError(`Expected string, received ${typeof value}`);
  }
}

// Trust probe, memoized per Intl identity: steady-state callers pay no
// re-probe, while a swapped/stubbed `globalThis.Intl` (tests, polyfills)
// re-probes instead of serving a stale verdict.
let cachedIntlIdentity: unknown = null;
let cachedTrust = false;
let hasTrustCache = false;

function trustIntl(): boolean {
  const identity = (globalThis as { Intl?: unknown }).Intl;
  if (hasTrustCache && identity === cachedIntlIdentity) return cachedTrust;
  let trusted = false;
  try {
    const Ctor = identity as
      | { Collator?: new (locale: string) => {
          compare(a: string, b: string): number;
          resolvedOptions(): { locale: string };
        } }
      | undefined;
    if (typeof Ctor?.Collator === 'function') {
      const collator = new Ctor.Collator('ne-NP');
      if (collator.resolvedOptions().locale.startsWith('ne')) {
        trusted = collator.compare('ख', 'क') > 0 && collator.compare('ग', 'ख') > 0;
      }
    }
  } catch {
    trusted = false;
  }
  cachedIntlIdentity = identity;
  cachedTrust = trusted;
  hasTrustCache = true;
  return trusted;
}

export function createNepaliCollator(options: CollationOptions = {}): NepaliCollator {
  const backendOption = options.backend ?? 'auto';
  const conjuncts = options.conjuncts ?? 'school';
  const numeric = options.numeric ?? false;
  const sensitivity = options.sensitivity ?? 'base';
  const ignorePunctuation = options.ignorePunctuation ?? false;

  // Contract reading: `Intl` cannot honor `school` conjunct order
  // (CLDR `ne` has no conjunct tailoring), so `auto` + `school` resolves
  // to `basic` without consulting `Intl`. Flagged in the report.
  let resolved: ResolvedBackend;
  let intl: { compare(a: string, b: string): number } | null = null;
  if (backendOption === 'basic') {
    resolved = 'basic';
  } else if (conjuncts === 'school' && backendOption === 'auto') {
    resolved = 'basic';
  } else {
    const trusted = trustIntl(); // identity-memoized; probes once per Intl
    if (!trusted && backendOption === 'intl') {
      throw new InvalidCollationError('Requested Intl backend failed the ne-NP trust check');
    }
    resolved = trusted ? 'intl' : 'basic';
  }
  if (resolved === 'intl') {
    const Ctor = (globalThis as { Intl: { Collator: new (l: string, o: object) => { compare(a: string, b: string): number } } }).Intl;
    intl = new Ctor.Collator('ne-NP', {
      numeric,
      sensitivity: sensitivity === 'base' ? 'base' : 'variant',
      ignorePunctuation,
    });
  }

  const keyOf = (value: string): string =>
    buildKey(value, conjuncts, sensitivity, numeric, { ignorePunctuation });
  const compareKeys = (a: string, b: string): -1 | 0 | 1 => {
    const ka = keyOf(a);
    const kb = keyOf(b);
    if (ka < kb) return -1;
    if (ka > kb) return 1;
    return 0;
  };

  const compare =
    resolved === 'intl'
      ? (a: string, b: string): -1 | 0 | 1 => {
          assertString(a);
          assertString(b);
          const result = (intl as { compare(a: string, b: string): number }).compare(a, b);
          return result < 0 ? -1 : result > 0 ? 1 : 0;
        }
      : (a: string, b: string): -1 | 0 | 1 => {
          assertString(a);
          assertString(b);
          return compareKeys(a, b);
        };

  return {
    compare,
    // Schwartzian: one key per string (O(N)), then native `<` on keys.
    sort(values: readonly string[]): string[] {
      const pairs = values.map((value) => {
        assertString(value);
        return { key: keyOf(value), value };
      });
      if (resolved === 'intl') {
        const ic = intl as { compare(a: string, b: string): number };
        pairs.sort((x, y) => ic.compare(x.value, y.value));
      } else {
        pairs.sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));
      }
      return pairs.map((pair) => pair.value);
    },
    equals(a: string, b: string): boolean {
      if (a === b) return true;
      assertString(a);
      assertString(b);
      if (resolved === 'intl') {
        return (intl as { compare(x: string, y: string): number }).compare(a, b) === 0;
      }
      return keyOf(a) === keyOf(b);
    },
    backend: resolved,
  };
}
