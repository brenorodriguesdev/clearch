import * as path from 'node:path';
import { readFile, writeFile } from './fs-utils';

export async function mergeTsconfigCompilerOptions(
  cwd: string,
  extra: Record<string, unknown>
): Promise<void> {
  const tsconfigPath = path.join(cwd, 'tsconfig.json');
  const raw = await readFile(tsconfigPath, 'utf8');
  const cfg = JSON.parse(raw) as {
    compilerOptions?: Record<string, unknown>;
  };
  cfg.compilerOptions = { ...cfg.compilerOptions, ...extra };
  await writeFile(tsconfigPath, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
}
