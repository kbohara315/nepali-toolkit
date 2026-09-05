/** Rejection for malformed Nepal phone input. */
export class InvalidPhoneError extends TypeError {
  readonly code = 'INVALID_PHONE';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidPhoneError';
  }
}
