## Context

The current embedding subsystem (`src/server/services/embedding.service.ts`) is hardcoded to OpenRouter:

- Fixed URL: `https://openrouter.ai/api/v1/embeddings`.
- Hardcoded Bearer auth via `OPENROUTER_API_KEY`.
- Hardcoded default model `openai/text-embedding-3-small`.
- The KNN virtual table `vec_items` is declared `float[1536]` in migration 7.

We want to add a second provider — a self-hosted llama.cpp instance at `https://llm.home.janbaer.de`, running `nomic-embed-text-v1.5` (768-dim). Both providers speak OpenAI-compatible `/v1/embeddings`, so the wire format is the same; what differs is base URL, auth header, model identifier, and vector dimension.

Switching providers is destructive: vec0 virtual tables have a fixed dimensionality, so changing dimensions means dropping + recreating `vec_items` and re-embedding every item.

Single user, single primary deployment. No backward-compatibility constraints — `EMBEDDING_PROVIDER` becomes required (unset means semantic search is disabled).

## Goals / Non-Goals

**Goals:**
- Clean abstraction: `EmbeddingProvider` interface, factory selection from env, the rest of `EmbeddingService` knows nothing about the underlying provider.
- Configurable vector dimension throughout the schema and runtime.
- Safe switching: detect dimension/model mismatch on startup; refuse to boot unless the operator explicitly opts into a destructive reset.
- Catch misconfiguration early: startup self-check verifies the live endpoint returns the configured dimension.
- Quality comparison: owner-auth debug route returns FTS5 / KNN / RRF rankings side-by-side for the same query.

**Non-Goals:**
- Running both providers simultaneously (single-table, single active provider). Quality comparison is done by running dev on one provider and prod on the other.
- A user-facing settings UI for provider selection — env-only.
- Backward compatibility with existing `OPENROUTER_API_KEY`-only deployments. The operator must set `EMBEDDING_PROVIDER` explicitly.
- Embedding generation strategy changes (still fire-and-forget on write, plus backfill cron).
- Caching, batching beyond current behavior.

## Decisions

### Decision 1: Provider abstraction via interface + factory

```ts
interface EmbeddingProvider {
  readonly model: string;
  readonly dimension: number;
  readonly backfillDelayMs: number;
  embed(text: string): Promise<Float32Array | null>;
}

function createEmbeddingProvider(): EmbeddingProvider | null;
```

`EmbeddingService` becomes a thin wrapper that delegates `embedText` to the provider and owns DB upserts. `embeddingService.provider` is exposed so callers (backfill, startup check, mismatch detection) can read the provider's static config (model, dimension, delay) without re-reading env.

**Alternatives considered:**
- Single class with `if (provider === 'local')` branches: rejected — leaks provider concerns into business logic and complicates testing.
- Strategy class hierarchy with inheritance: rejected — interface + two short concrete classes is enough.

### Decision 2: Configurable vector dimension

`EMBEDDING_DIMENSION` becomes the authoritative source for both:

- `vec_items` table declaration (`float[N]`) in migration 7.
- Self-check validation of the returned vector length.

Migration 7 reads from env at run time rather than embedding `1536` literally. The migration body is unchanged conceptually; only the dimension literal becomes `${EMBEDDING_DIMENSION}`.

Existing deployments that already ran migration 7 at 1536 dim will hit the mismatch-detection path if they switch to 768; no special "old migration replay" logic.

### Decision 3: Mismatch detection via existing data, no new state

On startup, infer the currently-stored model and dimension by inspecting one row:

```sql
SELECT model, LENGTH(embedding) AS bytes FROM item_embeddings LIMIT 1;
```

Three outcomes:

1. **Zero rows** — no embeddings stored, nothing to mismatch. Boot normally; backfill will populate.
2. **`model` and `bytes/4` match env config** — boot normally.
3. **Mismatch** — apply the reset-flag policy (Decision 4).

This avoids a new `app_settings` row tracking "current embedding config." The stored embeddings themselves are the record of truth.

Edge case: if two distinct models exist in `item_embeddings` (interrupted prior reset), any disagreement against env counts as mismatch.

### Decision 4: Destructive switch via explicit env flag

When mismatch is detected:

- `EMBEDDING_ALLOW_DIMENSION_RESET=true` → wipe `item_embeddings`, drop and recreate `vec_items` at the new dimension, log a loud warning, boot. Backfill cron repopulates over subsequent cron ticks.
- Flag absent or not `true` → log fatal error with the exact env line to add, exit non-zero.

