import * as path from 'node:path';
import { pathExists, readJsonFile } from './fs-utils';

export type ClearchProjectMeta = {
  version: string;
  template: string;
};

export async function readClearchProject(cwd: string): Promise<ClearchProjectMeta | null> {
  const file = path.join(cwd, '.clearch.json');
  if (!(await pathExists(file))) {
    return null;
  }
  try {
    const raw = await readJsonFile<unknown>(file);
    if (
      raw &&
      typeof raw === 'object' &&
      'version' in raw &&
      'template' in raw &&
      typeof (raw as { version: unknown }).version === 'string' &&
      typeof (raw as { template: unknown }).template === 'string'
    ) {
      return {
        version: (raw as { version: string }).version,
        template: (raw as { template: string }).template,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export async function assertClearchProject(cwd: string): Promise<ClearchProjectMeta> {
  const meta = await readClearchProject(cwd);
  if (!meta) {
    throw new Error(
      'This folder does not look like a clearch-generated project (missing .clearch.json). Run `npx clearch init <name>` first.'
    );
  }
  if (meta.template !== 'api') {
    throw new Error(`Unsupported clearch template: "${meta.template}"`);
  }
  return meta;
}
