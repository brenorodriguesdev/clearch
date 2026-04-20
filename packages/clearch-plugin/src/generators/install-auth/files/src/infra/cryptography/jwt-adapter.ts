import jwt, { type SignOptions } from 'jsonwebtoken';
import type { TokenGenerator } from '@data/contracts/token-generator';
import type { TokenValidator } from '@data/contracts/token-validator';

export type JwtAdapterOptions = {
  secret: string;
  defaultExpiresIn?: string;
};

export class JwtAdapter implements TokenGenerator, TokenValidator {
  constructor(private readonly options: JwtAdapterOptions) {}

  sign(payload: Record<string, unknown>, signOptions?: { expiresIn?: string }): string {
    const expiresIn = signOptions?.expiresIn ?? this.options.defaultExpiresIn ?? '1d';
    return jwt.sign(payload, this.options.secret, { expiresIn } as SignOptions);
  }

  verify(token: string): Record<string, unknown> {
    const decoded = jwt.verify(token, this.options.secret);
    if (typeof decoded === 'string') {
      throw new Error('Unexpected string token payload');
    }
    return decoded as Record<string, unknown>;
  }
}