Rationale: Docker deployments have no CLI access, so the reset must be triggerable via redeploy. Folding it into an env flag uses the same gesture the operator is already making (edit docker-compose, redeploy). No new HTTP admin surface, no UI button. The flag is explicit — a typo in `EMBEDDING_DIMENSION` won't silently nuke data.

**Alternative considered:** HTTP admin endpoint `POST /api/admin/embeddings/reset`. Rejected because (a) introduces a "danger button" in the running app, (b) requires a two-step workflow (deploy, then curl), (c) needs new auth-protected route just for an operational action.

### Decision 5: Startup self-check

When `semantic_search_enabled = 1` and a provider is configured, on `SchedulerService.init()`:

1. Call `provider.embed("howcani-startup-check")`.
2. **Success + correct length** → log info, register backfill cron.
3. **Success + wrong length** → fatal exit (config is wrong, failing fast is better than logging forever).
4. **Network failure** → log warning, register backfill cron anyway. Endpoint may come up shortly; backfill will retry.

Runs once per boot. Single HTTP call, negligible cost.

### Decision 6: Debug route for ranking comparison

```
GET /api/admin/search-debug?q=<query>&limit=10
Auth: owner JWT (same plugin as other admin/mutation routes)

Response:
{
  query: string,
  fts: [{ id, question, rank }],
  knn: [{ id, question, distance }],
  rrf: [{ id, question, score }]
}
```

Sits alongside the existing search code, calling the same FTS5 + KNN primitives but returning them un-merged for inspection. Used in dev for "did switching providers move my obvious answer from rank 1 to rank 7?" comparisons. Not a user-facing feature; no client UI.

### Decision 7: Provider-specific backfill delay

Currently `embedding-backfill.ts` has a hardcoded `Bun.sleep(200)` between calls — politeness for OpenRouter's rate limits. For a local llama.cpp server we own, this is pointless overhead. The provider exposes `backfillDelayMs`:

- `OpenRouterProvider.backfillDelayMs = 200`
- `LlamaCppProvider.backfillDelayMs = 0`

## Risks / Trade-offs

- **Risk:** Operator forgets `EMBEDDING_ALLOW_DIMENSION_RESET` after a successful reset, leaves it on indefinitely. → Mitigation: the flag is only consulted when a mismatch is detected; on a healthy deployment it has no effect.
- **Risk:** Self-check call on every boot wastes a tiny amount of compute and (on OpenRouter) a fraction of a cent. → Mitigation: accepted; cost is negligible relative to backfill workload.
- **Risk:** `LENGTH(embedding) / 4` assumes float32 storage forever; future float16/quantized formats would break this. → Mitigation: noted; not a current concern. Add a comment in the detection code.
- **Risk:** Two providers both speak OpenAI format, but llama.cpp's exact response shape can differ subtly (e.g., embedding nested differently). → Mitigation: write the provider with explicit shape parsing and an integration test using a recorded fixture.
- **Trade-off:** No backward-compat for old `OPENROUTER_API_KEY`-only deployments. The operator must set `EMBEDDING_PROVIDER`. Acceptable because the project has a single primary deployment under our control.

## Migration Plan

For the operator's primary OpenRouter deployment (no behavior change):

1. Deploy the new code with `EMBEDDING_PROVIDER=openrouter` set explicitly in docker-compose. Existing `OPENROUTER_API_KEY` continues to work.
2. Verify in logs: provider is openrouter, self-check passes, backfill runs normally.

For switching prod (or dev) to llama.cpp:

1. Set in docker-compose:
   ```
   EMBEDDING_PROVIDER=llamacpp
   EMBEDDING_ENDPOINT=https://llm.home.janbaer.de/v1/embeddings
   EMBEDDING_MODEL=nomic-embed-text-v1.5
   EMBEDDING_DIMENSION=768
   EMBEDDING_ALLOW_DIMENSION_RESET=true
   ```
2. Redeploy. Server detects 1536→768 mismatch, wipes embeddings, recreates `vec_items` at 768, boots, backfill repopulates.
3. After backfill completes (visible in logs), remove `EMBEDDING_ALLOW_DIMENSION_RESET` from docker-compose for hygiene. Next redeploy boots normally.

**Rollback:** Switch env back to openrouter values, re-add the reset flag, redeploy. Embeddings get wiped and regenerated under OpenRouter.

## Open Questions

None — all major decisions resolved in the design interview that produced this change.
