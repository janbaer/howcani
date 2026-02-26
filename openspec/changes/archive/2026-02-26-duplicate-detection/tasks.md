## 1. Database Migration

- [x] 1.1 Add migration to `src/server/db/migrations.ts`: `ALTER TABLE users ADD COLUMN duplicate_threshold INTEGER NOT NULL DEFAULT 92`

## 2. Repository Layer

- [x] 2.1 Add `duplicate_threshold` field to `User` interface in `src/server/repositories/user.repository.ts`
- [x] 2.2 Add `updateDuplicateThreshold(id: string, threshold: number): void` method to `UserRepository`
- [x] 2.3 Add `findDuplicates(itemId: string, userId: string, thresholdPct: number, limit?: number)` method to `ItemRepository` — converts percentage to L2 distance threshold and queries `vec_items` with `WHERE distance <= ?`

## 3. Service Layer

- [x] 3.1 Add `getDuplicateItems(itemId: string, username: string): Result<RelatedItem[]>` method to `ItemService` — fetches owner's `duplicate_threshold`, calls `findDuplicates`, converts distances to relevance percentages
- [x] 3.2 Add `updateDuplicateThreshold(threshold: number): Result<void>` method to `SettingsService` — validates range 50–100, calls `userRepository.updateDuplicateThreshold`

## 4. API Routes

- [x] 4.1 Add `GET /:id/duplicates` route in `src/server/routes/item.routes.ts` — public endpoint mirroring `/:id/related`
- [x] 4.2 Add `PATCH /duplicate-threshold` route in `src/server/routes/settings.routes.ts` (or equivalent settings route file) that calls `settingsService.updateDuplicateThreshold`

## 5. Frontend — API Client

- [x] 5.1 Add `getDuplicates(username: string, itemId: string): Promise<RelatedItem[]>` to `src/client/lib/api.ts`
- [x] 5.2 Add `updateDuplicateThreshold(threshold: number): Promise<void>` to `src/client/lib/api.ts`

## 6. Frontend — DuplicatesPanel Component

- [x] 6.1 Create `src/client/components/DuplicatesPanel.svelte` mirroring `RelatedItemsPanel.svelte` — accepts `itemId` and `username` props, fetches duplicates on mount, shows relevance badges, hidden on mobile (`hidden md:block` or equivalent)

## 7. Frontend — Item Detail Page

- [x] 7.1 Import and render `DuplicatesPanel` in `src/client/pages/ItemDetail.svelte`, placed below the `RelatedItemsPanel`

## 8. Frontend — Settings Page

- [x] 8.1 Add duplicate threshold input (number, 50–100) to the settings page, wired to `updateDuplicateThreshold`

## 9. Tests & Lint

- [x] 9.1 Add unit tests for `ItemRepository.findDuplicates` in the existing repository spec
- [x] 9.2 Add unit tests for `ItemService.getDuplicateItems` in the existing service spec
- [x] 9.3 Add route tests for `GET /:id/duplicates` in the existing route spec
- [x] 9.4 Run `bun test` — all tests pass
- [x] 9.5 Run `bun run lint` — no lint errors
