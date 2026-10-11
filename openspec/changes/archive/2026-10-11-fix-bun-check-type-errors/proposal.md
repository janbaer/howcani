## Why

`bun check` has never been run on this repo: `bun build` and `bun test` only transpile, and no script or hook runs a type check. The first run reports a removed `baseUrl` option (TS5102) and, once that is gone, 48 further type errors in 13 files. Without a gate, new ones keep piling up unseen.

## What Changes

- Remove `baseUrl` from `tsconfig.json` and enable `allowImportingTsExtensions` (the code imports with `.ts` extensions).
- Fix the remaining type errors in server, client and spec files without `@ts-ignore` or `as any`.
- Run `bun check` in the pre-push hook so a type error blocks the push.

## Capabilities

### New Capabilities

### Modified Capabilities
- `git-hooks`: the pre-push hook additionally runs `bun check`.

## Impact

- `tsconfig.json`, `package.json` (pre-push hook)
- `src/server/mcp/*`, `src/server/repositories/item.repository.ts`, `src/server/routes/auth.routes.ts`, two client stores, several spec files
- No runtime behavior change expected, unless an error turns out to hide a real bug (noted in design.md).
