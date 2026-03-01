# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # Start dev server with hot reload (src/server/index.ts)
bun run build        # Production build → dist/ (bundles server + client)
bun test             # Run all tests
bun test --watch     # Watch mode
bun test path/to/file.spec.ts  # Run a single test file
bun run lint         # Check with Biome (must pass before committing)
bun run lint:fix     # Auto-fix Biome issues
```

Tests use in-memory SQLite — no setup needed. Git hooks (via `simple-git-hooks`) enforce quality automatically: `pre-commit` runs lint, `pre-push` runs build and tests. No manual invocation needed before committing or pushing.

## Architecture

### Server (`src/server/`)

The server is a **Bun HTTP server** that delegates to three subsystems:

- `/mcp` → MCP protocol handler (`mcp/`)
- `/api/*` → Elysia app with route groups
- SPA routes + static files → HTML bundle from `public/` and `dist/`

**Layer hierarchy** (strict — routes cannot access repositories):
```
Routes → Services → Repository (own entity only)
                 → Other Services (for cross-entity access)
Domain (pure types/validation, no dependencies)
```

**Session model**: `authPlugin` (`middleware/auth.middleware.ts`) verifies the JWT on every request and calls `createSession()`, which instantiates `ItemService` and `TagService` bound to the authenticated `userId`. Mutation routes use `session.itemService` / `session.tagService`; read routes use the singleton `itemService` (with empty userId, resolves user from URL `:username`).

**Services** return `Result<T>` discriminated unions (`{ success: true, data }` | `{ success: false, error }`). Routes translate error codes to HTTP status codes — never use hardcoded numbers, use `http-status-codes`.

### Database (`src/server/db/`)

- Single SQLite file, WAL mode, foreign keys ON
- `database.ts` exports the singleton `db` and `isSqliteVecAvailable()`
- Migrations are sequential and run on startup via `runMigrations()`. Migration 7 creates the `vec_items` virtual table (requires sqlite-vec). If the extension is unavailable, migration 7 is skipped gracefully and a recovery check ensures the table is created once the extension becomes available.
- **Tests** use in-memory SQLite: call `setupTestDatabase()` in `beforeAll`, `clearTestDatabase()` in `beforeEach` (from `db/test-helpers.ts`)

### Search

Two modes, selected per-user via `semantic_search_enabled` flag:

- **FTS5 only**: `searchOnly()` — BM25 ranked full-text search on `items_fts`
- **Hybrid** (FTS5 + KNN + RRF): `searchHybrid()` — top-50 FTS5 results merged with top-50 KNN vector results using Reciprocal Rank Fusion (k=60). Embeddings are 1536-dim float32 vectors stored in `vec_items` (sqlite-vec virtual table) via OpenRouter's `text-embedding-3-small` model. Embeddings are generated fire-and-forget on create/update, and backfilled by a cron job every 5 minutes in batches of 20.

### MCP Server (`src/server/mcp/`)

Stateless HTTP MCP server at `/mcp`. Auth is a Bearer token checked per-call in `tools.ts` (not via the Elysia auth plugin). Tools bypass the service layer and call repositories directly — this is intentional.

### Client (`src/client/`)

Svelte 5 SPA with rune-based state. Layer rules mirror the backend:

- **Pages** (`pages/`): routing, lifecycle, thin orchestration only
- **Stores** (`stores/*.store.svelte.ts`): reactive state classes (not singletons — instantiated per page), data fetching, business logic
- **Components** (`components/`): receive data via `$props()`, no direct API calls; organized into subdirectories: `common/`, `item-detail/`, `itemlist/`, `layout/`, `settings/`, `tags/`
- **Lib** (`lib/`): API client (`api.ts`), auth state, router, theme — global singletons using runes, named `*.svelte.ts`

The client-side router is hash-based. SPA routes must also be declared in the `routes` map in `src/server/index.ts` or Bun won't serve the HTML shell for direct navigation.

## Key Conventions

- `node:` protocol for built-in modules (`node:fs`, `node:path`)
- Use `http-status-codes` for all HTTP status codes
- Imports must be alphabetically sorted (Biome enforces this)
- `$state()` uses `let` in Svelte — Biome's `useConst` rule is disabled for `src/client/**/*.svelte`
- Biome also disables unused-variable warnings for Svelte files (variables used in templates are invisible to the linter)
- Services use a `Result<T>` pattern — never throw from service methods
- No non-null assertions (`!`) — use explicit null checks

## Spec System (OpenSpec)

Design documentation lives in `openspec/`. Features are developed as *changes*:

- `openspec/changes/<name>/` — active or in-progress change (design.md, tasks, specs)
- `openspec/changes/archive/` — completed changes
- `openspec/specs/` — canonical specs reflecting the current state of the system
- `openspec/project.md` — authoritative project context (tech stack, conventions, domain model)

Use `/openspec-*` skills to navigate the workflow.
