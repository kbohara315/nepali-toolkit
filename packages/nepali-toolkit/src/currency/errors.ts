function setName(error: Error, name: string): void {
  error.name = name;
}

export class InvalidCurrencyError extends TypeError {
  readonly code = 'INVALID_CURRENCY';

  constructor(message = 'Invalid currency') {
    super(message);
    setName(this, 'InvalidCurrencyError');
  }
}
