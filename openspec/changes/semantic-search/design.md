## Context

The project uses Bun + SQLite for all persistence. FTS5 provides keyword search ranked by BM25. The item repository (`item.repository.ts`) handles all search logic. Items are created and updated via `item.service.ts`. The MCP server (`src/server/mcp/tools.ts`) calls the item repository directly, identifying users via JWT.

No vector search or embedding infrastructure exists today. The `sqlite-vec` package (v0.1.7) is already installed.

## Goals / Non-Goals

**Goals:**
- Improve search recall for synonyms and natural language queries
- Keep all data in the existing SQLite database file (no new services)
- Allow users to opt in via a toggle (persisted, respected by API and MCP)
- Fail gracefully — FTS5 search always works even if the embedding API is unavailable

**Non-Goals:**
- Real-time streaming of search results
- Embedding models running locally (always via OpenRouter)
- Per-query model selection by users
- Ranking explanation / debug output in the API response

## Decisions

### Decision: sqlite-vec for vector storage and ANN search

**Chosen:** Load `sqlite-vec` as a SQLite extension at database init time. Store embeddings in a `vec0` virtual table alongside a raw `item_embeddings` table.

**Alternatives considered:**
- JS-side cosine similarity: load all vectors into memory and compute in TypeScript. Simple, but does not scale — loading thousands of 6KB vectors on every search is impractical.
- Separate vector DB (Chroma, Qdrant): more powerful ANN indexing but adds an external process dependency and complicates Docker deployment.

`sqlite-vec` is the only option that keeps everything in one SQLite file with no additional process.

### Decision: Two tables for embeddings

`item_embeddings` (regular table) stores the raw BLOB, model name, and timestamp. `vec_items` (vec0 virtual table) is the ANN index.

This separation lets us query metadata (e.g. "which items have no embedding?") without going through the vec0 virtual table, which only supports vector similarity queries.

### Decision: OpenRouter for embedding generation

**Chosen:** HTTP call to `https://openrouter.ai/api/v1/embeddings` with configurable model (`EMBEDDING_MODEL`, default `openai/text-embedding-3-small`, 1536 dimensions).

**Alternatives considered:**
- Direct OpenAI API: less flexible, one more key to manage.
- Google AI SDK: requires a separate SDK dependency.

OpenRouter lets the user switch models via one env var without code changes.

### Decision: Hybrid RRF rather than vector-only search

**Chosen:** Run both FTS5 (keyword) and KNN (vector) queries, then merge with Reciprocal Rank Fusion (`score = 1/(60+rank_fts) + 1/(60+rank_vec)`).

**Why:** Neither search mode dominates. FTS5 wins for exact keyword matches and short queries; vector wins for paraphrases and natural language. RRF is simple to implement, parameter-free, and well-documented in the IR literature.

### Decision: Per-user opt-in stored in `users` table

A single `semantic_search_enabled INTEGER DEFAULT 0` column on `users`. No separate settings table — the settings surface is small and extending the users row is simplest.

Exposed via a new `/api/settings` route (GET + PATCH) that scopes reads/writes to the authenticated user. The MCP server reads the column at search time via the user repository.

### Decision: Cron job as the reliability backstop

Embedding generation on item write is fire-and-forget. If the OpenRouter call fails, a warning is logged and the item is saved normally. A cron job (default interval: 5 minutes) queries for items that need embedding work in batches of 20:

```sql
SELECT items.id, items.question, items.answer
FROM items
LEFT JOIN item_embeddings ON items.id = item_embeddings.item_id
WHERE item_embeddings.item_id IS NULL
   OR item_embeddings.created_at < items.updated_at
```

This covers two cases: items with no embedding at all (first-time backfill, or API failure on create), and items whose embedding is older than their last update (API failure on update, or content changed while the API was unavailable).

The write path has no retry logic. The cron job is the sole recovery mechanism for transient failures.

## Risks / Trade-offs

- **Vector dimension lock-in** → If the model changes, existing embeddings become incompatible. Mitigation: store `model` in `item_embeddings`; cron job can detect mismatches and regenerate. For now, a model change requires a full re-index (acceptable for a personal knowledge base).
- **sqlite-vec extension load failure** → If the `.so` file is missing or incompatible (e.g., wrong architecture in Docker), semantic search silently becomes unavailable. Mitigation: log a clear error at startup.
- **OpenRouter rate limits** → Cron job batches in groups of 20 to stay well within typical rate limits. The 5-minute interval adds natural throttling.
- **RRF constant k=60** → Standard default from the original RRF paper. Not tunable by users, but appropriate for this use case.

## Migration Plan

1. Deploy new server version — migrations run automatically on startup (versions 6, 7, 8).
2. Users who enable the toggle trigger backfill via the cron job on next run.
3. No rollback complexity: `semantic_search_enabled = 0` (the default) bypasses all vector code paths entirely.

## Open Questions

- None — all design decisions are resolved.
