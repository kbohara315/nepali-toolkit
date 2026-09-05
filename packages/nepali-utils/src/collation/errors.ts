function setName(error: Error, name: string): void {
  error.name = name;
}

export class InvalidCollationError extends TypeError {
  readonly code = 'INVALID_COLLATION';

  constructor(message = 'Invalid collation input') {
    super(message);
    setName(this, 'InvalidCollationError');
  }
}
