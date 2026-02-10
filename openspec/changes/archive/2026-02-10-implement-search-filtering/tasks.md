## 1. Database Migration

- [x] 1.1 Add migration version 5: create FTS5 virtual table `items_fts` with `content=items, content_rowid=rowid`
- [x] 1.2 Add AFTER INSERT trigger on `items` to insert into `items_fts`
- [x] 1.3 Add AFTER UPDATE trigger on `items` to update `items_fts`
- [x] 1.4 Add AFTER DELETE trigger on `items` to delete from `items_fts`
- [x] 1.5 Backfill existing items into `items_fts` within the migration
- [x] 1.6 Test migration runs cleanly on fresh and existing databases

## 2. Repository Layer

- [x] 2.1 Add FTS5 input sanitization helper (escape special chars, append `*` for prefix matching)
- [x] 2.2 Add `searchItems()` method to `ItemRepository` with optional `search`, `tags`, `limit`, `offset` parameters
- [x] 2.3 Implement FTS5 search query with BM25 ranking (`bm25(items_fts, 10.0, 1.0)`) and user_id scoping
- [x] 2.4 Implement tag AND filtering via GROUP BY/HAVING COUNT with case-insensitive tag name matching
- [x] 2.5 Implement combined search + tag filter query
- [x] 2.6 Return accurate `total` count for filtered/searched results (separate COUNT query)
- [x] 2.7 Write integration tests for search (question match, answer match, prefix match, case-insensitive, empty, special chars)
- [x] 2.8 Write integration tests for tag filtering (single tag, multiple tags AND, nonexistent tag, case-insensitive)
- [x] 2.9 Write integration tests for combined search + tag filter with pagination

## 3. Service Layer

- [x] 3.1 Add `SearchFilters` interface with optional `search` and `tags` fields
- [x] 3.2 Extend `ItemService.listItems()` to accept `SearchFilters` and delegate to `searchItems()` when filters are present
- [x] 3.3 Add `filters` object to the `PaginatedItemsResult` response (`{ search: string | null, tags: string[] | null }`)
- [x] 3.4 Write unit tests for service layer search/filter pass-through

## 4. Route Layer

- [x] 4.1 Add `search` and `tags` query parameters to `GET /api/:username/items` Elysia schema
- [x] 4.2 Parse `tags` query string (comma-separated) into string array
- [x] 4.3 Pass parsed search/tags to `itemService.listItems()`
- [x] 4.4 Include `filters` object in JSON response
- [x] 4.5 Write route tests for search query param, tags query param, combined filters, and empty filters

## 5. Verification

- [x] 5.1 Run all tests and ensure they pass
- [x] 5.2 Run linter and fix any issues

## Dependencies

- Task 1 (Database) blocks Task 2 (Repository)
- Task 2 (Repository) blocks Task 3 (Service)
- Task 3 (Service) blocks Task 4 (Route)
- Task 1 can be worked on immediately

## Parallelizable Work

- 2.1 (sanitization helper) can be done in parallel with 1.1-1.6
- 4.1-4.2 (route schema changes) can be started in parallel with 3.1-3.4
