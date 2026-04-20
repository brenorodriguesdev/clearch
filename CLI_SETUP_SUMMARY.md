# Clearch CLI - Setup Complete ✅

## What Was Configured

### 1. **Build Configuration** ✅
- TypeScript compiles to `packages/clearch/dist/cli.js`
- Build runs with: `nx build clearch`
- Plugin generators are included in build

### 2. **CLI Entry Point** ✅
**File:** `packages/clearch/src/cli.ts`
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
// ... CLI implementation
```

**Compiled to:** `packages/clearch/dist/cli.js`
- Has correct shebang: `#!/usr/bin/env node`
- Ready for execution with Node

### 3. **Binary Configuration** ✅
**File:** `packages/clearch/package.json`
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

### 4. **Workspace Scripts** ✅
**File:** `package.json` (root)
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

---

## Quick Start Commands

### Option A: Direct Execution (No Setup)
```bash
# Build
npm run build:cli

# Run from workspace root
node packages/clearch/dist/cli.js init my-service
node packages/clearch/dist/cli.js generate usecase create-user
```

### Option B: Global Link (Recommended for Development)
```bash
# Link once
npm run link:cli

# Use from anywhere
clearch init my-service
clearch generate usecase create-user

# Unlink when done
npm run unlink:cli
```

---

## Test It Now

### Test 1: Build and Direct Execution
```bash
npm run build:cli
node packages/clearch/dist/cli.js --version
# Output: 0.1.0
```

### Test 2: Link and Global Command
```bash
npm run link:cli
clearch init test-api
cd test-api
npm install
npm run dev
```

### Test 3: Generator
```bash
clearch generate usecase fetch-user
```

---

## File Structure

```
packages/clearch/
├── src/
│   └── cli.ts                 # CLI entry (with #!/usr/bin/env node)
├── dist/
│   ├── cli.js                 # Compiled, executable
│   └── cli.d.ts               # Type definitions
├── package.json               # Defines bin: { clearch: dist/cli.js }
├── project.json               # Nx build configuration
└── tsconfig.json              # TypeScript config

packages/clearch-plugin/
├── src/
│   ├── generators/
│   │   └── init-api/          # Init generator
│   │       └── files/         # Template files
│   └── index.ts               # Plugin exports
├── dist/                      # Compiled + copied generators
└── package.json               # main: dist/index.js
```

---

## Commands Available

### clearch init
```bash
clearch init <project-name> [options]

Arguments:
  project-name    kebab-case project folder name

Options:
  -o, --output    directory to create project (default: current dir)

Examples:
  clearch init my-service
  clearch init my-api --output ~/projects
```

### clearch generate usecase
```bash
clearch generate usecase <name> [options]

Arguments:
  name    kebab-case use case name

Options:
  -c, --cwd    clearch project root (default: current dir)

Examples:
  clearch generate usecase create-user
  clearch generate usecase fetch-posts --cwd ~/projects/my-api
```

---

## How It Works

1. **npm run build:cli**
   - Runs TypeScript compiler in `packages/clearch/`
   - Outputs `dist/cli.js` with shebang intact

2. **npm run link:cli**
   - Runs `npm link` from `packages/clearch/`
   - Creates symlink: `~/.nvm/versions/node/.../bin/clearch` → `packages/clearch/dist/cli.js`
   - Node looks up in global `node_modules/` and finds the symlink

3. **clearch init my-service**
   - Executes the symlink (which is Node-aware)
   - Runs `dist/cli.js` with Commander.js argument parsing
   - Calls `runInitApi()` from `@clearch/plugin`

---

## Verification Checklist

- ✅ CLI builds without errors: `npm run build:cli`
- ✅ Shebang is in dist/cli.js: `head -1 packages/clearch/dist/cli.js`
- ✅ Binary field is correct: `packages/clearch/package.json`
- ✅ Direct execution works: `node packages/clearch/dist/cli.js --version`
- ✅ npm link works: `npm run link:cli`
- ✅ Global command works: `clearch --version` (from any directory)
- ✅ init command works: `clearch init test-project`
- ✅ generate command works: `clearch generate usecase test-feature`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "command not found: clearch" | Run `npm run link:cli` again |
| "Cannot find module" on direct execution | Run from workspace root directory |
| Old CLI version running | Build fresh: `npm run build:cli` then re-run |
| Permission denied error | CLI files are executable by default, npm link handles this |

---

## Next: Development Workflow

See **`CLI_DEVELOPMENT.md`** for:
- Full end-to-end testing
- Adding new commands
- Watch mode setup
- Publishing to npm

---

## Summary

Your clearch CLI is ready for local development! 🚀

- **Build:** `npm run build:cli`
- **Test locally:** `node packages/clearch/dist/cli.js init my-service`
- **Link globally:** `npm run link:cli` then `clearch init my-service`
- **Unlink:** `npm run unlink:cli`

No npm publishing required for local testing.
