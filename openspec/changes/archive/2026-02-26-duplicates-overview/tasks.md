## 1. Repository Layer

- [x] 1.1 Add `findAllDuplicates(userId: string, threshold: number)` to `ItemRepository` — fetches all items with embeddings for the user, runs `findDuplicates` per item, deduplicates symmetric pairs, returns grouped results

## 2. Service Layer

- [x] 2.1 Add `getAllDuplicates(username: string): Result<DuplicateGroup[]>` to `ItemService` — resolves user, reads `duplicate_threshold`, calls `itemRepository.findAllDuplicates`, converts distances to relevance percentages, attaches tags

## 3. API Route

- [x] 3.1 Add `GET /:username/duplicates` route to `src/server/routes/user.routes.ts` (or a new top-level route) — public endpoint, returns `{ groups: DuplicateGroup[] }`

## 4. Frontend — API Client

- [x] 4.1 Add `DuplicateGroup` type to `src/client/lib/api.ts`
- [x] 4.2 Add `getAllDuplicates(username: string): Promise<ApiResponse<{ groups: DuplicateGroup[] }>>` to the `items` API object in `src/client/lib/api.ts`

## 5. Frontend — Settings Page

- [x] 5.1 Add `duplicateGroups` state and fetch logic to `Settings.svelte` — called on load alongside existing settings fetch
- [x] 5.2 Add "Possible duplicates" section to the Settings page template — grouped list with primary item links and indented duplicate links with relevance badges, loading skeleton, and empty state

## 6. Tests & Lint

- [x] 6.1 Add unit tests for `ItemRepository.findAllDuplicates` in the existing repository spec
- [x] 6.2 Add unit tests for `ItemService.getAllDuplicates` in the existing service spec
- [x] 6.3 Add route tests for `GET /:username/duplicates`
- [x] 6.4 Run `bun test` — all tests pass
- [x] 6.5 Run `bun run lint` — no lint errors
