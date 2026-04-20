import { spawnSync } from 'node:child_process';

export function runNpmInstall(cwd: string): void {
  const result = spawnSync('npm', ['install'], { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`npm install failed with exit code ${result.status ?? 'unknown'}`);
  }
}
