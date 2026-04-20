import * as path from 'node:path';
import { assertClearchProject } from './project-guard';
import { copyTemplateDir, type TemplateVars } from './template';
import { getGeneratorsRoot } from './paths';
import { ensureDir, pathExists, readFile, writeFile } from './fs-utils';
import { updatePackageJson } from './update-package-json';
import { appendReadmeSection } from './readme-append';
import { mergeEnvExample } from './update-env-example';
import { ensureExportLine } from './patch-exports';
import { runNpmInstall } from './run-npm-install';
import { mergeDockerCompose, extractComposeServicesAndVolumes } from './update-docker-compose';
import type { EnvLineSpec } from './update-env-example';

export type InstallMessagingQueueProvider = 'memory' | 'rabbitmq' | 'sqs';

const README_MARKER = '<!-- clearch:module:messaging:queue -->';

function buildMakeQueuePublisher(installed: {
  rabbit: boolean;
  sqs: boolean;
}): string {
  const lines: string[] = [];
  lines.push(`import type { QueuePublisher } from '@data/contracts/queue-publisher';`);
  lines.push(`import { getQueueProvider } from '@main/config/queue-provider';`);
  lines.push(
    `import { MemoryQueuePublisher, getSharedMemoryQueueBackend } from '@infra/messaging/queue/memory';`
  );
  if (installed.rabbit) {
    lines.push(
      `import { RabbitMqQueuePublisher } from '@infra/messaging/queue/rabbitmq/rabbitmq-queue-publisher';`
    );
  }
  if (installed.sqs) {
    lines.push(`import { SqsQueuePublisher } from '@infra/messaging/queue/sqs/sqs-queue-publisher';`);
  }
  lines.push('');
  lines.push(`export function makeQueuePublisher(): QueuePublisher {`);
  lines.push(`  switch (getQueueProvider()) {`);
  if (installed.rabbit) {
    lines.push(`    case 'rabbitmq':`);
    lines.push(`      return new RabbitMqQueuePublisher();`);
  } else {
    lines.push(`    case 'rabbitmq':`);
    lines.push(
      `      throw new Error('QUEUE_PROVIDER=rabbitmq but RabbitMQ queue files are not installed. Run clearch install messaging and select RabbitMQ.');`
    );
  }
  if (installed.sqs) {
    lines.push(`    case 'sqs':`);
    lines.push(`      return new SqsQueuePublisher();`);
  } else {
    lines.push(`    case 'sqs':`);
    lines.push(
      `      throw new Error('QUEUE_PROVIDER=sqs but SQS queue files are not installed. Run clearch install messaging and select Amazon SQS.');`
    );
  }
  lines.push(`    case 'memory':`);
  lines.push(`    default:`);
  lines.push(`      return new MemoryQueuePublisher(getSharedMemoryQueueBackend());`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push('');
  return lines.join('\n');
}

function buildMakeQueueConsumer(installed: { rabbit: boolean; sqs: boolean }): string {
  const lines: string[] = [];
  lines.push(`import type { QueueConsumer } from '@data/contracts/queue-consumer';`);
  lines.push(`import { getQueueProvider } from '@main/config/queue-provider';`);
  lines.push(
    `import { MemoryQueueConsumer, getSharedMemoryQueueBackend } from '@infra/messaging/queue/memory';`
  );
  if (installed.rabbit) {
    lines.push(
      `import { RabbitMqQueueConsumer } from '@infra/messaging/queue/rabbitmq/rabbitmq-queue-consumer';`
    );
  }
  if (installed.sqs) {
    lines.push(`import { SqsQueueConsumer } from '@infra/messaging/queue/sqs/sqs-queue-consumer';`);
  }
  lines.push('');
  lines.push(`export function makeQueueConsumer(): QueueConsumer {`);
  lines.push(`  switch (getQueueProvider()) {`);
  if (installed.rabbit) {
    lines.push(`    case 'rabbitmq':`);
    lines.push(`      return new RabbitMqQueueConsumer();`);
  } else {
    lines.push(`    case 'rabbitmq':`);
    lines.push(
      `      throw new Error('QUEUE_PROVIDER=rabbitmq but RabbitMQ queue files are not installed. Run clearch install messaging and select RabbitMQ.');`
    );
  }
  if (installed.sqs) {
    lines.push(`    case 'sqs':`);
    lines.push(`      return new SqsQueueConsumer();`);
  } else {
    lines.push(`    case 'sqs':`);
    lines.push(
      `      throw new Error('QUEUE_PROVIDER=sqs but SQS queue files are not installed. Run clearch install messaging and select Amazon SQS.');`
    );
  }
  lines.push(`    case 'memory':`);
  lines.push(`    default:`);
  lines.push(`      return new MemoryQueueConsumer(getSharedMemoryQueueBackend());`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push('');
  return lines.join('\n');
}

async function patchAppTsForMessaging(cwd: string): Promise<void> {
  const appPath = path.join(cwd, 'src/main/app.ts');
  if (!(await pathExists(appPath))) {
    throw new Error(
      'Missing src/main/app.ts. Install the HTTP stack first: clearch install http'
    );
  }
  let s = await readFile(appPath, 'utf8');
  if (s.includes('bootstrapQueueSubscriptions')) {
    return;
  }
  if (!s.includes('export async function createApp()')) {
    s = s.replace('export function createApp()', 'export async function createApp()');
    if (!s.includes('Promise<Express>')) {
      s = s.replace(
        'export async function createApp()',
        'export async function createApp(): Promise<Express>'
      );
    }
  }
  s = s.replace(
    /import express, \{ type Express \} from 'express';\n/,
    `import express, { type Express } from 'express';\nimport { bootstrapQueueSubscriptions } from '@main/messaging/bootstrap-queue-subscriptions';\n`
  );
  s = s.replace(
    /export async function createApp\(\): Promise<Express> \{\n/,
    `export async function createApp(): Promise<Express> {\n  await bootstrapQueueSubscriptions();\n`
  );
  await writeFile(appPath, s, 'utf8');
}

function readmeSection(provider: InstallMessagingQueueProvider): string {
  const common = `## Queues (clearch install messaging)

### Providers

| Provider | When to use |
|----------|-------------|
| **memory** | Local development and automated tests — no broker or cloud credentials. |
| **rabbitmq** | Production-style broker on your network or Docker. |
| **sqs** | AWS-managed queues (configure \`SQS_QUEUE_URLS\` and IAM). |

Set \`QUEUE_PROVIDER=memory\` | \`rabbitmq\` | \`sqs\` in \`.env\`.

### Example flow

Queue \`inventory-adjustment-requested\`: \`ProcessInventoryAdjustmentRequestService\` runs when a message is consumed. With **memory**, publish/subscribe runs in-process; messages are buffered and delivered on the next event-loop turns (not a synchronous function call).

### Testing without infra

Use \`MemoryQueueBackend\` / \`MemoryQueuePublisher\` / \`MemoryQueueConsumer\` (see \`tests/inventory-queue.memory.test.ts\`) or set \`QUEUE_PROVIDER=memory\` and call \`makeQueuePublisher()\` / \`makeQueueConsumer()\` in tests.

### Streams / topics

Stream installers (Kafka, Kinesis, …) are separate from **queues** and are not added by this command yet.
`;

  if (provider === 'rabbitmq') {
    return (
      common +
      `
### RabbitMQ

- Start broker: \`npm run infra:queue\` (uses \`docker-compose.queue.yml\`).
- Default URL: \`amqp://localhost:5672\` — override with \`RABBITMQ_URL\`.
`
    );
  }
  if (provider === 'sqs') {
    return (
      common +
      `
### Amazon SQS

- Set \`AWS_REGION\` (or use standard AWS SDK credential chain).
- Set \`SQS_QUEUE_URLS\` to a JSON object mapping logical queue names to queue URLs, e.g. \`{"inventory-adjustment-requested":"https://sqs...."}\`.
- Consumers run a long-poll loop per subscribed queue — run in a dedicated worker process for production.
`
    );
  }
  return (
    common +
    `
### Memory (default)

No extra containers. Safe for CI and local debugging of async handlers.
`
  );
}

async function applyMessagingEnvAndDeps(
  cwd: string,
  options: { queueProvider: InstallMessagingQueueProvider; rabbit: boolean; sqs: boolean }
): Promise<void> {
  const envPath = path.join(cwd, '.env.example');
  const envContent = await readFile(envPath, 'utf8');
  const specs: EnvLineSpec[] = [{ key: 'QUEUE_PROVIDER', value: options.queueProvider }];
  if (options.rabbit) {
    specs.push({ key: 'RABBITMQ_URL', value: 'amqp://localhost:5672' });
  }
  if (options.sqs) {
    specs.push({ key: 'AWS_REGION', value: 'us-east-1' });
    specs.push({
      key: 'SQS_QUEUE_URLS',
      value:
        '{"inventory-adjustment-requested":"https://sqs.us-east-1.amazonaws.com/ACCOUNT/QUEUE_NAME"}',
    });
  }
  await writeFile(
    envPath,
    mergeEnvExample(envContent, specs, { groupComment: '# clearch: queue messaging' }),
    'utf8'
  );

  if (options.rabbit) {
    await updatePackageJson(cwd, {
      dependencies: { amqplib: '^0.10.4' },
      devDependencies: { '@types/amqplib': '^0.10.5' },
      scripts: {
        'infra:queue': 'docker compose -f docker-compose.queue.yml up -d',
        'infra:queue:down': 'docker compose -f docker-compose.queue.yml down',
        'infra:queue:logs': 'docker compose -f docker-compose.queue.yml logs -f',
      },
    });
  } else if (options.sqs) {
    await updatePackageJson(cwd, {
      dependencies: { '@aws-sdk/client-sqs': '^3.699.0' },
    });
  }
}

async function mergeRabbitQueueCompose(cwd: string, templateRoot: string): Promise<void> {
  const composeSrc = path.join(templateRoot, 'install-messaging', 'rabbitmq', 'docker-compose.queue.yml');
  const raw = await readFile(composeSrc, 'utf8');
  const { services } = extractComposeServicesAndVolumes(raw, ['rabbitmq'], []);
  const dest = path.join(cwd, 'docker-compose.queue.yml');
  let existing = '';
  if (await pathExists(dest)) {
    existing = await readFile(dest, 'utf8');
  }
  await writeFile(dest, mergeDockerCompose(existing, { services }), 'utf8');
}

export async function runInstallMessaging(options: {
  cwd: string;
  queueProvider: InstallMessagingQueueProvider;
}): Promise<{ skipped: boolean }> {
  const cwd = path.resolve(options.cwd);
  await assertClearchProject(cwd);

  const marker = path.join(cwd, 'src/data/contracts/queue-publisher.ts');
  const installedRabbit = options.queueProvider === 'rabbitmq';
  const installedSqs = options.queueProvider === 'sqs';
  const templateRoot = getGeneratorsRoot();

  if (await pathExists(marker)) {
    await applyMessagingEnvAndDeps(cwd, {
      queueProvider: options.queueProvider,
      rabbit: installedRabbit,
      sqs: installedSqs,
    });
    if (installedRabbit) {
      await mergeRabbitQueueCompose(cwd, templateRoot);
    }
    return { skipped: true };
  }

  const baseRoot = path.join(templateRoot, 'install-messaging', 'base');
  if (!(await pathExists(baseRoot))) {
    throw new Error('Missing install-messaging templates.');
  }

  await copyTemplateDir({
    templateRoot,
    relativeDir: path.join('install-messaging', 'base'),
    outputDir: cwd,
    vars: {} as TemplateVars,
  });

  if (installedRabbit) {
    await copyTemplateDir({
      templateRoot,
      relativeDir: path.join('install-messaging', 'rabbitmq', 'src'),
      outputDir: path.join(cwd, 'src'),
      vars: {} as TemplateVars,
    });
    await mergeRabbitQueueCompose(cwd, templateRoot);
  }

  if (installedSqs) {
    await copyTemplateDir({
      templateRoot,
      relativeDir: path.join('install-messaging', 'sqs', 'src'),
      outputDir: path.join(cwd, 'src'),
      vars: {} as TemplateVars,
    });
  }

  const factoriesDir = path.join(cwd, 'src/main/factories/messaging');
  await ensureDir(factoriesDir);
  await writeFile(
    path.join(factoriesDir, 'make-queue-publisher.ts'),
    buildMakeQueuePublisher({ rabbit: installedRabbit, sqs: installedSqs }),
    'utf8'
  );
  await writeFile(
    path.join(factoriesDir, 'make-queue-consumer.ts'),
    buildMakeQueueConsumer({ rabbit: installedRabbit, sqs: installedSqs }),
    'utf8'
  );

  const contractsIndex = path.join(cwd, 'src/data/contracts/index.ts');
  await ensureExportLine(contractsIndex, "export * from './queue-message';");
  await ensureExportLine(contractsIndex, "export * from './queue-publisher';");
  await ensureExportLine(contractsIndex, "export * from './queue-consumer';");

  const servicesIndex = path.join(cwd, 'src/data/services/index.ts');
  await ensureExportLine(
    servicesIndex,
    "export * from './process-inventory-adjustment-request';"
  );

  await patchAppTsForMessaging(cwd);

  await applyMessagingEnvAndDeps(cwd, {
    queueProvider: options.queueProvider,
    rabbit: installedRabbit,
    sqs: installedSqs,
  });

  const readmePath = path.join(cwd, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  await writeFile(
    readmePath,
    appendReadmeSection(readme, README_MARKER, readmeSection(options.queueProvider)),
    'utf8'
  );

  runNpmInstall(cwd);
  return { skipped: false };
}
