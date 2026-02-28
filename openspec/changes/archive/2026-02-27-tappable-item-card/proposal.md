## Why

On mobile devices, the item list cards have very small tap targets — only the question title text is tappable. This leads to a frustrating UX where users must precisely tap the title link to navigate to item detail pages. Making the entire card tappable aligns with mobile UX best practices.

## What Changes

- The entire `ItemCard` area becomes a tappable/clickable navigation target
- Clicks on interactive child elements (links, buttons) are still handled by those elements only

## Capabilities

### New Capabilities

None — this is an improvement to the existing item list UI.

### Modified Capabilities

- `frontend-ui`: Item cards in the list now have a card-wide tap target for navigation

## Impact

- `src/client/components/itemlist/ItemCard.svelte` — only file changed
- No backend, API, or database changes needed
