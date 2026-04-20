import type { Validator } from '@validation/contracts';

export class ValidatorComposite implements Validator {
  constructor(private readonly validators: readonly Validator[]) {}

  validate(data: unknown): Error | undefined {
    for (const validator of this.validators) {
      const error = validator.validate(data);
      if (error) {
        return error;
      }
    }
    return undefined;
  }
}
