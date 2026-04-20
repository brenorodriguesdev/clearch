import * as path from 'node:path';
import { assertClearchProject } from './project-guard';
import { copyTemplateDir, type TemplateVars } from './template';
import { getGeneratorsRoot } from './paths';
import { pathExists, readFile, writeFile } from './fs-utils';
import { ensureExportLine } from './patch-exports';
import { appendReadmeSection } from './readme-append';
import { ensureGrpcBootstrapInServer } from './patch-server-transports';

const README_MARKER = '<!-- clearch:module:grpc -->';

const README_SECTION = `## gRPC (clearch install grpc)

- **Contracts:** \`GrpcHandler\`, request/response types in \`src/presentation/contracts/grpc-handler.ts\`
- **Bootstrap:** \`bootstrapGrpcTransport\` in \`src/main/grpc/\` (no-op until you add @grpc/grpc-js and protos)
- **Adapter placeholder:** \`src/main/adapters/grpc/grpc-runtime-placeholder.ts\`

If you run this **before** \`clearch install http\`, run \`clearch install http\` afterward (or re-run this) so \`server.ts\` picks up transport bootstraps.
`;

export async function runInstallGrpc(options: { cwd: string }): Promise<{ skipped: boolean }> {
  const cwd = path.resolve(options.cwd);
  await assertClearchProject(cwd);

  const marker = path.join(cwd, 'src/main/grpc/bootstrap-grpc-transport.ts');
  if (await pathExists(marker)) {
    await ensureGrpcBootstrapInServer(cwd);
    return { skipped: true };
  }

  const templateRoot = getGeneratorsRoot();
  await copyTemplateDir({
    templateRoot,
    relativeDir: path.join('install-grpc', 'files'),
    outputDir: cwd,
    vars: {} as TemplateVars,
  });

  const contractsIndex = path.join(cwd, 'src/presentation/contracts/index.ts');
  await ensureExportLine(contractsIndex, "export * from './grpc-handler';", {
    header: '/* presentation contracts */',
  });

  await ensureGrpcBootstrapInServer(cwd);

  const readmePath = path.join(cwd, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  await writeFile(readmePath, appendReadmeSection(readme, README_MARKER, README_SECTION), 'utf8');

  return { skipped: false };
}
