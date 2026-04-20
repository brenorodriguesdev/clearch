import * as path from 'node:path';
import { pathExists, readFile, writeFile } from './fs-utils';

export async function ensureExportLine(
  indexFile: string,
  exportLine: string,
  createIfMissing?: { header: string }
): Promise<void> {
  if (!(await pathExists(indexFile))) {
    if (!createIfMissing) {
      throw new Error(`Expected file at ${indexFile}`);
    }
    await writeFile(indexFile, `${createIfMissing.header}\n${exportLine}\n`, 'utf8');
    return;
  }
  let content = await readFile(indexFile, 'utf8');
  if (content.includes(exportLine)) {
    return;
  }
  content = `${content.trimEnd()}\n${exportLine}\n`;
  await writeFile(indexFile, content, 'utf8');
}

export async function ensureCryptographyExport(cwd: string, exportFromFile: string): Promise<void> {
  const indexFile = path.join(cwd, 'src/infra/cryptography/index.ts');
  const line = `export * from './${exportFromFile.replace(/\.ts$/, '')}';`;
  await ensureExportLine(indexFile, line, { header: '/* clearch cryptography barrel */' });
}
