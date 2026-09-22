# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For project purpose, tech stack, architecture patterns, layer access rules, code style, and domain context see [`openspec/project.md`](openspec/project.md).

## Commands

```bash
bun run dev          # Dev server with hot reload + Tailwind CSS watcher (Ctrl-C stops both)
bun run dev:css      # Tailwind CSS watcher only
bun run build        # Production build → dist/ (bundles server + client)
bun test --isolate   # Run all tests (as pre-push and the Docker build do)
bun test --watch     # Watch mode
bun test path/to/file.spec.ts  # Run a single test file
bun run lint         # Check with Biome (must pass before committing)
bun run lint:fix     # Auto-fix Biome issues
```

Tests use in-memory SQLite — no setup needed. Git hooks (via `simple-git-hooks`) enforce quality automatically: `pre-commit` runs lint, `pre-push` runs build and tests. No manual invocation needed before committing or pushing.

Tests must run with `--isolate`. Several route specs replace modules with `mock.module`, which in a shared run applies to every file that runs afterwards; plain `bun test` then passes or fails depending on the order the filesystem lists the spec files in.

## Release & Deployment

Merging a PR is the release. `/forgejo-pr-merge` bumps the version in `package.json` and writes the changelog entry on the feature branch after the review, then squash-merges; neither is part of the reviewed diff.

`.forgejo/workflows/docker-image.yml` then runs on the Forgejo runner for the push to `main`, but only for `main` (a `workflow_dispatch` on any other ref skips) and only when the push touches `package.json`. It skips versions already in the registry, and otherwise builds and pushes `forgejo.home.janbaer.de/jan/howcani:<version>` + `:latest`. It logs in with the `REGISTRY_TOKEN` repo secret (PAT, scope `write:package`) and reports to ntfy topic `forgejo-cicd`. Pushing `:latest` is the deploy trigger — a webhook picks it up and rolls it out automatically. No `docker-compose pull && up -d` needed.

Fallback when CI is unavailable: `bun run build:docker --no-bump` builds and pushes the version already in `package.json` from the local machine. Without `--no-bump` it bumps first, taking `patch`, `minor` or `major`.

## Environment Variables

Secrets only — all other operator configuration lives in `config.yaml` (see below).

| Variable | Required | Notes |
|---|---|---|
| `HOWCANI_JWT_SECRET` | Yes | Auth won't work without it |
| `OPENROUTER_API_KEY` | When `embedding.provider: openrouter` | Read from env, never from `config.yaml` |
| `HOWCANI_CONFIG_PATH` | No | Path to `config.yaml`. Default: `./config.yaml` |
| `DATABASE_URL` | No | Default: `./data/howcani.db` |
| `PORT` | No | Default: `3000` |

## Operator Config (`config.yaml`)

Operator settings (embedding provider/model/dimension, backup schedule/retention, duplicate threshold) live in a single Zod-validated `config.yaml`, loaded once at startup by `configService` (`src/server/config/`). The server **refuses to start** if the file is missing or fails validation — no silent defaults. Changing config means edit the file and restart; there is no runtime mutation and no `PATCH /api/settings`. Copy `config.example.yaml` to get started. Secrets stay in env and are never read from the YAML.

## Architecture

### Server (`src/server/`)

The server is a **Bun HTTP server** that delegates to three subsystems:

- `/mcp` → MCP protocol handler (`mcp/`)
- `/api/*` → Elysia app with route groups
- SPA routes + static files → HTML bundle from `public/` and `dist/`

**Session model**: `authPlugin` (`middleware/auth.middleware.ts`) verifies the JWT on every request and calls `createSession()`, which instantiates `ItemService` and `TagService` bound to the authenticated `userId`. Mutation routes use `session.itemService` / `session.tagService`; read routes use the singleton `itemService` (with empty userId, resolves user from URL `:username`).

**Services** return `Result<T>` discriminated unions (`{ success: true, data }` | `{ success: false, error }`). Routes translate error codes to HTTP status codes — never use hardcoded numbers, use `http-status-codes`.

### Database (`src/server/db/`)

- Single SQLite file, WAL mode, foreign keys ON
- `database.ts` exports the singleton `db` and `isSqliteVecAvailable()`
- Migrations are sequential and run on startup via `runMigrations()`. Migration 7 creates the `vec_items` virtual table (requires sqlite-vec). If the extension is unavailable, migration 7 is skipped gracefully and a recovery check ensures the table is created once the extension becomes available.
- **Tests** use in-memory SQLite: call `setupTestDatabase()` in `beforeAll`, `clearTestDatabase()` in `beforeEach` (from `db/test-helpers.ts`)

### Search

Two modes, selected by whether `config.yaml` configures an `embedding.provider` (null ⇒ FTS5 only):

- **FTS5 only**: `searchOnly()` — BM25 ranked full-text search on `items_fts`
- **Hybrid** (FTS5 + KNN + RRF): `searchHybrid()` — top-50 FTS5 results merged with top-50 KNN vector results using Reciprocal Rank Fusion (k=60). Embeddings are float32 vectors (dimension from `config.yaml`) stored in `vec_items` (sqlite-vec virtual table). Embeddings are generated fire-and-forget on create/update, and backfilled by a cron job every 5 minutes in batches of 20.

### MCP Server (`src/server/mcp/`)

Stateless HTTP MCP server at `/mcp`. Auth is a Bearer token checked per-call in `tools.ts` (not via the Elysia auth plugin). Tools bypass the service layer and call repositories directly — this is intentional.

### Client (`src/client/`)

Svelte 5 SPA with rune-based state. Layer rules mirror the backend (see `openspec/project.md`).

The client-side router is hash-based. SPA routes must also be declared in the `routes` map in `src/server/index.ts` or Bun won't serve the HTML shell for direct navigation.

**Svelte/Biome quirks:**
- `$state()` requires `let` — Biome's `useConst` rule is disabled for `src/client/**/*.svelte`
- Biome can't see variables used in templates, so `noUnusedVariables` and `noUnusedImports` are also disabled for Svelte files
- Biome line width is **120 chars** (non-default)

## Spec System (OpenSpec)

Design documentation lives in `openspec/`. Features are developed as *changes*:

- `openspec/changes/<name>/` — active or in-progress change (design.md, tasks, specs)
- `openspec/changes/archive/` — completed changes
- `openspec/specs/` — canonical specs reflecting the current state of the system
- `openspec/project.md` — authoritative project context (tech stack, conventions, domain model)

Use `/openspec-*` skills to navigate the workflow.
