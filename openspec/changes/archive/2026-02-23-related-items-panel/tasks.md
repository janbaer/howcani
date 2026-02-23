## 1. Backend: Repository

- [x] 1.1 Add `findRelated(itemId, userId, limit)` method to `item.repository.ts` that queries `vec_items` for KNN nearest neighbours, excludes the current item, and returns up to `limit` items with tags
- [x] 1.2 Add repository tests for `findRelated` in `item.repository.spec.ts` covering: returns similar items, excludes self, returns empty when no embedding, returns empty when vec unavailable

## 2. Backend: Service

- [x] 2.1 Add `getRelatedItems(itemId, username)` method to `item.service.ts` that looks up the user, calls `findRelated`, and returns `Result<ItemWithTags[]>`
- [x] 2.2 Add service tests for `getRelatedItems` covering: happy path, item not found, no embedding (empty result)

## 3. Backend: Route

- [x] 3.1 Add `GET /:id/related` route to `item.routes.ts` (public, no auth required) that calls `itemService.getRelatedItems` and returns the array
- [x] 3.2 Add route tests covering: 200 with results, 200 empty array, 404 for unknown item

## 4. Frontend: API client

- [x] 4.1 Add `getRelatedItems(username, itemId)` method to the API client (`src/client/lib/api.ts`)

## 5. Frontend: Component

- [x] 5.1 Create `src/client/components/RelatedItemsPanel.svelte` — collapsible panel accepting `username` and `itemId` as props, lazy-loads items on first expand, shows links to detail pages, handles empty state and loading state

## 6. Frontend: Integration

- [x] 6.1 Add `RelatedItemsPanel` to `src/client/pages/ItemDetail.svelte` below the answer section, passing `username` and `item.id`
