## 1. Repository Layer

- [x] 1.1 Update `findRelated` in `item.repository.ts` to select `vec_items.distance` alongside `item_id` and return `Array<{ item: Item; distance: number }>`
- [x] 1.2 Update repository spec to verify the returned items include a `distance` value

## 2. Service & Route Layer

- [x] 2.1 Update `ItemService.getRelatedItems` to convert L2 distance to cosine similarity percentage and return items with `relevance: number`
- [x] 2.2 Update `item.routes.ts` to pass `relevance` through to the JSON response
- [x] 2.3 Update route spec to assert `relevance` field is present in the response

## 3. Client Layer

- [x] 3.1 Add optional `relevance?: number` to the `Item` type in `src/client/lib/api.ts`
- [x] 3.2 Update `RelatedItemsPanel.svelte` to display a muted percentage badge after each item's question text
