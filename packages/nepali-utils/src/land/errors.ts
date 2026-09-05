/** Rejection for non-finite, fractional, or negative land-area input. */
export class InvalidAreaError extends TypeError {
  readonly code = 'INVALID_AREA';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidAreaError';
  }
}
