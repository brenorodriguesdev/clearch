import bcrypt from 'bcrypt';
import type { Hasher } from '@data/contracts/hasher';

const SALT_ROUNDS = 10;

export class BcryptHasher implements Hasher {
  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, SALT_ROUNDS);
  }

  async compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}
