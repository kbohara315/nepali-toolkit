function setName(error: Error, name: string): void {
  error.name = name;
}

export class InvalidNumberError extends TypeError {
  readonly code = 'INVALID_NUMBER';

  constructor(message = 'Invalid number') {
    super(message);
    setName(this, 'InvalidNumberError');
  }
}
