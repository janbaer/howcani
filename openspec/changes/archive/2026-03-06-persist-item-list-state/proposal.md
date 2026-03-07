## Why

When users navigate from the item list to a detail or settings page and return, their selected tag filters and search terms are lost. This forces them to re-apply filters every time they navigate away, disrupting the browsing flow.

## What Changes

- Selected tags are encoded in the URL as a `?tags=tag1,tag2` query param alongside the existing `?search=...` param
- `ItemListStore` reads `selectedTags` from the URL on initial load instead of starting empty
- `toggleTag` writes the updated tag selection back to the URL, keeping the URL in sync at all times
- The router's `navigate()` helper is used to update the URL without reloading the page

## Capabilities

### New Capabilities

- `item-list-state-persistence`: Persist selected tags and search terms in the URL so state survives navigation and is bookmarkable/shareable

### Modified Capabilities

- `search-filtering`: Tag filter state is now URL-driven (not ephemeral component state); search was already URL-driven via `?search=`, tags now follow the same pattern

## Impact

- `src/client/lib/router.svelte.ts` — expose a helper to update query params without full navigation
- `src/client/stores/item-list.store.svelte.ts` — read initial `selectedTags` from URL; write tags to URL on toggle
- `src/client/pages/ItemList.svelte` — pass URL tags into store on load; no major structural changes
- No backend changes; no new dependencies
