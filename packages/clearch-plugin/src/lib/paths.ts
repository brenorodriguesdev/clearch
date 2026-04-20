import * as path from 'node:path';

export function getGeneratorsRoot(): string {
  return path.join(__dirname, '..', 'generators');
}
