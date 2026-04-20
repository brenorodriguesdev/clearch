# clearch workspace

Monorepo for **clearch**, a public npm CLI that scaffolds Node.js + TypeScript APIs with Express isolated behind adapters. Presentation controllers depend only on `HttpRequest` / `HttpResponse` contracts.

## Packages

| Package | Purpose |
|--------|---------|
| `packages/clearch-plugin` (`@clearch/plugin`) | Generators, templates, and shared generation logic (`init`, `generate usecase`, `install auth|hash|db`). |
| `packages/clearch` (`clearch`) | Public CLI (`clearch` bin) built with Commander and Inquirer (interactive `install db`). |

Nx is used internally for builds and project structure; **end users do not need Nx** to use the CLI.

Generated apps use **TypeScript path aliases** (`@domain/*`, `@data/*`, `@infra/*`, `@presentation/*`, `@validation/*`, `@main/*`). **`tsx`** resolves them in development; **`path-register.cjs`** (via `tsconfig-paths`) maps aliases to `dist/*` for `npm start` after `tsc`.

## Architecture philosophy (generated apps)

Generated projects use a **practical** layout (not a heavy layered “clean” stack):

- **`domain/models`** — small types (`ExampleModel`, etc.). No frameworks.
- **`data/contracts`** — repository interfaces.
- **`data/services`** — services that implement the flow using those contracts.
- **`infra/repositories`** — concrete repositories (e.g. in-memory).
- **`presentation`** — `Controller`, `HttpRequest` / `HttpResponse` (`contracts/http.ts`), helpers, framework-agnostic controllers.
- **`validation`** — `Validator` contract, `RequiredFieldValidator`, `ValidatorComposite`, composed in factories.
- **`main`** — Express app, **`adaptRouter`** in `adapters/express-controller.ts`, thin routes, small factories.

### Why controllers are decoupled from Express

Express types (`Request`, `Response`) stay in `main`. Presentation defines portable contracts; **only `main/adapters`** maps Express to `HttpRequest` / `HttpResponse`.

### How `adaptRouter` works

`adaptRouter(controller)` (from `src/main/adapters/express-controller.ts`) returns Express middleware that maps `req` → `HttpRequest`, calls `controller.handle`, then writes `HttpResponse` to `res`.

```ts
router.post('/examples', adaptRouter(makeCreateExampleController()));
```

## Build (workspace)

```bash
npm install
npm run build
```

Equivalent:

```bash
nx build clearch-plugin
nx build clearch
```

## Run the CLI locally

After a successful build:

```bash
node packages/clearch/dist/cli.js init my-service
cd my-service && npm install
node packages/clearch/dist/cli.js install auth --cwd ./my-service
node packages/clearch/dist/cli.js install hash --cwd ./my-service
node packages/clearch/dist/cli.js install db --cwd ./my-service   # interactive DB choice
node packages/clearch/dist/cli.js generate usecase create-user --cwd ./my-service
```

Or link globally:

```bash
cd packages/clearch && npm link
clearch init my-service
```

## Test the generated app

```bash
node packages/clearch/dist/cli.js init my-service -o /tmp
cd /tmp/my-service
npm install
npm run dev
```

Example: `POST /examples` with JSON `{ "title": "hello" }`, then `GET /examples`.

## Publishing

See [PUBLISHING.md](./PUBLISHING.md) for npm login, versioning, and publish commands for `@clearch/plugin` and `clearch`.

## Example usage (after publish)

```bash
npx clearch init my-service
cd my-service
npm install
npm run dev
```

Optional modules (run from the project root after `npm install`):

```bash
npx clearch install auth       # JWT contracts + JwtAdapter
npx clearch install hash       # Hasher + BcryptHasher
npx clearch install db         # interactive: PostgreSQL (TypeORM) or MongoDB (Mongoose)
npx clearch install messaging  # interactive: queues (memory / RabbitMQ / SQS)
```

Inside an existing clearch project:

```bash
npx clearch generate usecase create-user
```

Then register a route in `src/main/routes` using `adaptRouter(makeCreateUserController())`.
