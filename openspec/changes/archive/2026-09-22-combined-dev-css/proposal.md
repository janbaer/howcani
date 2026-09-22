# Proposal: combined-dev-css

## Why

`bun run dev` starts only the server (`bun --hot run src/server/index.ts`); the
Tailwind watcher is a separate `dev:css` script. Running `dev` alone serves the
committed `src/styles/main.css`, which silently goes stale when templates or
classes change. Forgetting the second terminal costs a confused debugging
session ("why doesn't my class apply?").

## What Changes

- `bun run dev` starts the server and the Tailwind CSS watcher together in one
  command; both outputs are visible, Ctrl-C stops both.
- No new dependency: `package.json` dependencies and `bun.lock` stay unchanged.
- `dev` calls `bun run dev:css` instead of repeating the Tailwind command.
- `dev:css` stays available for standalone use.
- Command docs in `README.md` are updated.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — developer-tooling change with no runtime spec impact)

## Impact

- `package.json` (`dev` script only)
- `README.md`, `CLAUDE.md` (command docs)
- No source code, no specs, no tests affected.