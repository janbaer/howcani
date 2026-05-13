## 1. Provider Abstraction

- [x] 1.1 Define `EmbeddingProvider` interface in `src/server/services/embedding-providers/embedding-provider.ts` with `model`, `dimension`, `backfillDelayMs`, and `embed(text)` members
- [x] 1.2 Implement `OpenRouterProvider` (existing URL, Bearer auth, delay 200ms) in `src/server/services/embedding-providers/openrouter.provider.ts`
- [x] 1.3 Implement `LlamaCppProvider` (env-driven URL, no auth, delay 0ms) in `src/server/services/embedding-providers/llamacpp.provider.ts`
- [x] 1.4 Implement `createEmbeddingProvider()` factory in `src/server/services/embedding-providers/factory.ts`
- [x] 1.5 Refactor `EmbeddingService` to hold a `provider: EmbeddingProvider | null` and delegate `embedText` to it
- [x] 1.6 Unit tests for factory and `LlamaCppProvider` (asserts no Authorization header)

## 2. Configurable Vector Dimension

- [x] 2.1 Read `EMBEDDING_DIMENSION` (default 1536) in `src/server/services/embedding-config.ts`
- [x] 2.2 Update migration 7 in `src/server/db/migrations.ts` to interpolate the configured dimension into the `vec_items` CREATE statement
- [x] 2.3 Verified existing migration tests pass with default 1536

## 3. Startup Mismatch Detection

- [x] 3.1 Added `embeddingRepository.detectStoredShape()` returning model list + dimension
- [x] 3.2 Added `embeddingRepository.wipeAndRebuildVecItems(dimension)` that DELETEs + recreates `vec_items` in one transaction
- [x] 3.3 Added `verifyEmbeddingShape()` in `src/server/services/embedding-startup.ts`
- [x] 3.4 Calling `verifyEmbeddingShape()` from `src/server/index.ts` after `runMigrations()`
- [x] 3.5 Unit tests: no rows, matching shape, mismatch+flag-off (exits), mismatch+flag-on (wipes), multiple-models case

## 4. Startup Self-Check

- [x] 4.1 Added `selfCheck()` to `EmbeddingService` validating returned vector length
- [x] 4.2 Invoked `selfCheck()` from `SchedulerService.applyEmbeddingSettings()` before registering the cron
- [x] 4.3 Unit tests for `selfCheck()`: correct length, wrong length (throws), null (unreachable)

## 5. Provider-Specific Backfill Delay

- [x] 5.1 Updated `embedding-backfill.ts` to read delay from `embeddingService.provider?.backfillDelayMs`
- [x] 5.2 Removed the hardcoded `200` literal
- [x] 5.3 Covered indirectly via integration; the field is provider-defined and falls back to 0 when no provider

## 6. Search Debug Endpoint

- [x] 6.1 Created `src/server/routes/admin.routes.ts` exposing `GET /api/admin/search-debug?q=&limit=` behind owner-auth
- [x] 6.2 Validates `q` non-empty (400), default `limit=10`, returns `{ query, fts, knn, rrf }`
- [x] 6.3 Wired `adminRoutes` into the Elysia tree in `src/server/index.ts`
- [x] 6.4 Tests: unauth → 401, empty/missing query → 400, out-of-range limit → 400

## 7. Wire-Up, Cleanup, and Smoke Checks

- [x] 7.1 Removed direct `OPENROUTER_API_KEY` / `OPENROUTER_EMBEDDINGS_URL` references from `embedding.service.ts`
- [x] 7.2 Updated `.env.example` with the new env vars (docker-compose already reads from `.env` so no compose changes needed)
- [x] 7.3 `bun run lint && bun run build && bun test` all pass (510 pass, 1 skip, 0 fail)
- [ ] 7.4 Manually exercise the "How to Test" scenarios from issue #94 (operator-driven, after merge)
