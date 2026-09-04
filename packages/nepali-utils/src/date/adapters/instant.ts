import { InvalidInstantError } from '../errors.js';

export type InstantInput = Date | number | string;

/** Shared Date-instance pre-check (preserves date.ts message). */
export function assertValidDate(value: unknown): asserts value is Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new InvalidInstantError('Invalid JavaScript Date');
  }
}

/** Shared instant coercion with explicit-offset-string rule (preserves timezone.ts messages). */
export function toInstantDate(value: InstantInput): Date {
  if (typeof value === 'string' && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    throw new InvalidInstantError('Instant strings must include an explicit UTC offset');
  }
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value as number & string);
  if (Number.isNaN(date.getTime())) throw new InvalidInstantError('Invalid instant');
  return date;
}
