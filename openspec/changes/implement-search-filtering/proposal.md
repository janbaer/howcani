## Why

The item listing endpoint (`GET /api/:username/items`) currently returns all items with basic pagination but no way to search or filter. Users need to find specific FAQ entries by text content and narrow results by tags. The search-filtering spec defines these capabilities using SQLite FTS5 for full-text search and tag-based AND filtering.

## What Changes

- Add SQLite FTS5 virtual table (`items_fts`) for indexing item question and answer fields
- Add database migration with FTS5 table, sync triggers (insert/update/delete), and backfill of existing items
- Extend `ItemRepository` with `search()` method supporting FTS5 queries, tag filtering, and combined search+filter
- Extend `ItemService.listItems()` to accept optional `search` and `tags` filter parameters
- Update `GET /api/:username/items` route to parse `search` and `tags` query parameters and pass them through
- Return active filters in response: `{ items, total, filters: { search, tags } }`

## Capabilities

### New Capabilities

(none - search-filtering spec already exists)

### Modified Capabilities

- `search-filtering`: Implementing the full-text search and tag filtering requirements defined in the existing spec
- `item-management`: Extending the item listing endpoint to support search and tag query parameters

## Impact

**Affected code:**
- `src/server/db/migrations.ts` - New migration (version 5) for FTS5 table and triggers
- `src/server/repositories/item.repository.ts` - Add search/filter query methods
- `src/server/services/item.service.ts` - Extend listItems with search/filter params
- `src/server/routes/item.routes.ts` - Parse search/tags query params
- New test files for search and filter functionality

**Dependencies:**
- SQLite FTS5 extension (built into Bun's SQLite)
- No new npm packages needed

**APIs:**
- `GET /api/:username/items` gains `?search=text&tags=tag1,tag2` query parameters
- Response shape adds `filters` object
