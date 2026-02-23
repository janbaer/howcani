## Why

Users often have related knowledge entries they've forgotten about. The detail page currently shows only the item being viewed, missing an opportunity to surface semantically similar entries using the vector search infrastructure already in place.

## What Changes

- Add a collapsed "Related items" section at the bottom of the item detail page
- On expand, lazily load the top 3–5 semantically similar items via KNN vector search
- Render related items as clickable links navigating to their detail pages
- Add a new API endpoint to retrieve related items by item ID

## Capabilities

### New Capabilities

- `related-items`: Surface semantically similar items on the detail page using KNN vector search, with lazy loading on panel expand

### Modified Capabilities

- `item-management`: Detail page gains a collapsible related-items panel (UI change only, no breaking requirement change)

## Impact

- **Backend**: New repository method and API route `/api/items/:id/related`
- **Frontend**: Svelte detail page component gets a collapsible panel with lazy-loaded links
- **Database**: Reads from existing `vec_items` table — no schema changes
- **Dependencies**: No new dependencies
