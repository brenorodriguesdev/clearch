import * as path from 'node:path';
import { readFile, writeFile } from './fs-utils';

export type PackageJsonUpdate = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  /** Only set when the key is missing (never overwrites). */
  scripts?: Record<string, string>;
  /** Always set these script keys (used when switching skeleton → HTTP runtime). */
  scriptsForce?: Record<string, string>;
};

type PackageJsonShape = {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
};

/**
 * Add dependencies, devDependencies, and scripts only when the key is not already present.
 * Never changes existing versions or script commands.
 */
export async function updatePackageJson(cwd: string, update: PackageJsonUpdate): Promise<void> {
  const pkgPath = path.join(cwd, 'package.json');
  let raw: string;
  try {
    raw = await readFile(pkgPath, 'utf8');
  } catch {
    throw new Error(`package.json not found at ${pkgPath}`);
  }
  let pkg: PackageJsonShape;
  try {
    pkg = JSON.parse(raw) as PackageJsonShape;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid package.json (JSON parse error): ${msg}`);
  }

  pkg.dependencies = pkg.dependencies ?? {};
  pkg.devDependencies = pkg.devDependencies ?? {};
  pkg.scripts = pkg.scripts ?? {};

  if (update.dependencies) {
    for (const [name, ver] of Object.entries(update.dependencies)) {
      if (pkg.dependencies[name] === undefined) {
        pkg.dependencies[name] = ver;
      }
    }
  }

  if (update.devDependencies) {
    for (const [name, ver] of Object.entries(update.devDependencies)) {
      if (pkg.devDependencies[name] === undefined) {
        pkg.devDependencies[name] = ver;
      }
    }
  }

  if (update.scripts) {
    for (const [name, cmd] of Object.entries(update.scripts)) {
      if (pkg.scripts![name] === undefined) {
        pkg.scripts![name] = cmd;
      }
    }
  }

  if (update.scriptsForce) {
    for (const [name, cmd] of Object.entries(update.scriptsForce)) {
      pkg.scripts![name] = cmd;
    }
  }

  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}
