# Clearch CLI - Local Development Guide

## Overview

This guide explains how to develop and test the Clearch CLI locally without publishing to npm.

## Quick Start

### 1. Build the CLI
```bash
npm run build:cli
```

### 2. Execute Directly (Without npm link)
```bash
# From workspace root
node packages/clearch/dist/cli.js init my-service
node packages/clearch/dist/cli.js generate usecase create-user
```

### 3. Link Globally (Recommended for Dev)
```bash
npm run link:cli

# Now use it from anywhere:
clearch init my-service
clearch generate usecase create-user
```

### 4. Unlink When Done
```bash
npm run unlink:cli
```

---

## Detailed Setup

### Prerequisites
- Node.js 20+
- npm 10+
- Workspace dependencies installed: `npm install`

### Build Configuration

**Root workspace scripts:**
```json
{
  "scripts": {
    "build": "nx run-many -t build --projects=clearch-plugin,clearch",
    "build:cli": "nx build clearch",
    "link:cli": "cd packages/clearch && npm link && cd ../../ && echo '✓ clearch linked globally'",
    "unlink:cli": "npm unlink -g clearch && echo '✓ clearch unlinked'"
  }
}
```

**CLI package configuration** (`packages/clearch/package.json`):
```json
{
  "name": "clearch",
  "version": "0.1.0",
  "type": "commonjs",
  "bin": {
    "clearch": "./dist/cli.js"
  },
  "dependencies": {
    "@clearch/plugin": "0.1.0",
    "commander": "^12.1.0"
  }
}
```

**Build target** (`packages/clearch/project.json`):
```json
{
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
  }
}
```

---

## Testing Methods

### Method 1: Direct Node Execution
Best for: Quick testing, CI/CD, debugging

```bash
# Build first
npm run build:cli

# Run from workspace root
node packages/clearch/dist/cli.js init test-project
node packages/clearch/dist/cli.js generate usecase my-feature --cwd test-project
```

**Important:** Always run from the workspace root directory.

### Method 2: Global npm Link
Best for: Local development, simulating production usage

```bash
# Link once
npm run link:cli

# Use from anywhere in your system
cd /tmp
clearch init my-service

# Rebuild and test immediately
cd /Users/brenorodrigues/Downloads/template
npm run build:cli
# CLI automatically uses new build (because of symlink)
```

### Method 3: Development Script (Future)
For even faster iteration with tsx:

```bash
# Could use tsx to run TypeScript directly (not yet configured)
npx tsx packages/clearch/src/cli.ts init my-service
```

---

## Full End-to-End Test

```bash
# Step 1: Install dependencies
npm install

# Step 2: Build everything
npm run build:cli

# Step 3: Test direct execution
node packages/clearch/dist/cli.js --version
node packages/clearch/dist/cli.js init test-api

# Step 4: Verify generated project
cd test-api
ls -la
npm install
npm run build

# Step 5: Test generator
cd /Users/brenorodrigues/Downloads/template
npm run build:cli
npm run link:cli

# Step 6: Test from new project
cd /tmp/another-test
clearch init another-api
cd another-api
clearch generate usecase fetch-user
npm install
npm run build
npm run dev
```

---

## Available Commands

### Init Command
```bash
clearch init [options] <project-name>

Arguments:
  project-name        kebab-case project folder name

Options:
  -o, --output <dir>  directory to create the project in (default: current directory)
  -h, --help          display help for command

Examples:
  clearch init my-service
  clearch init my-api --output ~/projects
```

### Generate Usecase Command
```bash
clearch generate usecase [options] <name>

Arguments:
  name               kebab-case use case name (e.g., create-user, fetch-posts)

Options:
  -c, --cwd <dir>    clearch project root (default: current directory)
  -h, --help         display help for command

Examples:
  # From within generated project
  clearch generate usecase create-user
  clearch generate usecase fetch-posts
  
  # From elsewhere with --cwd
  clearch generate usecase delete-user --cwd ~/projects/my-api
```

---

## Troubleshooting

### Issue: "command not found: clearch"
**Solution:** Make sure you ran `npm run link:cli` and the output confirmed the link was created.

```bash
# Verify the link
which clearch
# Should output: /Users/brenorodrigues/.nvm/versions/node/v24.14.0/bin/clearch

# Re-link if needed
npm run unlink:cli
npm run link:cli
```

### Issue: "Cannot find module" when running directly
**Solution:** You must run from the workspace root where node_modules is installed.

```bash
cd /Users/brenorodrigues/Downloads/template
node packages/clearch/dist/cli.js init my-service
```

### Issue: Old version of CLI after rebuild
**Solution:** With npm link, the CLI automatically uses the latest dist/ build. Just rebuild and re-run:

```bash
npm run build:cli
clearch init my-service  # Uses new build automatically
```

### Issue: Generator files not being copied
**Solution:** The plugin build copies generators to dist/. Ensure you're building the plugin too:

```bash
npm run build  # Builds both plugin and CLI
# or
npm run build:cli  # Builds both (plugin is a dependency)
```

---

## How It Works

1. **TypeScript Compilation**: `tsc` compiles `src/cli.ts` to `dist/cli.js`
2. **Shebang**: The generated `dist/cli.js` has `#!/usr/bin/env node` at the top
3. **Binary Entry**: `package.json` defines `"bin": { "clearch": "dist/cli.js" }`
4. **npm link**: Creates symlink from global npm bin directory to `dist/cli.js`
5. **Execution**: When you run `clearch`, it executes `dist/cli.js` with Node.js

---

## Development Workflow

### Recommended Local Development Loop

```bash
# Terminal 1: Watch and rebuild on changes (requires file watcher setup)
npm run build:cli -- --watch  # if supported

# Terminal 2: Test commands
cd /tmp/test-workspace
clearch init my-api
cd my-api
clearch generate usecase new-feature
npm run dev
```

### Adding New Commands

1. Edit `packages/clearch/src/cli.ts`
2. Build: `npm run build:cli`
3. Test: `clearch <command>`
4. (Already linked, so no re-linking needed)

### Publishing to npm (When Ready)

```bash
# Just run your normal npm publish workflow
cd packages/clearch
npm publish
```

The generated `dist/` is what gets published (via "files" field in package.json).

---

## Useful Scripts Summary

```bash
# Building
npm run build          # Build everything
npm run build:cli      # Build CLI and plugin
npm run build:plugin   # Build plugin only

# Development & Testing
npm run test:cli       # Build CLI then show help
npm run link:cli       # Link CLI globally
npm run unlink:cli     # Unlink CLI globally

# Direct execution (from root)
node packages/clearch/dist/cli.js init test
node packages/clearch/dist/cli.js --version
```

---

## Next Steps

- ✅ Develop commands in `packages/clearch/src/cli.ts`
- ✅ Update plugin generators in `packages/clearch-plugin/src/generators/`
- ✅ Test locally with `npm run link:cli`
- ✅ Build and test before each commit
- ✅ When ready: publish to npm

Happy developing! 🚀
