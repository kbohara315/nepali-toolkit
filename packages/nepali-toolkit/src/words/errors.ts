export class InvalidWordsError extends TypeError {
  readonly code = 'INVALID_WORDS' as const;

  constructor(message: string) {
    super(message);
    this.name = 'InvalidWordsError';
  }
}
