import * as path from 'node:path';
import { assertClearchProject } from './project-guard';
import { copyTemplateDir, type TemplateVars } from './template';
import { getGeneratorsRoot } from './paths';
import { pathExists, readFile, writeFile } from './fs-utils';
import { updatePackageJson } from './update-package-json';
import { runNpmInstall } from './run-npm-install';
import { appendReadmeSection } from './readme-append';
import { mergeEnvExample } from './update-env-example';
import { ensureExportLine, ensureCryptographyExport } from './patch-exports';

const README_MARKER = '<!-- clearch:module:auth -->';

const README_SECTION = `## JWT (clearch install auth)

- **Packages:** \`jsonwebtoken\`, \`@types/jsonwebtoken\`
- **Contracts:** \`TokenGenerator\`, \`TokenValidator\` in \`src/data/contracts\`
- **Adapter:** \`JwtAdapter\` in \`src/infra/cryptography/jwt-adapter.ts\`

### Environment

Add to \`.env\` (see \`.env.example\`):

- \`JWT_SECRET\` — required for signing and verification (use a long random value in production)
- \`JWT_EXPIRES_IN\` — default expiry passed to \`jwt.sign\` (e.g. \`1d\`, \`8h\`)

### Usage sketch

\`\`\`typescript
import { JwtAdapter } from '@infra/cryptography/jwt-adapter';

const jwtAdapter = new JwtAdapter({
  secret: process.env.JWT_SECRET ?? 'dev-only',
  defaultExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
});

const token = jwtAdapter.sign({ sub: 'user-id' });
const payload = jwtAdapter.verify(token);
\`\`\`
`;

export async function runInstallAuth(options: { cwd: string }): Promise<{ skipped: boolean }> {
  const cwd = path.resolve(options.cwd);
  await assertClearchProject(cwd);

  const jwtPath = path.join(cwd, 'src/infra/cryptography/jwt-adapter.ts');
  if (await pathExists(jwtPath)) {
    await updatePackageJson(cwd, {
      dependencies: { jsonwebtoken: '^9.0.2' },
      devDependencies: { '@types/jsonwebtoken': '^9.0.7' },
    });
    const envPath = path.join(cwd, '.env.example');
    const envContent = await readFile(envPath, 'utf8');
    await writeFile(
      envPath,
      mergeEnvExample(
        envContent,
        [
          { key: 'JWT_SECRET', value: 'your-secret' },
          { key: 'JWT_EXPIRES_IN', value: '1d' },
        ],
        { groupComment: '# clearch: jwt' }
      ),
      'utf8'
    );
    return { skipped: true };
  }

  const templateRoot = getGeneratorsRoot();
  await copyTemplateDir({
    templateRoot,
    relativeDir: path.join('install-auth', 'files'),
    outputDir: cwd,
    vars: {} as TemplateVars,
  });

  const contractsIndex = path.join(cwd, 'src/data/contracts/index.ts');
  await ensureExportLine(contractsIndex, "export * from './token-generator';");
  await ensureExportLine(contractsIndex, "export * from './token-validator';");
  await ensureCryptographyExport(cwd, 'jwt-adapter');

  await updatePackageJson(cwd, {
    dependencies: { jsonwebtoken: '^9.0.2' },
    devDependencies: { '@types/jsonwebtoken': '^9.0.7' },
  });

  const envPath = path.join(cwd, '.env.example');
  const envContent = await readFile(envPath, 'utf8');
  await writeFile(
    envPath,
    mergeEnvExample(
      envContent,
      [
        { key: 'JWT_SECRET', value: 'your-secret' },
        { key: 'JWT_EXPIRES_IN', value: '1d' },
      ],
      { groupComment: '# clearch: jwt' }
    ),
    'utf8'
  );

  const readmePath = path.join(cwd, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  await writeFile(readmePath, appendReadmeSection(readme, README_MARKER, README_SECTION), 'utf8');

  runNpmInstall(cwd);
  return { skipped: false };
}
