import type { Validator } from '@validation/contracts';
import { MissingParamError } from '@presentation/errors';

export class RequiredFieldValidator implements Validator {
  constructor(private readonly fieldName: string) {}

  validate(data: unknown): Error | undefined {
    if (data === null || data === undefined || typeof data !== 'object') {
      return new MissingParamError(this.fieldName);
    }
    const record = data as Record<string, unknown>;
    const value = record[this.fieldName];
    if (value === undefined || value === null) {
      return new MissingParamError(this.fieldName);
    }
    if (typeof value === 'string' && value.trim() === '') {
      return new MissingParamError(this.fieldName);
    }
    return undefined;
  }
}
