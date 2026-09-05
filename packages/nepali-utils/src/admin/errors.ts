function setName(error: Error, name: string): void {
  error.name = name;
}

export class InvalidAdminError extends TypeError {
  readonly code = 'INVALID_ADMIN';

  constructor(message = 'Invalid admin input') {
    super(message);
    setName(this, 'InvalidAdminError');
  }
}
