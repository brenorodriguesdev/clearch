# Configuration Reference

## Root package.json
**Location:** `package.json`

```json
{
  "name": "@clearch-workspace/source",
  "version": "0.0.0",
  "license": "MIT",
  "scripts": {
    "build": "nx run-many -t build --projects=clearch-plugin,clearch",
    "build:plugin": "nx build clearch-plugin",
    "build:cli": "nx build clearch",
    "dev:cli": "node packages/clearch/dist/cli.ts",
    "test:cli": "npm run build:cli && node packages/clearch/dist/cli.js",
    "link:cli": "cd packages/clearch && npm link && cd ../../ && echo '✓ clearch linked globally'",
    "unlink:cli": "npm unlink -g clearch && echo '✓ clearch unlinked'"
  },
  "private": true,
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@nx/js": "22.6.4",
    "@swc-node/register": "~1.11.1",
    "@swc/core": "~1.15.5",
    "@swc/helpers": "~0.5.18",
    "nx": "22.6.4",
    "prettier": "~3.6.2",
    "tslib": "^2.3.0",
    "typescript": "~5.9.2"
  },
  "workspaces": [
    "packages/*"
  ]
}
```

### Key Points:
- `build:cli` builds the CLI package (also builds plugin as dependency)
- `test:cli` builds and shows CLI help
- `link:cli` sets up global command
- `unlink:cli` removes global command

---

## CLI Package

### packages/clearch/package.json

```json
{
  "name": "clearch",
  "version": "0.1.0",
  "description": "CLI to scaffold Node.js + TypeScript APIs with adapter-based Express decoupling",
  "license": "MIT",
  "type": "commonjs",
  "bin": {
    "clearch": "./dist/cli.js"
  },
  "files": [
    "dist"
  ],
  "dependencies": {
    "@clearch/plugin": "0.1.0",
    "commander": "^12.1.0"
  }
}
```

### Key Points:
- `"type": "commonjs"` for Node.js compatibility
- `"bin": { "clearch": "./dist/cli.js" }` tells npm where the executable is
- `"files": ["dist"]` means only dist/ is published to npm
- Dependencies: commander for CLI parsing, plugin for generators

---

### packages/clearch/project.json

```json
{
  "name": "clearch",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/clearch/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "outputs": ["{workspaceRoot}/packages/clearch/dist"],
      "dependsOn": ["clearch-plugin:build"],
      "options": {
        "cwd": "packages/clearch",
        "commands": [
          "rm -rf dist tsconfig.tsbuildinfo",
          "tsc -p tsconfig.json"
        ],
        "parallel": false
      }
    }
  },
  "tags": []
}
```

### Key Points:
- `"dependsOn": ["clearch-plugin:build"]` ensures plugin is built first
- Build runs TypeScript compiler from package directory
- Output goes to `packages/clearch/dist`

---

### packages/clearch/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "noUnusedLocals": true,
    "noImplicitReturns": true
  },
  "include": ["src/**/*.ts"]
}
```

### Key Points:
- `"module": "CommonJS"` for Node.js CLI
- `"outDir": "dist"` builds to dist/
- `"rootDir": "src"` compiles from src/
- Strict mode enabled

---

### packages/clearch/src/cli.ts (Entry Point)

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import * as path from 'node:path';
import { runGenerateUsecase, runInitApi } from '@clearch/plugin';

const program = new Command();

program
  .name('clearch')
  .description('Scaffold Node.js + TypeScript APIs with Express isolated behind HTTP adapters')
  .version('0.1.0');

program
  .command('init')
  .description('Create a new API project')
  .argument('<project-name>', 'kebab-case project folder name')
  .option('-o, --output <dir>', 'directory to create the project in', process.cwd())
  .action(async (projectName: string, opts: { output: string }) => {
    try {
      const out = path.resolve(opts.output);
      console.log(`[clearch] initializing "${projectName}" in ${out}`);
      await runInitApi({ projectName, outputDir: out });
      const created = path.join(out, projectName);
      console.log(`[clearch] created: ${created}`);
      console.log('[clearch] next steps:');
      console.log(`  cd ${path.join(projectName)}`);
      console.log('  npm install');
      console.log('  npm run dev');
    } catch (error) {
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
```

### Key Points:
- Shebang `#!/usr/bin/env node` at top
- Imports from `@clearch/plugin` for generators
- Two commands: `init` and `generate usecase`
- Proper error handling
- User-friendly output

---

## Plugin Package

### packages/clearch-plugin/package.json

```json
{
  "name": "@clearch/plugin",
  "version": "0.1.0",
  "type": "commonjs",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "src/generators"
  ],
  "dependencies": {}
}
```

### Key Points:
- Published as scoped package `@clearch/plugin`
- Main entry: `dist/index.js`
- `"files"` includes generators (needed for generation to work)

