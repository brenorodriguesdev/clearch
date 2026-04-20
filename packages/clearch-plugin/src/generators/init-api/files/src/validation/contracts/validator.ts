export interface Validator {
  validate(data: unknown): Error | undefined;
}
