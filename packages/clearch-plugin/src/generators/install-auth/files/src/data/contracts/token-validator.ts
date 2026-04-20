export interface TokenValidator {
  verify(token: string): Record<string, unknown>;
}
