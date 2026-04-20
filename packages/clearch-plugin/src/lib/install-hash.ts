import * as path from 'node:path';
import { assertClearchProject } from './project-guard';
import { copyTemplateDir, type TemplateVars } from './template';
import { getGeneratorsRoot } from './paths';
import { pathExists, readFile, writeFile } from './fs-utils';
import { updatePackageJson } from './update-package-json';
import { runNpmInstall } from './run-npm-install';
import { appendReadmeSection } from './readme-append';
import { ensureExportLine, ensureCryptographyExport } from './patch-exports';

const README_MARKER = '<!-- clearch:module:hash -->';

const README_SECTION = `## Hashing (clearch install hash)

- **Packages:** \`bcrypt\`, \`@types/bcrypt\`
- **Contract:** \`Hasher\` in \`src/data/contracts/hasher.ts\`
- **Adapter:** \`BcryptHasher\` in \`src/infra/cryptography/bcrypt-adapter.ts\`

### Usage sketch

\`\`\`typescript
import { BcryptHasher } from '@infra/cryptography/bcrypt-adapter';

const hasher = new BcryptHasher();
const hashedDigest = await hasher.hash('plain-text');
const ok = await hasher.compare('plain-text', hashedDigest);
\`\`\`
`;

export async function runInstallHash(options: { cwd: string }): Promise<{ skipped: boolean }> {
  const cwd = path.resolve(options.cwd);
  await assertClearchProject(cwd);

  const bcryptPath = path.join(cwd, 'src/infra/cryptography/bcrypt-adapter.ts');
  if (await pathExists(bcryptPath)) {
    await updatePackageJson(cwd, {
      dependencies: { bcrypt: '^5.1.1' },
      devDependencies: { '@types/bcrypt': '^5.0.2' },
    });
    return { skipped: true };
  }

  const templateRoot = getGeneratorsRoot();
  await copyTemplateDir({
    templateRoot,
    relativeDir: path.join('install-hash', 'files'),
    outputDir: cwd,
    vars: {} as TemplateVars,
  });

  const contractsIndex = path.join(cwd, 'src/data/contracts/index.ts');
  await ensureExportLine(contractsIndex, "export * from './hasher';");
  await ensureCryptographyExport(cwd, 'bcrypt-adapter');

  await updatePackageJson(cwd, {
    dependencies: { bcrypt: '^5.1.1' },
    devDependencies: { '@types/bcrypt': '^5.0.2' },
  });

  const readmePath = path.join(cwd, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  await writeFile(readmePath, appendReadmeSection(readme, README_MARKER, README_SECTION), 'utf8');

  runNpmInstall(cwd);
  return { skipped: false };
}
