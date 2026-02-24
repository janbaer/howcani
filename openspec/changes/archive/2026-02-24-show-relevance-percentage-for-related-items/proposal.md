## Why

When browsing related items, users have no way to assess how closely matched each suggestion is. Showing a relevance percentage helps distinguish strong matches (90%+) from weaker ones (70%), making it easier to judge whether a related item is genuinely useful or a possible false positive.

## What Changes

- The `findRelated` repository method now returns items with their cosine similarity score alongside each result
- The `/api/:username/items/:id/related` endpoint returns `relevance` (0–100 integer) for each item
- The `RelatedItemsPanel` component displays a subtle percentage badge after each related item's question text

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `related-items`: API response now includes a `relevance` percentage field per item; UI displays it as a badge

## Impact

- `src/server/repositories/item.repository.ts` — `findRelated` returns `{ item, score }` pairs; score derived from sqlite-vec L2 distance converted to cosine similarity
- `src/server/services/item.service.ts` — maps new repository return shape
- `src/server/routes/item.routes.ts` — response includes `relevance` field
- `src/client/lib/api.ts` — `Item` type (or response type) gains optional `relevance: number`
- `src/client/components/RelatedItemsPanel.svelte` — renders badge after question text
- `src/server/repositories/item.repository.spec.ts` — tests verify score is returned
