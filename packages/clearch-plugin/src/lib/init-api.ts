import * as path from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { assertProjectName, toCamelCase, toPascalCase } from './naming';
import { copyTemplateDir, type TemplateVars } from './template';
import { getGeneratorsRoot } from './paths';
import { ensureDir, pathExists, readFile, writeFile } from './fs-utils';

export type InitApiOptions = {
  projectName: string;
  outputDir: string;
};

const INFRA_SECTION_NONE = `## Docker (optional)

The base skeleton ships a minimal **app-only** \`docker-compose.yml\` (no PostgreSQL, MongoDB, RabbitMQ, or Kafka). Build and run:

\`\`\`bash
docker compose up --build
\`\`\`

| Command | Description |
|---|---|
| \`npm run infra\` | Start compose stack (detached) |
| \`npm run infra:down\` | Stop stack |
| \`npm run infra:logs\` | Stream logs |

Running \`clearch install db\` or \`clearch install messaging\` merges additional services into compose when those templates provide them.`;

async function copyInfraFilesNone(outputDir: string): Promise<void> {
  const templateRoot = getGeneratorsRoot();
  const infraDir = path.join(templateRoot, 'init-api', 'infra');

  const dockerfileSrc = path.join(infraDir, 'Dockerfile');
  const dockerfileDest = path.join(outputDir, 'Dockerfile');
  await writeFile(dockerfileDest, await readFile(dockerfileSrc, 'utf8'), 'utf8');

  const dockerignoreSrc = path.join(infraDir, '.dockerignore');
  const dockerignoreDest = path.join(outputDir, '.dockerignore');
  await writeFile(dockerignoreDest, await readFile(dockerignoreSrc, 'utf8'), 'utf8');

  const composeSrc = path.join(infraDir, 'docker-compose.none.yml');
  const composeDest = path.join(outputDir, 'docker-compose.yml');
  await writeFile(composeDest, await readFile(composeSrc, 'utf8'), 'utf8');
}

export async function runInitApi(options: InitApiOptions): Promise<void> {
  const projectName = options.projectName.trim();
  assertProjectName(projectName);

  const target = path.resolve(options.outputDir, projectName);
  if (await pathExists(target)) {
    const fileStat = await stat(target);
    if (fileStat.isDirectory()) {
      const entries = await readdir(target);
      if (entries.length > 0) {
        throw new Error(`Target directory is not empty: ${target}`);
      }
    } else {
      throw new Error(`Path exists and is not a directory: ${target}`);
    }
  }

  await ensureDir(target);

  const projectNamePascal = toPascalCase(projectName);
  const projectNameCamel = toCamelCase(projectName);

  const vars: TemplateVars = {
    PROJECT_NAME: projectName,
    PROJECT_NAME_PASCAL: projectNamePascal,
    PROJECT_NAME_CAMEL: projectNameCamel,
    INFRA_SECTION: INFRA_SECTION_NONE,
  };

  const templateRoot = getGeneratorsRoot();
  await copyTemplateDir({
    templateRoot,
    relativeDir: path.join('init-api', 'files'),
    outputDir: target,
    vars,
  });

  await copyInfraFilesNone(target);
}
