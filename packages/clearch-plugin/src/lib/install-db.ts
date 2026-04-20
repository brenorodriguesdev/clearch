import * as path from 'node:path';
import { unlink } from 'node:fs/promises';
import { assertClearchProject } from './project-guard';
import { copyTemplateDir, renderTemplate, type TemplateVars } from './template';
import { getGeneratorsRoot } from './paths';
import { pathExists, readFile, writeFile } from './fs-utils';
import { readProjectContext } from './project-context';
import { updatePackageJson } from './update-package-json';
import { mergeTsconfigCompilerOptions } from './merge-tsconfig';
import { runNpmInstall } from './run-npm-install';
import { appendReadmeSection } from './readme-append';
import { mergeDockerCompose, extractComposeServicesAndVolumes } from './update-docker-compose';
import { mergeEnvExample, type EnvLineSpec } from './update-env-example';

export type InstallDbProvider = 'postgres' | 'mongodb';

const README_MARKER_POSTGRES = '<!-- clearch:module:db:postgres -->';
const README_MARKER_MONGODB = '<!-- clearch:module:db:mongodb -->';

const README_POSTGRES = `## PostgreSQL + TypeORM (clearch install db)

**Database:** PostgreSQL (port **5432**)

### Local workflow

\`\`\`bash
cp .env.example .env
npm install
npm run infra    # starts PostgreSQL + app in Docker (or DB only if you adjust compose)
npm run dev
\`\`\`

### Infra commands

| Command | Description |
|---|---|
| \`npm run infra\` | Start containers (detached) |
| \`npm run infra:down\` | Stop containers |
| \`npm run infra:logs\` | Stream container logs |
| \`npm run infra:reset\` | Stop + delete volumes |

### Ports

| Service | Port |
|---|---|
| API | 3000 |
| PostgreSQL | 5432 |

### Notes

- \`src/infra/repositories\` is scaffolded for **TypeORM**; add entities and repositories as you grow the domain.
- Development uses \`synchronize: true\` on the scaffolded data source; add migrations for production as you grow.
`;

const README_MONGODB = `## MongoDB + Mongoose (clearch install db)

**Database:** MongoDB (port **27017**)

### Local workflow

\`\`\`bash
cp .env.example .env
npm install
npm run infra
npm run dev
\`\`\`

### Infra commands

| Command | Description |
|---|---|
| \`npm run infra\` | Start containers (detached) |
| \`npm run infra:down\` | Stop containers |
| \`npm run infra:logs\` | Stream container logs |
| \`npm run infra:reset\` | Stop + delete volumes |

### Ports

| Service | Port |
|---|---|
| API | 3000 |
| MongoDB | 27017 |

### Notes

- \`MONGO_URL\` is required (see \`.env.example\`).
- \`src/infra/repositories\` is scaffolded for **Mongoose**; add models and repositories as you grow the domain.
`;

function postgresEnvSpecs(): EnvLineSpec[] {
  return [
    { key: 'DB_CLIENT', value: 'postgres', replaceOnlyIfValueIn: ['none'] },
    { key: 'DB_HOST', value: 'localhost' },
    { key: 'DB_PORT', value: '5432' },
    { key: 'DB_NAME', value: 'app_db' },
    { key: 'DB_USER', value: 'postgres' },
    { key: 'DB_PASSWORD', value: 'postgres' },
  ];
}

function mongoEnvSpecs(): EnvLineSpec[] {
  return [
    { key: 'DB_CLIENT', value: 'mongodb', replaceOnlyIfValueIn: ['none'] },
    { key: 'DB_HOST', value: 'localhost' },
    { key: 'DB_PORT', value: '27017' },
    { key: 'DB_NAME', value: 'app_db' },
    { key: 'MONGO_URL', value: 'mongodb://localhost:27017/app_db' },
  ];
}

export async function runInstallDb(options: {
  cwd: string;
  provider: InstallDbProvider;
}): Promise<{ skipped: boolean }> {
  const cwd = path.resolve(options.cwd);
  await assertClearchProject(cwd);

  const typeormInstalled = await pathExists(path.join(cwd, 'src/infra/db/typeorm/data-source.ts'));
  const mongoInstalled = await pathExists(path.join(cwd, 'src/infra/db/mongoose/connection.ts'));
  if (typeormInstalled || mongoInstalled) {
    return { skipped: true };
  }

  const ctx = await readProjectContext(cwd);
  const vars: TemplateVars = {
    PROJECT_NAME: ctx.projectNameKebab,
    PROJECT_NAME_PASCAL: ctx.projectNamePascal,
    PROJECT_NAME_CAMEL: ctx.projectNameCamel,
  };

  const templateRoot = getGeneratorsRoot();
  const relativeSrc =
    options.provider === 'postgres'
      ? path.join('install-db', 'postgres', 'src')
      : path.join('install-db', 'mongodb', 'src');

  const sourceDir = path.join(templateRoot, relativeSrc);
  if (!(await pathExists(sourceDir))) {
    throw new Error(`Missing install-db templates: ${relativeSrc}`);
  }

  await copyTemplateDir({
    templateRoot,
    relativeDir: relativeSrc,
    outputDir: path.join(cwd, 'src'),
    vars,
  });

  const memoryRepo = path.join(cwd, 'src/infra/repositories/example-repository-memory.ts');
  if (await pathExists(memoryRepo)) {
    await unlink(memoryRepo);
  }

  if (options.provider === 'postgres') {
    await mergeTsconfigCompilerOptions(cwd, {
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    });
    await updatePackageJson(cwd, {
      dependencies: {
        'reflect-metadata': '^0.2.2',
        typeorm: '^0.3.20',
        pg: '^8.13.1',
      },
    });
  } else {
    await updatePackageJson(cwd, {
      dependencies: { mongoose: '^8.9.5' },
    });
  }

  const envPath = path.join(cwd, '.env.example');
  const prevEnv = await readFile(envPath, 'utf8');
  const envSpecs = options.provider === 'postgres' ? postgresEnvSpecs() : mongoEnvSpecs();
  await writeFile(
    envPath,
    mergeEnvExample(prevEnv, envSpecs, {
      groupComment: `# clearch: ${options.provider}`,
    }),
    'utf8'
  );

  const infraDir = path.join(templateRoot, 'init-api', 'infra');
  const composeSrc = path.join(
    infraDir,
    options.provider === 'postgres' ? 'docker-compose.postgres.yml' : 'docker-compose.mongodb.yml'
  );
  let composeRaw = await readFile(composeSrc, 'utf8');
  composeRaw = renderTemplate(composeRaw, vars);

  const composeDest = path.join(cwd, 'docker-compose.yml');
  let existingCompose = '';
  if (await pathExists(composeDest)) {
    existingCompose = await readFile(composeDest, 'utf8');
  }

  const { services, volumes } =
    options.provider === 'postgres'
      ? extractComposeServicesAndVolumes(composeRaw, ['postgres'], ['postgres_data'])
      : extractComposeServicesAndVolumes(composeRaw, ['mongodb'], ['mongodb_data']);

  await writeFile(composeDest, mergeDockerCompose(existingCompose, { services, volumes }), 'utf8');

  const readmePath = path.join(cwd, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  const marker =
    options.provider === 'postgres' ? README_MARKER_POSTGRES : README_MARKER_MONGODB;
  const section = options.provider === 'postgres' ? README_POSTGRES : README_MONGODB;
  await writeFile(readmePath, appendReadmeSection(readme, marker, section), 'utf8');

  runNpmInstall(cwd);
  return { skipped: false };
}
