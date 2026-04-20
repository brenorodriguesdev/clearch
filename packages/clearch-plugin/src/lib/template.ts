import * as path from 'node:path';
import { readdir } from 'node:fs/promises';
import { ensureDir, pathExists, readFile, writeFile } from './fs-utils';

export type TemplateVars = Record<string, string>;

export function renderTemplate(content: string, vars: TemplateVars): string {
  let out = content;
  for (const [key, value] of Object.entries(vars)) {
    const token = `__${key}__`;
    out = out.split(token).join(value);
  }
  return out;
}

export async function walkFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

export async function copyTemplateDir(params: {
  templateRoot: string;
  relativeDir: string;
  outputDir: string;
  vars: TemplateVars;
  transformFileName?: (relativePath: string) => string;
}): Promise<void> {
  const sourceDir = path.join(params.templateRoot, params.relativeDir);
  const exists = await pathExists(sourceDir);
  if (!exists) {
    throw new Error(`Template directory missing: ${sourceDir}`);
  }
  const files = await walkFiles(sourceDir);
  for (const file of files) {
    const rel = path.relative(sourceDir, file);
    const outName = params.transformFileName ? params.transformFileName(rel) : rel;
    const dest = path.join(params.outputDir, outName);
    await ensureDir(path.dirname(dest));
    const raw = await readFile(file, 'utf8');
    const rendered = renderTemplate(raw, params.vars);
    await writeFile(dest, rendered, 'utf8');
  }
}
