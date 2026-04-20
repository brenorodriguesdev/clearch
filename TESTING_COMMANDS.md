# Testing Commands - Copy & Paste Ready

## ✅ Quick Test (2 minutes)

```bash
# Navigate to workspace
cd /Users/brenorodrigues/Downloads/template

# Build
npm run build:cli

# Test 1: Direct execution
node packages/clearch/dist/cli.js --version
# Expected: 0.1.0

# Test 2: Show help
node packages/clearch/dist/cli.js --help
# Expected: CLI help with init and generate commands
```

---

## ✅ Full Setup Test (5 minutes)

```bash
# Navigate to workspace
cd /Users/brenorodrigues/Downloads/template

# Step 1: Build
npm run build:cli

# Step 2: Link globally
npm run link:cli
# Expected: "✓ clearch linked globally"

# Step 3: Test from anywhere
cd /tmp
clearch --version
# Expected: 0.1.0

# Step 4: Generate a project
clearch init test-api

# Step 5: Check what was created
cd test-api
ls -la
# Expected: See project files (package.json, src/, etc.)

# Step 6: Install and verify
npm install

# Step 7: Build the generated project
npm run build
# Expected: TypeScript builds without errors

# Step 8: Back to workspace
cd /Users/brenorodrigues/Downloads/template
```

---

## ✅ Generator Test

```bash
# From the generated project
cd /Users/brenorodrigues/Downloads/template/test-api

# Generate a use case
clearch generate usecase create-user

# Check generated files
ls -la src/application/usecases/
ls -la src/adapters/controllers/

# Expected: Files for create-user use case

# Verify types
npm run build
# Expected: Build succeeds without TypeScript errors
```

---

## ✅ Test Without npm Link (Direct Execution)

```bash
# Navigate to workspace
cd /Users/brenorodrigues/Downloads/template

# Build
npm run build:cli

# All commands must be run with full path from workspace root
node packages/clearch/dist/cli.js init direct-test
cd direct-test
node ../../packages/clearch/dist/cli.js generate usecase my-feature --cwd .
npm install
npm run build
```

---

## ✅ Test With npm Link (Global Usage)

```bash
# Setup
cd /Users/brenorodrigues/Downloads/template
npm run link:cli

# Now use from anywhere
cd /tmp/anywhere
clearch init linked-test
cd linked-test
clearch generate usecase fetch-data
npm install
npm run build

# Cleanup
cd /Users/brenorodrigues/Downloads/template
npm run unlink:cli
```

---

## ✅ Rebuild and Retest

```bash
# Make a change to the CLI
nano packages/clearch/src/cli.ts
# ... edit something ...

# Rebuild
npm run build:cli

# Test immediately (if linked)
clearch --version
# Should show latest build (symlink is live)

# Or test direct
node packages/clearch/dist/cli.js --version
```

---

## ✅ End-to-End Simulation

```bash
#!/bin/bash
# Full workflow test

set -e

WORKSPACE=/Users/brenorodrigues/Downloads/template
TEST_DIR=/tmp/clearch-e2e-test
PROJECTS_DIR=$TEST_DIR/projects

# Setup
mkdir -p $PROJECTS_DIR
cd $WORKSPACE

echo "1️⃣ Building..."
npm run build:cli

echo "2️⃣ Linking globally..."
npm run link:cli

echo "3️⃣ Creating first project..."
cd $PROJECTS_DIR
clearch init project-one
cd project-one
npm install
npm run build

echo "4️⃣ Creating second project..."
cd ..
clearch init project-two
cd project-two
npm install

echo "5️⃣ Generating use cases..."
clearch generate usecase list-items
clearch generate usecase create-item
npm run build

echo "6️⃣ Verify projects..."
npm run dev &
DEVPID=$!
sleep 3
kill $DEVPID || true

echo "7️⃣ Cleanup..."
cd $WORKSPACE
npm run unlink:cli

echo "✅ All tests passed!"
```

---

## ✅ Troubleshooting Tests

### Test: Check if link is working
```bash
which clearch
# Should output something like:
# /Users/brenorodrigues/.nvm/versions/node/v24.14.0/bin/clearch

ls -la ~/.nvm/versions/node/v24.14.0/bin/clearch
# Should show a symlink pointing to:
# ../lib/node_modules/clearch/dist/cli.js
```

### Test: Verify shebang
```bash
head -1 packages/clearch/dist/cli.js
# Should output:
# #!/usr/bin/env node
```

