## Context

The HowCanI application stores FAQ items in SQLite with TEXT (UUID) primary keys. Items have questions, answers, and tag associations via a junction table. The current `GET /api/:username/items` endpoint supports pagination (`limit`/`offset`) but no search or filtering. The search-filtering spec requires FTS5 full-text search and tag-based AND filtering.

Key constraint: item IDs are UUIDs (TEXT), not INTEGER. The spec's FTS5 schema uses `content_rowid=id` which requires an INTEGER column. We need to adapt the FTS5 approach.

## Goals / Non-Goals

**Goals:**
- Full-text search across item question and answer fields via FTS5
- Tag-based AND filtering on the items list endpoint
- Combined search + tag filtering with pagination
- Relevance-based ranking (BM25) when searching
- Backfill existing items into FTS5 index on migration

**Non-Goals:**
- Frontend UI components (separate change)
- Fuzzy/typo-tolerant search (FTS5 prefix matching is sufficient)
- Search result highlighting/snippets
- Query result caching (premature for single-user home lab)

## Decisions

### 1. FTS5 with external content, using SQLite rowid

**Decision:** Use FTS5 external content table referencing the items table's implicit SQLite `rowid` (not the UUID `id` column).

**Rationale:** FTS5's `content_rowid` must reference an INTEGER column. Every SQLite table has an implicit integer `rowid`. We use `content=items, content_rowid=rowid` and join via `items.rowid = items_fts.rowid`.

**Alternative considered:** Standalone FTS5 table (no `content=` option) with manual sync. Rejected because it doubles storage and the trigger-based sync is more fragile without the built-in content table mechanism.

### 2. Tag filtering via HAVING COUNT with subquery

**Decision:** Use a single query with GROUP BY/HAVING to implement AND filtering for multiple tags, rather than multiple JOINs per tag.

```sql
SELECT items.* FROM items
JOIN item_tags ON items.id = item_tags.item_id
JOIN tags ON item_tags.tag_id = tags.id
WHERE items.user_id = ? AND tags.name IN (?, ?)
GROUP BY items.id
HAVING COUNT(DISTINCT tags.id) = ?
```

**Rationale:** Scales to any number of tags without dynamically generating JOIN clauses. The HAVING COUNT approach is standard SQL and performs well with existing indexes.

**Alternative considered:** Dynamic multi-JOIN approach (one JOIN per tag). Rejected because it requires SQL string building and becomes unwieldy with many tags.

### 3. Extend existing ItemRepository instead of new search module

**Decision:** Add `searchItems()` method to `ItemRepository` rather than creating a separate search module.

**Rationale:** The search is a query mode for items, not a separate domain. Keeping it in ItemRepository maintains the existing pattern. The method accepts optional `search` and `tags` parameters alongside pagination.

**Alternative considered:** Separate `SearchRepository` or `search.ts` module as suggested in the spec's implementation notes. Rejected because the query is fundamentally an item query with additional WHERE clauses, not a separate concern.

### 4. FTS5 query sanitization

**Decision:** Sanitize user search input by escaping FTS5 special characters and appending `*` for prefix matching.

**Rationale:** FTS5 MATCH syntax has special characters (`AND`, `OR`, `NOT`, `"`, `*`, etc.). Raw user input could cause query errors or unintended behavior. We escape special chars and wrap terms for safe prefix matching.

### 5. Migration with backfill

**Decision:** Migration version 5 creates FTS5 table, triggers, and backfills existing items in a single migration.

**Rationale:** After creating the virtual table and triggers, we need to populate it with existing data. This is a one-time operation that runs during the migration transaction.

## Risks / Trade-offs

**FTS5 rowid coupling** - Using implicit SQLite rowid means the FTS5 index is tightly coupled to SQLite internals. Mitigation: This is standard SQLite usage; rowid is stable and documented.

**Search input edge cases** - Users could input strings that break FTS5 syntax even after sanitization. Mitigation: Wrap sanitized input in quotes, fall back to LIKE query if FTS5 MATCH fails.

**Migration on large databases** - Backfilling FTS5 index scans all items. Mitigation: This is a home lab app with modest data; backfill will be fast. The migration runs in a transaction.

**Tag filter performance with many tags** - GROUP BY/HAVING on large item sets could be slow. Mitigation: Existing indexes on `item_tags(item_id)`, `item_tags(tag_id)`, and `items(user_id)` cover the query. For a home lab scale this is more than sufficient.
