## Why

Knowledge bases accumulate subtle duplicates over time. Surfacing semantically near-identical items lets users merge or clean them up, keeping the base clean and search results precise.

## What Changes

- Add a new API endpoint that returns duplicate candidates for a given item (items with cosine similarity above a configurable threshold)
- Add a "Possible Duplicates" panel on the item detail page, displayed below the Related Items panel, visible only on desktop and tablet
- Add a duplicate similarity threshold setting (default 92%) to the user settings page

## Capabilities

### New Capabilities

- `duplicate-detection`: API endpoint and detail-page panel that surfaces items semantically very close to the current item using cosine similarity on stored embeddings, with a user-configurable threshold

### Modified Capabilities

- `user-management`: Add `duplicate_threshold` user setting (integer 0–100, default 92) stored in the `users` table

## Impact

- **Backend**: New route `GET /api/:username/items/:id/duplicates`, new repository method on `ItemRepository`, updated `UserRepository` for the new setting
- **Frontend**: New `DuplicatesPanel` component (mirrors `RelatedItemsPanel`), updated settings page, updated `ItemDetail` page
- **Database**: Add `duplicate_threshold` column to `users` table via migration
- **Dependencies**: No new dependencies — reuses sqlite-vec KNN infrastructure already in place