### Test: Check bin configuration
```bash
cat packages/clearch/package.json | grep -A 2 '"bin"'
# Should output:
#   "bin": {
#     "clearch": "./dist/cli.js"
#   }
```

### Test: Verify dist exists
```bash
ls -la packages/clearch/dist/
# Should show:
# cli.js (executable)
# cli.d.ts
# cli.js.map (optional)
```

### Test: Check dependencies
```bash
cd packages/clearch
npm ls
# Should show @clearch/plugin and commander
```

---

## ✅ Performance Tests

### Test: Build speed
```bash
time npm run build:cli
# Should complete in ~2-5 seconds
```

### Test: Command execution speed
```bash
time clearch --version
# Should be <1 second
```

---

## ✅ Cleanup & Reset

```bash
# If something goes wrong, reset completely

# 1. Unlink
npm unlink -g clearch 2>/dev/null || true

# 2. Clean build artifacts
rm -rf packages/clearch/dist
rm -rf packages/clearch-plugin/dist

# 3. Clean caches
rm -rf packages/*/tsconfig.tsbuildinfo
npm cache clean --force 2>/dev/null || true

# 4. Rebuild
npm run build:cli

# 5. Relink
npm run link:cli
```

---

## ✅ Command Reference

| Command | Purpose |
|---------|---------|
| `npm run build` | Build everything (plugin + CLI) |
| `npm run build:cli` | Build CLI + plugin (plugin is dep) |
| `npm run test:cli` | Build and show help |
| `npm run link:cli` | Link CLI globally |
| `npm run unlink:cli` | Remove global link |
| `clearch --version` | Show version (requires link) |
| `clearch init <name>` | Create new project |
| `clearch generate usecase <name>` | Add use case to project |
| `node packages/clearch/dist/cli.js` | Direct execution (no link needed) |

---

## ✅ What Each Test Verifies

| Test | Verifies |
|------|----------|
| `npm run build:cli` | Build system works, TypeScript compiles |
| Direct execution | CLI works with proper shebang, paths are correct |
| `npm link` | Binary field is correct, npm understands bin entry |
| Global command | Symlink works, PATH is set up correctly |
| `init` command | Plugin generators are included and work |
| `generate` command | File writing and path resolution work |
| TypeScript build in project | Generated types are correct, dependencies resolve |

---

## Next Steps After Testing

✅ **If all tests pass:**
- CLI is ready for local development
- You can modify CLI code and rebuild
- Projects generate correctly
- Ready to add new commands/generators

❌ **If a test fails:**
- Check the specific error message
- See CLI_DEVELOPMENT.md "Troubleshooting" section
- Verify files exist: `ls -la packages/clearch/dist/cli.js`
- Verify permissions: `stat packages/clearch/dist/cli.js`
- Try rebuilding: `npm run build:cli`

---

## One-Liner Tests

```bash
# Just show version
npm run build:cli && node packages/clearch/dist/cli.js --version

# Just check CLI help
npm run test:cli

# Just test link
npm run link:cli && clearch --version && npm run unlink:cli

# Just create a test project
npm run build:cli && node packages/clearch/dist/cli.js init quick-test && ls quick-test/

# Full build + link + init
npm run build:cli && npm run link:cli && clearch init e2e-test && cd e2e-test && npm install
```

---

## Expected Outputs

### Build Success
```
 NX   Successfully ran target build for project clearch and 1 task it depends on
```

### Version Command
```
0.1.0
```

### Help Output
```
Usage: clearch [options] [command]

Scaffold Node.js + TypeScript APIs with Express isolated behind HTTP adapters

Options:
  -V, --version                  output the version number
  -h, --help                     display help for command

Commands:
  init [options] <project-name>  Create a new API project
  generate                       Generators for clearch projects
  help [command]                 display help for command
```

### Init Success
```
[clearch] initializing "my-service" in /path/to/output
[clearch] created: /path/to/output/my-service
[clearch] next steps:
  cd my-service
  npm install
  npm run dev
```

### Generate Success
```
[clearch] generating use case "create-user" in /path/to/project
[clearch] wrote:
  - src/application/usecases/create-user/create-user.controller.ts
  - src/application/usecases/create-user/create-user.service.ts
  - ... (more files)
[clearch] next steps:
  - Register a route in src/main/routes using adaptRouter(...)
  - Implement TODOs in the generated service
  - Run npm run build to verify TypeScript
```
