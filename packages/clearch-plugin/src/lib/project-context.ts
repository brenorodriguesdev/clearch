import * as path from 'node:path';
import { readJsonFile } from './fs-utils';
import { toCamelCase, toPascalCase } from './naming';

export type ProjectContext = {
  projectNameKebab: string;
  projectNamePascal: string;
  projectNameCamel: string;
};

export async function readProjectContext(cwd: string): Promise<ProjectContext> {
  const pkgPath = path.join(cwd, 'package.json');
  const pkg = await readJsonFile<{ name?: string }>(pkgPath);
  const name = typeof pkg.name === 'string' ? pkg.name.trim() : '';
  if (!name) {
    throw new Error('package.json is missing a valid "name" field.');
  }
  return {
    projectNameKebab: name,
    projectNamePascal: toPascalCase(name),
    projectNameCamel: toCamelCase(name),
  };
}
