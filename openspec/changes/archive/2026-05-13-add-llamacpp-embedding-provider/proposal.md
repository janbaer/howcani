## Why

Embeddings currently require a paid external OpenRouter API call per item. A self-hosted llama.cpp server already runs on the home network and can serve OpenAI-compatible `/v1/embeddings` requests for free, on hardware we control. Adding a provider abstraction lets us switch between the two — eliminating API spend, regaining control over data flow, and enabling side-by-side quality comparison between OpenAI's `text-embedding-3-small` (1536-dim) and open models like `nomic-embed-text-v1.5` (768-dim) on the same corpus.

## What Changes

- Introduce an `EmbeddingProvider` interface with two implementations: `OpenRouterProvider` (existing behavior) and `LlamaCppProvider` (new, OpenAI-compatible HTTP, no auth header).
- Add a factory that selects the active provider from `EMBEDDING_PROVIDER` env (`openrouter` | `llamacpp`).
- Remove the hardcoded `1536` vector dimension. `EMBEDDING_DIMENSION` becomes the authoritative source for the schema declaration of `vec_items`.
- Add startup mismatch detection: compare env-configured `model` + `dimension` against one row of `item_embeddings`. On mismatch, refuse to boot unless `EMBEDDING_ALLOW_DIMENSION_RESET=true`, in which case wipe `item_embeddings` and recreate `vec_items` at the new dimension before booting.
- Add a startup self-check: one test embed call validates the returned vector length matches `EMBEDDING_DIMENSION`. Wrong dimension → fatal exit; unreachable endpoint → warning, continue (backfill retries).
- Make the backfill inter-call delay provider-defined: 200ms for OpenRouter (politeness/rate-limit), 0ms for llamacpp (own infrastructure).
- Add an owner-auth debug route `GET /api/admin/search-debug?q=...&limit=10` returning FTS5, KNN, and RRF rankings side-by-side for ranking comparison in dev.

## Capabilities

### New Capabilities
- `embedding-provider-debug`: Owner-auth debug endpoint exposing FTS5 / KNN / RRF rankings side-by-side for ranking quality comparison.

### Modified Capabilities
- `vector-embeddings`: Embedding generation no longer requires OpenRouter specifically; provider is selected at startup from env. Storage schema dimension becomes configurable rather than hardcoded. New startup-mismatch detection and self-check requirements.

## Impact

- Code:
  - `src/server/services/embedding.service.ts` — extract provider; delegate to factory.
  - `src/server/services/embedding-backfill.ts` — provider-defined inter-call delay.
  - `src/server/services/scheduler.service.ts` — call startup self-check before registering cron.
  - `src/server/db/migrations.ts` — migration 7 (`vec_items` creation) reads dimension from env.
  - `src/server/index.ts` — boot-time mismatch detection + optional wipe.
  - `src/server/routes/` — new `admin.routes.ts` for the search-debug endpoint.
- Env vars (new): `EMBEDDING_PROVIDER`, `EMBEDDING_DIMENSION`, `EMBEDDING_ENDPOINT`, `EMBEDDING_ALLOW_DIMENSION_RESET`.
- Env vars (existing, semantics unchanged): `OPENROUTER_API_KEY`, `EMBEDDING_MODEL`.
- DB: existing rows in `item_embeddings` and `vec_items` get wiped only when the operator explicitly opts in via the reset flag.
- No external dependencies added.
