# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For project purpose, tech stack, architecture patterns, layer access rules, code style, and domain context see [`openspec/project.md`](openspec/project.md).

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

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `HOWCANI_JWT_SECRET` | Yes | Auth won't work without it |
| `OPENROUTER_API_KEY` | For semantic search | Enables hybrid FTS5+KNN search |
| `DATABASE_URL` | No | Default: `./data/howcani.db` |
| `PORT` | No | Default: `3000` |

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

Two modes, selected per-user via `semantic_search_enabled` flag:

- **FTS5 only**: `searchOnly()` — BM25 ranked full-text search on `items_fts`
- **Hybrid** (FTS5 + KNN + RRF): `searchHybrid()` — top-50 FTS5 results merged with top-50 KNN vector results using Reciprocal Rank Fusion (k=60). Embeddings are 1536-dim float32 vectors stored in `vec_items` (sqlite-vec virtual table) via OpenRouter's `text-embedding-3-small` model. Embeddings are generated fire-and-forget on create/update, and backfilled by a cron job every 5 minutes in batches of 20.

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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **howcani** (4539 symbols, 5852 relationships, 109 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/howcani/context` | Codebase overview, check index freshness |
| `gitnexus://repo/howcani/clusters` | All functional areas |
| `gitnexus://repo/howcani/processes` | All execution flows |
| `gitnexus://repo/howcani/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