---

### packages/clearch-plugin/project.json

```json
{
  "name": "clearch-plugin",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/clearch-plugin/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "outputs": ["{workspaceRoot}/packages/clearch-plugin/dist"],
      "options": {
        "cwd": "packages/clearch-plugin",
        "commands": [
          "rm -rf dist tsconfig.tsbuildinfo",
          "tsc -p tsconfig.json",
          "mkdir -p dist/generators && cp -R src/generators/. dist/generators/"
        ],
        "parallel": false
      }
    }
  },
  "tags": []
}
```

### Key Points:
- Copies `src/generators/` to `dist/generators/` so they're available at runtime
- This is critical for the `clearch init` and `clearch generate` commands to work

---

## File Tree Reference

```
template/
├── package.json                       # Root with build scripts
├── CLI_DEVELOPMENT.md                 # This guide
├── CLI_SETUP_SUMMARY.md               # Quick reference
├── CONFIGURATION_REFERENCE.md         # This file
├── README.md
├── packages/
│   ├── clearch/                       # CLI package
│   │   ├── src/
│   │   │   └── cli.ts                 # Entry point (#!/usr/bin/env node)
│   │   ├── dist/
│   │   │   ├── cli.js                 # Executable output
│   │   │   └── cli.d.ts               # Types
│   │   ├── package.json               # bin: { clearch: ./dist/cli.js }
│   │   ├── project.json               # Nx build config
│   │   └── tsconfig.json
│   │
│   └── clearch-plugin/                # Generator package
│       ├── src/
│       │   ├── generators/
│       │   │   └── init-api/
│       │   │       ├── files/         # Template files
│       │   │       └── index.ts       # Generator logic
│       │   └── index.ts               # Plugin exports
│       ├── dist/                      # Compiled + copied generators
│       ├── package.json               # main: ./dist/index.js
│       ├── project.json               # Copies generators to dist/
│       └── tsconfig.json
│
└── node_modules/
    └── (workspace dependencies)
```

---

## Build Output

After `npm run build:cli`:

```
packages/clearch/dist/
├── cli.js                    # ✅ Compiled CLI (starts with #!/usr/bin/env node)
├── cli.d.ts                  # Type definitions
└── cli.js.map                # Source maps

packages/clearch-plugin/dist/
├── index.js                  # Plugin entry
├── index.d.ts
├── generators/
│   └── init-api/
│       ├── files/
│       │   ├── package.json
│       │   ├── tsconfig.json
│       │   └── .clearch.json
│       └── index.js
└── ... (other files)
```

---

## Critical Configuration Points

| Item | Purpose | Value |
|------|---------|-------|
| Shebang in cli.ts | Make CLI executable | `#!/usr/bin/env node` |
| bin field in package.json | npm knows where CLI is | `"clearch": "./dist/cli.js"` |
| module in tsconfig.json | Node.js compatible output | `"CommonJS"` |
| dependsOn in project.json | Build plugin first | `["clearch-plugin:build"]` |
| cp generators in project.json | Generators available at runtime | `cp -R src/generators/. dist/generators/` |
| type: commonjs in package.json | CJS instead of ESM | `"type": "commonjs"` |

---

## Execution Flow

```
User runs: clearch init my-service

↓

npm finds symlink at:
~/.nvm/versions/node/v24.14.0/bin/clearch

↓

Symlink points to:
packages/clearch/dist/cli.js (via npm link)

↓

Node.js runs dist/cli.js:
1. Reads shebang: #!/usr/bin/env node
2. Executes with Node.js
3. Commander.js parses arguments
4. Calls runInitApi() from @clearch/plugin
5. Plugin copies template files to output dir

↓

Project created with all necessary files
```

---

## Development Workflow

```bash
# 1. Edit CLI or generators
nano packages/clearch/src/cli.ts
# or
nano packages/clearch-plugin/src/generators/init-api/index.ts

# 2. Build
npm run build:cli

# 3. Test
clearch init my-test  # Uses latest build (via symlink)

# 4. Commit
git add packages/clearch packages/clearch-plugin
git commit -m "feat: add new command"
```

---

## Commands Cheat Sheet

```bash
# Setup
npm install
npm run build:cli
npm run link:cli

# Testing
clearch --version
clearch --help
clearch init test-project
clearch generate usecase test-feature --cwd test-project

# Development
npm run build:cli  # Rebuild
npm run test:cli   # Build and show help
npm run unlink:cli # Unlink when done

# Monorepo
npm run build          # Build everything
npm run build:plugin   # Just plugin
```

---

## Publishing to npm (Future)

When ready to publish:

```bash
# Build
npm run build

# From package
cd packages/clearch
npm publish

# Or
cd packages/clearch-plugin
npm publish
```

The `"files"` field in package.json determines what gets published (only `dist/` and `src/generators/`).
