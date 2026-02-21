## 1. Dependencies & Database Setup

- [x] 1.1 Verify `sqlite-vec` is in `package.json` dependencies (already installed in dev, confirm it's in `dependencies` not `devDependencies`)
- [x] 1.2 Load `sqlite-vec` extension in `src/server/db/database.ts` using `import { load } from 'sqlite-vec'` and `load(db)` after the database is created; log a warning to stdout if load fails
- [x] 1.3 Add migration version 6 to `src/server/db/migrations.ts`: create `item_embeddings` table with `item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE`, `embedding BLOB NOT NULL`, `model TEXT NOT NULL`, `created_at TEXT NOT NULL`
- [x] 1.4 Add migration version 7 to `src/server/db/migrations.ts`: create `vec_items` virtual table using `vec0(item_id TEXT PRIMARY KEY, embedding float[1536])`
- [x] 1.5 Add migration version 8 to `src/server/db/migrations.ts`: `ALTER TABLE users ADD COLUMN semantic_search_enabled INTEGER NOT NULL DEFAULT 0`
- [ ] 1.6 Run `bun run dev` and confirm all three migrations run without error

## 2. Embedding Service

- [x] 2.1 Create `src/server/services/embedding.service.ts` with an `EmbeddingService` class that reads `OPENROUTER_API_KEY` and `EMBEDDING_MODEL` (default `openai/text-embedding-3-small`) from `process.env`
- [x] 2.2 Implement `embedText(text: string): Promise<Float32Array | null>` — POST to `https://openrouter.ai/api/v1/embeddings`, return the float32 vector or `null` on failure (log warning to stdout)
- [x] 2.3 Implement `upsertEmbedding(itemId: string, vector: Float32Array): void` — upsert into both `item_embeddings` and `vec_items` within a transaction
- [x] 2.4 Implement `deleteEmbedding(itemId: string): void` — delete from `item_embeddings` (CASCADE handles `vec_items` if supported, otherwise delete explicitly)
- [x] 2.5 Export a singleton `embeddingService` instance from the file
- [x] 2.6 Write unit tests in `src/server/services/embedding.service.spec.ts` with a mocked `fetch`, verifying: successful embed+upsert, API failure returns null and logs warning, missing API key skips the call

## 3. Item Service Integration

- [x] 3.1 In `src/server/services/item.service.ts`, import `embeddingService` and after a successful `createItem` transaction, call `embeddingService.embedText(question + "\n" + answer).then(v => v && embeddingService.upsertEmbedding(item.id, v))` (fire-and-forget, catch and log errors)
- [x] 3.2 Do the same after a successful `updateItem` transaction
- [x] 3.3 In `deleteItem`, call `embeddingService.deleteEmbedding(itemId)` after the repository delete
- [x] 3.4 Update `item.service.spec.ts` mock to include `embeddingService` mock methods; verify they are called on create/update/delete

## 4. Hybrid Search

- [x] 4.1 Add `searchHybrid(userId: string, search: string, tags: string[] | undefined, limit: number, offset: number): PaginatedResult<Item>` to `src/server/repositories/item.repository.ts`
- [x] 4.2 Inside `searchHybrid`: run `searchOnly` to get FTS5 ranked results (fetch top 200 without pagination), run a `vec_items` KNN query to get top 200 by vector similarity, merge with RRF formula `1/(60+rank_fts) + 1/(60+rank_vec)`, apply tag post-filter if tags provided, apply pagination to merged result
- [x] 4.3 Update `searchItems` in `item.repository.ts` to accept a `useHybrid?: boolean` option, and when true call `searchHybrid` instead of `searchOnly`/`searchWithTags`
- [x] 4.4 Write integration tests in `item.repository.spec.ts` for `searchHybrid` using a fixture DB with pre-computed embeddings inserted directly (no live API calls): verify RRF merge logic, fallback when vec_items is empty, tag post-filtering

## 5. Settings Service & API

- [x] 5.1 Create `src/server/services/settings.service.ts` with `getSettings(userId: string): { semanticSearchEnabled: boolean }` and `updateSettings(userId: string, patch: { semanticSearchEnabled?: boolean }): { semanticSearchEnabled: boolean }`
- [x] 5.2 Add `findById` and `updateSettings` (update `semantic_search_enabled`) to `src/server/repositories/user.repository.ts` if not already present; or update `UserRepository.update()` to accept `semanticSearchEnabled`
- [x] 5.3 Create `src/server/routes/settings.routes.ts` with `GET /api/settings` and `PATCH /api/settings`, both protected by `authPlugin`, reading/writing via `settingsService`
- [x] 5.4 Export `settingsRoutes` from `src/server/routes/index.ts` and add `.use(settingsRoutes)` in `src/server/index.ts`
- [x] 5.5 Write route tests in `src/server/routes/settings.routes.spec.ts`: GET returns current settings, PATCH updates and returns new values, unauthenticated returns 401

## 6. MCP Integration

- [x] 6.1 In `src/server/mcp/tools.ts`, update `searchItems` to read `user.semantic_search_enabled` via `userRepo.findById(resolved.userId)`
- [x] 6.2 Pass `useHybrid: user.semantic_search_enabled === 1` to `itemRepo.searchItems`
- [x] 6.3 In `searchItems` of `item.repository.ts`, when `useHybrid` is true, call `embeddingService.embedText(search)` first; if it returns `null`, fall back to FTS5-only path

## 7. Cron Job

- [x] 7.1 Create `src/server/cron.ts` with a `startCron()` function that uses `setInterval` (5 minutes) to query `SELECT items.id, items.question, items.answer FROM items LEFT JOIN item_embeddings ON items.id = item_embeddings.item_id WHERE item_embeddings.item_id IS NULL LIMIT 20`
- [x] 7.2 For each missing item, call `embeddingService.embedText(...)` and `upsertEmbedding(...)`, logging progress
- [x] 7.3 Only start the interval if `OPENROUTER_API_KEY` is set; otherwise log a one-time message at startup
- [x] 7.4 Call `startCron()` from `src/server/index.ts` after `runMigrations()`

## 8. Settings UI

- [x] 8.1 Create `src/client/pages/Settings.svelte` with a heading "Settings" and a toggle row "Semantic search" — fetch current setting via `GET /api/settings` on mount, PATCH on toggle change
- [x] 8.2 Add API functions `getSettings()` and `updateSettings(patch)` to `src/client/lib/api.ts`
- [x] 8.3 Add a `/settings` route to `src/client/App.svelte` (or wherever routing is defined)
- [x] 8.4 Add `'/settings': index` to the `routes` map in `src/server/index.ts` for SPA routing
- [x] 8.5 Add a "Settings" link in the navigation header (`src/client/components/Header.svelte`)

## 9. Verification

- [x] 9.1 Run the full test suite: `bun test`
- [ ] 9.2 Start the dev server, create an item, confirm an embedding is generated (check `item_embeddings` table)
- [ ] 9.3 Enable semantic search in the Settings UI, search for a synonym of an item's content, confirm relevant results appear
- [ ] 9.4 Disable `OPENROUTER_API_KEY`, confirm server starts, items save, and search falls back to FTS5 without errors
- [x] 9.5 Commit all changes
