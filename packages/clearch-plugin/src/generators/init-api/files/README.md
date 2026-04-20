# __PROJECT_NAME_PASCAL__

**Tooling + folder skeleton only.** There is no HTTP server, no gRPC/MCP runtime, and no demo features—only TypeScript layout, validation primitives, Husky, ESLint, Prettier, Jest, and optional Docker for the app container.

## Transports (install when you need them)

| Command | Adds |
|--------|------|
| \`clearch install http\` | Express, \`server.ts\` / \`app.ts\`, HTTP contracts, \`adaptRouter\`, response helpers |
| \`clearch install grpc\` | gRPC contracts, no-op bootstrap + adapter placeholder (\`@grpc/grpc-js\` not installed) |
| \`clearch install mcp\` | MCP tool-handler contract, no-op bootstrap + adapter placeholder (no MCP SDK) |

Recommended order: \`install http\` first if you want a REST API. You can run \`install grpc\` / \`install mcp\` before or after \`http\`; if they run first, \`install http\` wires \`server.ts\` to call their bootstraps when present.

Other modules:

\`\`\`bash
clearch install auth
clearch install hash
clearch install db
clearch install messaging   # requires \`clearch install http\` first (patches \`app.ts\`)
\`\`\`

\`clearch generate usecase\` requires \`clearch install http\` (needs \`Controller\` / \`HttpRequest\` / helpers).

## Scripts (skeleton)

- \`npm run dev\` — \`tsc --watch\` (compile only)
- \`npm run build\` — emit \`dist/\` (includes \`skeleton.js\` until you add HTTP)
- \`npm start\` — run compiled \`skeleton\` (placeholder)
- After \`clearch install http\`, \`dev\` / \`start\` switch to the Express server (\`tsx watch src/main/server.ts\`, etc.)

## Layout

Folders under \`src/\` are documented with READMEs. Shared pieces in the base repo:

- \`src/validation/\` — \`Validator\` contract, \`RequiredFieldValidator\`, \`ValidatorComposite\`
- \`src/presentation/errors/\` — e.g. \`MissingParamError\` (used by validators)
- \`src/data\`, \`src/domain\`, \`src/infra\` — empty barrels (\`export {}\`) ready for \`clearch install *\` and your code

Path aliases: \`@domain/*\`, \`@data/*\`, \`@infra/*\`, \`@presentation/*\`, \`@validation/*\`, \`@main/*\` (\`tsconfig.json\`). Production: \`path-register.cjs\` + \`tsconfig-paths\`.

## Debugging

VS Code / Cursor: \`.vscode/launch.json\` includes **Debug Jest** only until \`clearch install http\` adds API debug configurations.

__INFRA_SECTION__

## Environment

\`.env.example\` is minimal. Run installers to append keys (\`PORT\` with HTTP, \`JWT_*\` with auth, DB vars with \`install db\`, etc.).
