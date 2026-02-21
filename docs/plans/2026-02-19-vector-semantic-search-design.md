# Vector Semantic Search Design

**Date:** 2026-02-19

## Problem

FTS5 keyword search misses synonyms and natural language queries. Searching "deploy" does not find items about "ship to production". Searching "how do I restart a crashed container" returns nothing unless those exact words appear in an item.

## Solution

Add vector-based semantic search using OpenRouter embeddings and sqlite-vec, merged with the existing FTS5 results via Reciprocal Rank Fusion. Semantic search is opt-in per user and respected by both the HTTP API and MCP server.

---

## Data Model

### New tables

```sql
-- Stores the embedding vector for each item
CREATE TABLE item_embeddings (
  item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  embedding BLOB NOT NULL,   -- float32 vector
  model TEXT NOT NULL,       -- e.g. "openai/text-embedding-3-small"
  created_at TEXT NOT NULL
);

-- sqlite-vec ANN index
CREATE VIRTUAL TABLE vec_items USING vec0(
  item_id TEXT PRIMARY KEY,
  embedding float[1536]
);
```

### Users table

```sql
ALTER TABLE users ADD COLUMN semantic_search_enabled INTEGER NOT NULL DEFAULT 0;
```

### Configuration

| Env var | Purpose | Default |
|---|---|---|
| `OPENROUTER_API_KEY` | Authenticates embedding API calls | required |
| `EMBEDDING_MODEL` | OpenRouter model identifier | `openai/text-embedding-3-small` |

The server starts normally without `OPENROUTER_API_KEY`. If the key is absent or an API call fails, a warning is written to stdout and the system falls back to FTS5.

---

## Write Path

After an item is created or updated, `item.service.ts` calls the embedding service:

1. Save item to SQLite (as today).
2. Call `embedding.service.ts` with the concatenated `question + "\n" + answer`.
3. Upsert the result into `item_embeddings` and `vec_items`.

Embedding generation is fire-and-forget. A failure logs a warning to stdout but does not affect the item save. The cron job picks up any missing embeddings on its next run.

Item deletion cascades automatically via the foreign key on `item_embeddings`. The corresponding `vec_items` row is deleted explicitly in the service layer.

---

## Cron Job

A server-side cron (default interval: 5 minutes) queries for items with no corresponding `item_embeddings` row, batches them in groups of 20, calls OpenRouter, and inserts the results. It only runs when `OPENROUTER_API_KEY` is present.

This serves two purposes:
- Backfills embeddings for existing items when a user enables semantic search.
- Retries any embedding that failed at write time.

---

## Search Path

When semantic search is enabled for the user:

1. Run FTS5 query → ranked list of item IDs.
2. Embed the search string via OpenRouter → run KNN query on `vec_items` → ranked list of item IDs.
3. Merge with Reciprocal Rank Fusion: `score(item) = 1/(60 + fts_rank) + 1/(60 + vec_rank)`.
4. Sort by combined score descending, apply pagination.

Both queries run on the same SQLite connection. The only network call is the query embedding.

**Fallback:** if the query embedding call fails, the search falls back to FTS5 silently. A warning is written to stdout.

**Tag filtering** is applied as a post-filter on the merged result set, consistent with the existing `searchWithTags` behaviour.

**When semantic search is disabled**, the existing `searchOnly` / `searchWithTags` path runs unchanged with zero overhead.

---

## User Setting & UI

A new `/settings` route exposes a toggle: "Enable semantic search". The setting is stored in `users.semantic_search_enabled`.

**API:**
- `GET /api/settings` — returns current user settings.
- `PATCH /api/settings` — updates settings.

**MCP:** the `search_items` tool reads `semantic_search_enabled` from the user row identified by the JWT. No special handling — same code path as the HTTP API.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `OPENROUTER_API_KEY` absent | Log warning; semantic search unavailable |
| Embedding API fails on item write | Log warning; item saved; cron retries |
| Embedding API fails on search | Log warning; fall back to FTS5 results |
| sqlite-vec extension fails to load | Log error; server starts; semantic search unavailable |

---

## Testing

- Unit tests for the RRF merge function (pure function).
- Unit tests for `embedding.service.ts` with a mocked HTTP client.
- Integration tests for `searchItems` with semantic search enabled/disabled, using a fixture database with pre-computed embeddings (no live API calls in CI).
- Integration tests for the cron job with a small batch against the mock.

---

## Component Summary

| Component | Change |
|---|---|
| DB migrations | Add `item_embeddings`, `vec_items`, `users.semantic_search_enabled` |
| `embedding.service.ts` | New — OpenRouter client, embed text, upsert into both tables |
| `item.service.ts` | Call embedding service after create/update/delete |
| `item.repository.ts` | New `searchHybrid()` method with RRF merge |
| `cron.ts` | New — periodic backfill of missing embeddings |
| `/api/settings` | New route and service for user settings |
| Settings UI | New `/settings` page with semantic search toggle |
| MCP `search_items` | Read user setting; route to hybrid or FTS5 path |
