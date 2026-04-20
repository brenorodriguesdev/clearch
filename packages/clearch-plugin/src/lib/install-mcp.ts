import * as path from 'node:path';
import { assertClearchProject } from './project-guard';
import { copyTemplateDir, type TemplateVars } from './template';
import { getGeneratorsRoot } from './paths';
import { pathExists, readFile, writeFile } from './fs-utils';
import { ensureExportLine } from './patch-exports';
import { appendReadmeSection } from './readme-append';
import { ensureMcpBootstrapInServer } from './patch-server-transports';

const README_MARKER = '<!-- clearch:module:mcp -->';

const README_SECTION = `## MCP (clearch install mcp)

- **Contracts:** \`McpToolHandler\` and related types in \`src/presentation/contracts/mcp-tool-handler.ts\`
- **Bootstrap:** \`bootstrapMcpTransport\` in \`src/main/mcp/\` (no-op until you add an MCP SDK)
- **Adapter placeholder:** \`src/main/adapters/mcp/mcp-runtime-placeholder.ts\`

If you run this **before** \`clearch install http\`, run \`clearch install http\` afterward (or re-run this) so \`server.ts\` picks up transport bootstraps.
`;

export async function runInstallMcp(options: { cwd: string }): Promise<{ skipped: boolean }> {
  const cwd = path.resolve(options.cwd);
  await assertClearchProject(cwd);

  const marker = path.join(cwd, 'src/main/mcp/bootstrap-mcp-transport.ts');
  if (await pathExists(marker)) {
    await ensureMcpBootstrapInServer(cwd);
    return { skipped: true };
  }

  const templateRoot = getGeneratorsRoot();
  await copyTemplateDir({
    templateRoot,
    relativeDir: path.join('install-mcp', 'files'),
    outputDir: cwd,
    vars: {} as TemplateVars,
  });

  const contractsIndex = path.join(cwd, 'src/presentation/contracts/index.ts');
  await ensureExportLine(contractsIndex, "export * from './mcp-tool-handler';", {
    header: '/* presentation contracts */',
  });

  await ensureMcpBootstrapInServer(cwd);

  const readmePath = path.join(cwd, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  await writeFile(readmePath, appendReadmeSection(readme, README_MARKER, README_SECTION), 'utf8');

  return { skipped: false };
}
