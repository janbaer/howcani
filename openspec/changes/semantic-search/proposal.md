## Why

FTS5 keyword search misses synonyms and natural language queries — searching "deploy" does not find items about "ship to production", and a query like "how do I restart a crashed container" returns nothing unless those exact words appear. Adding vector-based semantic search closes this gap.

## What Changes

- Add `sqlite-vec` SQLite extension for ANN vector similarity search
- Add `item_embeddings` table and `vec_items` virtual table to store float32 embedding vectors per item
- Add `embedding.service.ts` to generate embeddings via OpenRouter API on item create/update
- Add a cron job that backfills embeddings for items missing them (runs every 5 minutes)
- Add `users.semantic_search_enabled` column as a per-user opt-in toggle
- Add `/api/settings` routes (GET + PATCH) for reading and updating user settings
- Add a `/settings` page in the UI with a toggle for semantic search
- Add `searchHybrid()` to the item repository, merging FTS5 and KNN results via Reciprocal Rank Fusion
- Update the MCP `search_items` tool to use the hybrid search path when enabled for the user

## Capabilities

### New Capabilities

- `vector-embeddings`: Generating, storing, and backfilling float32 embedding vectors for items using OpenRouter and sqlite-vec
- `user-settings`: Per-user settings stored in the database, exposed via a REST API and a settings UI page

### Modified Capabilities

- `search-filtering`: When semantic search is enabled for a user, search results are ranked by hybrid FTS5 + vector RRF score instead of BM25 alone

## Impact

- **Dependencies**: `sqlite-vec` npm package (already installed)
- **Database**: new tables `item_embeddings`, `vec_items`; new column `users.semantic_search_enabled`; new migration version
- **Backend**: `src/server/db/migrations.ts`, `src/server/repositories/item.repository.ts`, `src/server/services/item.service.ts`, `src/server/routes/index.ts`, new `src/server/services/embedding.service.ts`, new `src/server/services/settings.service.ts`, new `src/server/routes/settings.routes.ts`, new `src/server/cron.ts`
- **MCP**: `src/server/mcp/tools.ts`
- **Frontend**: new `src/client/pages/Settings.svelte`, `src/client/lib/api.ts`, `src/client/App.svelte` (routing), `src/server/index.ts` (SPA route)
- **Config**: `OPENROUTER_API_KEY` and `EMBEDDING_MODEL` environment variables
