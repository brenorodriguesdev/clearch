#!/usr/bin/env node
import { Command } from 'commander';
import * as path from 'node:path';
import inquirer from 'inquirer';
import {
  assertClearchProject,
  runGenerateUsecase,
  runInitApi,
  runInitInfra,
  runInitNxWorkspace,
  runInstallAuth,
  runInstallDb,
  runInstallGrpc,
  runInstallHash,
  runInstallHttp,
  runInstallMcp,
  runInstallMessaging,
  type InstallDbProvider,
  type InstallMessagingQueueProvider,
  type InfraProvider,
} from '@clearch/plugin';

const program = new Command();

program
  .name('clearch')
  .description('Scaffold Node.js + TypeScript API skeleton; add HTTP/gRPC/MCP with clearch install')
  .version('0.1.0');

program
  .command('init')
  .description('Create project skeleton OR initialize infrastructure (init infra)')
  .argument('<project-name-or-infra>', 'kebab-case project folder name, or "infra" to initialize infrastructure')
  .option('-o, --output <dir>', 'directory to create the project in (ignored for "infra")', process.cwd())
  .action(async (projectNameOrInfra: string, opts: { output: string }) => {
    try {
      // Special case: init infra
      if (projectNameOrInfra === 'infra') {
        const cwd = path.resolve(process.cwd());

        // Guard: verify this is a clearch project BEFORE showing prompt
        assertClearchProject(cwd);

        const answers = await inquirer.prompt<{ provider?: InfraProvider }>([
          {
            type: 'list',
            name: 'provider',
            message: 'Which infra tool do you want?',
            choices: [
              { name: 'Terraform', value: 'terraform' },
              { name: 'AWS CDK (TypeScript)', value: 'cdk' },
            ],
          },
        ]);
        if (!answers || !answers.provider) {
          console.log('[clearch] cancelled.');
          return;
        }
        console.log(`[clearch] initializing infrastructure with ${answers.provider} in ${cwd}`);
        const { skipped } = await runInitInfra({ cwd, provider: answers.provider });
        if (skipped) {
          console.log(`[clearch] infrastructure already initialized with ${answers.provider}`);
          return;
        }
        console.log('[clearch] infrastructure initialized.');
        console.log('[clearch] next steps:');
        console.log('  npm run aws:login      # authenticate with AWS');
        if (answers.provider === 'terraform') {
          console.log('  npm run infra:init     # initialize terraform');
          console.log('  npm run infra:plan     # plan infrastructure changes');
          console.log('  npm run infra:apply    # apply infrastructure changes');
        } else {
          console.log('  npm run infra:bootstrap  # bootstrap CDK (one-time per account)');
          console.log('  npm run infra:deploy     # deploy infrastructure');
        }
        return;
      }

      // Normal case: init project
      const out = path.resolve(opts.output);

      // Ask if user wants Nx
      const nxPrompt = await inquirer.prompt<{ useNx: boolean }>([
        {
          type: 'confirm',
          name: 'useNx',
          message: 'Use Nx workspace?',
          default: false,
        },
      ]);

      if (nxPrompt.useNx) {
        await runInitNxWorkspace({ cwd: out, projectName: projectNameOrInfra });
      } else {
        console.log(`[clearch] initializing "${projectNameOrInfra}" in ${out}`);
        await runInitApi({ projectName: projectNameOrInfra, outputDir: out });
        const created = path.join(out, projectNameOrInfra);
        console.log(`[clearch] created: ${created}`);
        console.log('[clearch] next steps:');
        console.log(`  cd ${path.join(projectNameOrInfra)}`);
        console.log('  npm install');
        console.log('  npm run build');
        console.log('  ca init infra     # add infrastructure (optional)');
        console.log('  # ca install http | grpc | mcp   # transports');
        console.log('  # ca install auth | hash | db | messaging');
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'isTtyError' in error) {
        console.error('[clearch] Prompt could not be rendered in this environment.');
        process.exitCode = 1;
        return;
      }
      console.error(`[clearch] ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

const install = program.command('install').description('Add optional modules to a clearch API project');

install
  .command('http')
  .description('Add Express server, HTTP contracts, adaptRouter, and response helpers')
  .option('-c, --cwd <dir>', 'clearch project root', process.cwd())
  .action(async (opts: { cwd: string }) => {
    try {
      const cwd = path.resolve(opts.cwd);
      console.log(`[clearch] installing http in ${cwd}`);
      const { skipped } = await runInstallHttp({ cwd });
      if (skipped) {
        console.log('[clearch] HTTP stack already present; merged missing package.json entries.');
      } else {
        console.log('[clearch] HTTP stack installed.');
      }
      console.log('[clearch] next steps:');
      console.log('  npm install   # if dependencies changed');
      console.log('  npm run dev');
    } catch (error) {
      console.error(`[clearch] ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

install
  .command('grpc')
  .description('Add gRPC contracts and no-op bootstrap (does not install @grpc/grpc-js)')
  .option('-c, --cwd <dir>', 'clearch project root', process.cwd())
  .action(async (opts: { cwd: string }) => {
    try {
      const cwd = path.resolve(opts.cwd);
      console.log(`[clearch] installing grpc stubs in ${cwd}`);
      const { skipped } = await runInstallGrpc({ cwd });
      if (skipped) {
        console.log('[clearch] gRPC stubs already present; server.ts transport hooks refreshed if needed.');
      } else {
        console.log('[clearch] gRPC stubs installed.');
      }
    } catch (error) {
      console.error(`[clearch] ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

install
  .command('mcp')
  .description('Add MCP tool-handler contract and no-op bootstrap (does not install an MCP SDK)')
  .option('-c, --cwd <dir>', 'clearch project root', process.cwd())
  .action(async (opts: { cwd: string }) => {
    try {
      const cwd = path.resolve(opts.cwd);
      console.log(`[clearch] installing mcp stubs in ${cwd}`);
      const { skipped } = await runInstallMcp({ cwd });
      if (skipped) {
        console.log('[clearch] MCP stubs already present; server.ts transport hooks refreshed if needed.');
      } else {
        console.log('[clearch] MCP stubs installed.');
      }
    } catch (error) {
      console.error(`[clearch] ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

install
  .command('auth')
  .description('Add JWT sign/verify contracts and JwtAdapter')
  .option('-c, --cwd <dir>', 'clearch project root', process.cwd())
  .action(async (opts: { cwd: string }) => {
    try {
      const cwd = path.resolve(opts.cwd);
      console.log(`[clearch] installing auth in ${cwd}`);
      const { skipped } = await runInstallAuth({ cwd });
      if (skipped) {
        console.log('[clearch] auth already present; merged missing package.json / .env.example entries only.');
      } else {
        console.log('[clearch] auth installed.');
      }
      console.log('[clearch] next steps:');
      console.log('  - Set JWT_SECRET (and optional JWT_EXPIRES_IN) in .env');
      console.log('  - Use JwtAdapter from src/infra/cryptography/jwt-adapter.ts');
    } catch (error) {
      console.error(`[clearch] ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

install
  .command('hash')
  .description('Add Hasher contract and BcryptHasher adapter')
  .option('-c, --cwd <dir>', 'clearch project root', process.cwd())
  .action(async (opts: { cwd: string }) => {
    try {
      const cwd = path.resolve(opts.cwd);
      console.log(`[clearch] installing hash in ${cwd}`);
      const { skipped } = await runInstallHash({ cwd });
      if (skipped) {
        console.log('[clearch] hash already present; merged missing package.json entries only.');
      } else {
        console.log('[clearch] hash installed.');
      }
      console.log('[clearch] next steps:');
      console.log('  - Use BcryptHasher from src/infra/cryptography/bcrypt-adapter.ts');
    } catch (error) {
      console.error(`[clearch] ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

install
  .command('db')
  .description('Add PostgreSQL (TypeORM) or MongoDB (Mongoose) — interactive')
  .option('-c, --cwd <dir>', 'clearch project root', process.cwd())
  .action(async (opts: { cwd: string }) => {
    try {
      const cwd = path.resolve(opts.cwd);
      const answers = await inquirer.prompt<{ provider?: InstallDbProvider }>([
        {
          type: 'list',
          name: 'provider',
          message: 'Which database do you want?',
          choices: [
            { name: 'PostgreSQL (TypeORM)', value: 'postgres' },
            { name: 'MongoDB (Mongoose)', value: 'mongodb' },
          ],
        },
      ]);
      if (!answers || !answers.provider) {
        console.log('[clearch] cancelled.');
        return;
      }
      console.log(`[clearch] installing ${answers.provider} in ${cwd}`);
      const { skipped } = await runInstallDb({ cwd, provider: answers.provider });
      if (skipped) {
        console.log(
          '[clearch] database support already present; left docker-compose.yml, .env.example, and package.json unchanged (no duplicates).'
        );
        return;
      }
      console.log('[clearch] database support installed.');
      console.log('[clearch] next steps:');
      console.log('  cp .env.example .env   # if you have not already');
      console.log('  npm run infra          # start database stack');
      console.log('  npm run dev');
    } catch (error) {
      if (error && typeof error === 'object' && 'isTtyError' in error) {
        console.error('[clearch] Prompt could not be rendered in this environment.');
        process.exitCode = 1;
        return;
      }
      console.error(`[clearch] ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

install
  .command('messaging')
  .description('Add queue contracts, providers, and example inventory flow — requires clearch install http — interactive')
  .option('-c, --cwd <dir>', 'clearch project root', process.cwd())
  .action(async (opts: { cwd: string }) => {
    try {
      const cwd = path.resolve(opts.cwd);
      const step1 = await inquirer.prompt<{ primitive?: 'queue' | 'stream' }>([
        {
          type: 'list',
          name: 'primitive',
          message: 'Which messaging primitive do you want to install?',
          choices: [
            { name: 'Queue (publish / subscribe)', value: 'queue' },
            { name: 'Stream / topic (Kafka, Kinesis, …) — not available yet', value: 'stream' },
          ],
        },
      ]);
      if (!step1 || !step1.primitive) {
        console.log('[clearch] cancelled.');
        return;
      }
      if (step1.primitive === 'stream') {
        console.log(
          '[clearch] Stream/topic installers are not available yet. Use queues for now, or add streams manually.'
        );
        return;
      }
      const step2 = await inquirer.prompt<{ provider?: InstallMessagingQueueProvider }>([
        {
          type: 'list',
          name: 'provider',
          message: 'Which queue provider should this project use?',
          choices: [
            { name: 'Memory (in-process, best for dev/tests)', value: 'memory' },
            { name: 'RabbitMQ (broker + optional Docker compose)', value: 'rabbitmq' },
            { name: 'Amazon SQS (AWS SDK scaffold)', value: 'sqs' },
          ],
        },
      ]);
      if (!step2 || !step2.provider) {
        console.log('[clearch] cancelled.');
        return;
      }
      console.log(`[clearch] installing queue messaging (${step2.provider}) in ${cwd}`);
      const { skipped } = await runInstallMessaging({ cwd, queueProvider: step2.provider });
      if (skipped) {
        console.log(
          '[clearch] messaging queues already present; merged missing env / package.json / compose entries only.'
        );
      } else {
        console.log('[clearch] messaging installed.');
      }
      console.log('[clearch] next steps:');
      console.log('  - Set QUEUE_PROVIDER in .env if you change providers');
      if (step2.provider === 'rabbitmq') {
        console.log('  - npm run infra:queue   # optional: local RabbitMQ');
      }
      if (step2.provider === 'sqs') {
        console.log('  - Configure SQS_QUEUE_URLS and AWS credentials for SQS');
      }
      console.log('  - npm test   # includes memory queue example test');
    } catch (error) {
      if (error && typeof error === 'object' && 'isTtyError' in error) {
        console.error('[clearch] Prompt could not be rendered in this environment.');
        process.exitCode = 1;
        return;
      }
      console.error(`[clearch] ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

const generate = program.command('generate').description('Generators for clearch projects');

generate
  .command('usecase')
  .description('Add a new vertical slice (controllers, services, factories, etc.)')
  .argument('<name>', 'kebab-case use case name (example: create-user)')
  .option('-c, --cwd <dir>', 'clearch project root', process.cwd())
  .action(async (name: string, opts: { cwd: string }) => {
    try {
      const cwd = path.resolve(opts.cwd);
      console.log(`[clearch] generating use case "${name}" in ${cwd}`);
      const { written, skipped } = await runGenerateUsecase({ useCaseKebab: name, cwd });
      if (written.length) {
        console.log('[clearch] wrote:');
        for (const file of written) {
          console.log(`  - ${file}`);
        }
      }
      if (skipped.length) {
        console.log('[clearch] skipped (already exists):');
        for (const file of skipped) {
          console.log(`  - ${file}`);
        }
      }
      console.log('[clearch] next steps:');
      console.log('  - Register a route in src/main/routes using adaptRouter(...)');
      console.log('  - Implement TODOs in the generated service (add contracts/repos in data/ if you need them)');
      console.log('  - Run npm run build to verify TypeScript');
    } catch (error) {
      console.error(`[clearch] ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);
