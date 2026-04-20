import * as path from 'node:path';
import { unlink } from 'node:fs/promises';
import { assertClearchProject } from './project-guard';
import { copyTemplateDir, type TemplateVars } from './template';
import { getGeneratorsRoot } from './paths';
import { pathExists, readFile, writeFile } from './fs-utils';
import { readProjectContext } from './project-context';
import { updatePackageJson } from './update-package-json';
import { mergeEnvExample } from './update-env-example';
import { ensureExportLine } from './patch-exports';
import { runNpmInstall } from './run-npm-install';
import { appendReadmeSection } from './readme-append';
import { ensureGrpcBootstrapInServer, ensureMcpBootstrapInServer } from './patch-server-transports';

const README_MARKER = '<!-- clearch:module:http -->';

const README_SECTION = `## HTTP (clearch install http)

- **Packages:** \`express\`, \`dotenv\`, \`@types/express\`
- **Entry:** \`src/main/server.ts\`, \`createApp\` in \`src/main/app.ts\`
- **Contracts:** \`Controller\`, \`HttpRequest\`, \`HttpResponse\` in \`src/presentation/contracts\`
- **Adapter:** \`adaptRouter\` in \`src/main/adapters/http/express-http-adapter.ts\`
- **Routes:** \`registerHttpRoutes\` in \`src/main/routes/index.ts\`

Add gRPC or MCP bootstraps with \`clearch install grpc\` / \`clearch install mcp\` (no extra runtime deps in the default stubs).
`;

export async function runInstallHttp(options: { cwd: string }): Promise<{ skipped: boolean }> {
  const cwd = path.resolve(options.cwd);
  await assertClearchProject(cwd);

  const appPath = path.join(cwd, 'src/main/app.ts');
  if (await pathExists(appPath)) {
    await updatePackageJson(cwd, {
      dependencies: { dotenv: '^16.4.5', express: '^4.21.2' },
      devDependencies: { '@types/express': '^4.17.21' },
    });
    if (await pathExists(path.join(cwd, 'src/main/grpc/bootstrap-grpc-transport.ts'))) {
      await ensureGrpcBootstrapInServer(cwd);
    }
    if (await pathExists(path.join(cwd, 'src/main/mcp/bootstrap-mcp-transport.ts'))) {
      await ensureMcpBootstrapInServer(cwd);
    }
    return { skipped: true };
  }

  const ctx = await readProjectContext(cwd);
  const vars: TemplateVars = {
    PROJECT_NAME: ctx.projectNameKebab,
    PROJECT_NAME_PASCAL: ctx.projectNamePascal,
    PROJECT_NAME_CAMEL: ctx.projectNameCamel,
  };

  const templateRoot = getGeneratorsRoot();
  await copyTemplateDir({
    templateRoot,
    relativeDir: path.join('install-http', 'files'),
    outputDir: cwd,
    vars,
  });

  const contractsIndex = path.join(cwd, 'src/presentation/contracts/index.ts');
  await ensureExportLine(contractsIndex, "export * from './controller';", {
    header: '/* presentation contracts — extended by clearch install grpc | mcp */',
  });
  await ensureExportLine(contractsIndex, "export * from './http';");

  const skeletonPath = path.join(cwd, 'src/skeleton.ts');
  if (await pathExists(skeletonPath)) {
    await unlink(skeletonPath);
  }

  await updatePackageJson(cwd, {
    dependencies: { dotenv: '^16.4.5', express: '^4.21.2' },
    devDependencies: { '@types/express': '^4.17.21' },
    scriptsForce: {
      dev: 'tsx watch src/main/server.ts',
      'dev:debug': 'tsx --inspect-brk src/main/server.ts',
      start: 'node -r ./path-register.cjs dist/main/server.js',
    },
  });

  const envPath = path.join(cwd, '.env.example');
  if (await pathExists(envPath)) {
    const prev = await readFile(envPath, 'utf8');
    await writeFile(
      envPath,
      mergeEnvExample(prev, [{ key: 'PORT', value: '3000' }], { groupComment: '# clearch: http' }),
      'utf8'
    );
  }

  const readmePath = path.join(cwd, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  await writeFile(readmePath, appendReadmeSection(readme, README_MARKER, README_SECTION), 'utf8');

  if (await pathExists(path.join(cwd, 'src/main/grpc/bootstrap-grpc-transport.ts'))) {
    await ensureGrpcBootstrapInServer(cwd);
  }
  if (await pathExists(path.join(cwd, 'src/main/mcp/bootstrap-mcp-transport.ts'))) {
    await ensureMcpBootstrapInServer(cwd);
  }

  await runNpmInstall(cwd);
  return { skipped: false };
}
