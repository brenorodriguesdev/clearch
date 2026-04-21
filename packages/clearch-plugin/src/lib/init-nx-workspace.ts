import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { runInitApi } from './init-api';
import { runNpmInstall } from './run-npm-install';

export type InitNxWorkspaceOptions = {
  cwd: string;
  projectName: string;
};

export async function runInitNxWorkspace(options: InitNxWorkspaceOptions): Promise<void> {
  const { cwd, projectName } = options;

  // Step 1: Create base API project with runInitApi
  console.log(`[clearch] initializing "${projectName}" with Nx workspace...`);
  await runInitApi({ projectName, outputDir: cwd });

  const projectDir = path.join(cwd, projectName);

  // Step 2: Install Nx dependencies (npm install will use package.json to install @nx/devkit)
  console.log('[clearch] installing Nx dependencies...');
  runNpmInstall(projectDir);

  // Step 3: Create nx.json at project root
  const nxJson = {
    $schema: './node_modules/nx/schemas/nx-schema.json',
    analytics: false,
    namedInputs: {
      default: ['{projectRoot}/**/*', 'sharedGlobals'],
      production: ['default'],
      sharedGlobals: [],
    },
    plugins: [
      {
        plugin: '@nx/js/typescript',
        options: {
          typecheck: { targetName: 'typecheck' },
          build: {
            targetName: 'build',
            configName: 'tsconfig.lib.json',
            buildDepsName: 'build-deps',
            watchDepsName: 'watch-deps',
          },
        },
      },
      {
        plugin: 'clearch-plugin',
        options: {},
      },
    ],
  };

  await fs.writeFile(path.join(projectDir, 'nx.json'), JSON.stringify(nxJson, null, 2) + '\n', 'utf8');

  // Step 4: Create workspace.json
  const workspaceJson = {
    version: 2,
    projects: {
      [projectName]: 'src',
    },
  };

  await fs.writeFile(
    path.join(projectDir, 'workspace.json'),
    JSON.stringify(workspaceJson, null, 2) + '\n',
    'utf8'
  );

  // Step 5: Create project.json for the app
  const projectJson = {
    name: projectName,
    $schema: '../node_modules/nx/schemas/project-schema.json',
    projectType: 'application',
    sourceRoot: 'src',
    targets: {
      build: {
        executor: '@nx/js:tsc',
        outputs: ['{options.outputPath}'],
        options: {
          outputPath: `dist/${projectName}`,
          main: 'src/skeleton.ts',
          tsConfig: 'tsconfig.json',
          assets: [],
        },
      },
      serve: {
        executor: '@nx/js:node',
        dependsOn: ['build'],
        options: {
          buildTarget: `${projectName}:build`,
          runInBand: true,
        },
      },
    },
    tags: [],
  };

  await fs.writeFile(
    path.join(projectDir, 'project.json'),
    JSON.stringify(projectJson, null, 2) + '\n',
    'utf8'
  );

  // Step 6: Output next steps
  console.log('[clearch] created Nx workspace.');
  console.log('[clearch] next steps:');
  console.log(`  cd ${projectName}`);
  console.log('  npm install');
  console.log('  npm run build');
  console.log('');
  console.log('  # Use clearch commands with Nx:');
  console.log('  nx g ca:usecase create-user');
  console.log('  nx run ' + projectName + ':clearch:install-http');
  console.log('');
  console.log('  # Or use shell shortcuts:');
  console.log('  ca generate usecase create-user');
  console.log('  ca install http');
}
