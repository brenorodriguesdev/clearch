import { RequiredFieldValidator } from '@validation/validators/required-field';
import { ValidatorComposite } from '@validation/validators/validator-composite';

describe('validation platform', () => {
  it('RequiredFieldValidator rejects missing field', () => {
    const validator = new RequiredFieldValidator('title');
    expect(validator.validate({})).toBeDefined();
  });

  it('ValidatorComposite aggregates child validators', () => {
    const composite = new ValidatorComposite([new RequiredFieldValidator('a')]);
    expect(composite.validate({})).toBeDefined();
  });
});
