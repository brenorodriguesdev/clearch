# Publishing clearch to npm

This workspace publishes two packages:

1. **`@clearch/plugin`** — generator implementation and templates (dependency of the CLI).
2. **`clearch`** — public CLI (`bin: clearch`).

## Prerequisites

- An npm account with permission to publish the scope `clearch` (for `@clearch/plugin`) and the unscoped name `clearch`.
- One-time login: `npm login`

## Version bumps

Before publishing, bump versions in:

- `packages/clearch-plugin/package.json` (`version`)
- `packages/clearch/package.json` (`version` and the `@clearch/plugin` dependency version if you want them aligned)

Keep `clearch`’s dependency on `@clearch/plugin` matching the published plugin version.

## Build

From the repository root:

```bash
npm install
npm run build
```

Confirm `packages/clearch-plugin/dist/index.js`, `packages/clearch-plugin/dist/generators/`, and `packages/clearch/dist/cli.js` exist.

## Publish order

Publish **`@clearch/plugin` first**, then **`clearch`**, so the CLI can resolve the published plugin version.

### Scoped plugin (`@clearch/plugin`)

```bash
cd packages/clearch-plugin
npm publish --access public
```

### CLI (`clearch`)

```bash
cd packages/clearch
npm publish --access public
```

## Publish from the repo root (npm workspaces)

If your npm version supports workspace publish:

```bash
npm publish -w packages/clearch-plugin --access public
npm publish -w packages/clearch --access public
```

## Verify

```bash
npx clearch@latest init tmp-service
```

## Notes

- Do not publish `node_modules` or unbuilt `src` unless you intentionally change the `files` field in each `package.json`.
- The `clearch` package lists `dist` in `files`; ensure `npm run build` ran before publish.
