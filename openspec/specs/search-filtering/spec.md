# Search and Filtering Specification

## Purpose

Search and filtering enable users to discover relevant FAQ items through full-text search and tag-based filtering. These features work for both authenticated owners and anonymous visitors.

## Requirements

### Requirement: Full-Text Search

The system MUST provide fast, relevant full-text search across questions and answers.

#### Scenario: Search finds items by question text

**Given** user "john" has items:
- Question: "How do I deploy with Bun?"
- Question: "How do I configure TypeScript?"

**When** GET to `/api/john/items?search=deploy`

**Then** the system should:
- Return status `StatusCodes.OK`
- Return item with "deploy" in question
- Not return the TypeScript item
- Match case-insensitively

#### Scenario: Search finds items by answer text

**Given** user "john" has item:
- Question: "How do I build my app?"
- Answer: "Use `bun build` command for deployment"

**When** GET to `/api/john/items?search=deployment`

**Then** the system should:
- Return the item (match in answer)
- Search both question and answer fields
- Return full item details with tags

#### Scenario: Search finds items by partial word

**Given** user "john" has item with question "Kubernetes configuration"

**When** GET to `/api/john/items?search=kube`

**Then** the system should:
- Return the Kubernetes item
- Support prefix matching
- Use SQLite FTS5 for efficient search

#### Scenario: Search returns empty for no matches

**Given** user "john" has items about "bun" and "typescript"

**When** GET to `/api/john/items?search=python`

**Then** the system should:
- Return status `StatusCodes.OK`
- Return empty array: `{ items: [], total: 0 }`
- Not error on no results

#### Scenario: Search is case-insensitive

**Given** item with question "How do I use Bun?"

**When** searching for:
- "bun"
- "BUN"
- "Bun"

**Then** the system should:
- Return the item for all variations
- Match case-insensitively

#### Scenario: Empty search returns all items

**Given** user "john" has multiple items

**When** GET to `/api/john/items?search=` (empty string)

**Then** the system should:
- Return all items (no filter)
- Same as requesting without search parameter
- Apply pagination normally

### Requirement: Tag Filtering

The system MUST allow filtering items by one or more tags.

#### Scenario: Filter by single tag

**Given** user "john" has items:
- Item A: tags ["bun", "deployment"]
- Item B: tags ["typescript", "configuration"]
- Item C: tags ["bun", "typescript"]

**When** GET to `/api/john/items?tags=bun`

**Then** the system should:
- Return items A and C (both have "bun" tag)
- Not return item B
- Return full item details with all tags

#### Scenario: Filter by multiple tags (AND operation)

**Given** user "john" has items:
- Item A: tags ["bun", "deployment"]
- Item B: tags ["bun", "typescript"]
- Item C: tags ["typescript", "deployment"]

**When** GET to `/api/john/items?tags=bun,typescript`

**Then** the system should:
- Return only item B (has both "bun" AND "typescript")
- Not return A (missing typescript) or C (missing bun)
- Use AND logic (item MUST have all specified tags)

#### Scenario: Filter with no matching items

**Given** user "john" has items tagged with "bun" and "deployment"

**When** GET to `/api/john/items?tags=python`

**Then** the system should:
- Return status `StatusCodes.OK`
- Return empty array: `{ items: [], total: 0 }`
- Not error on no results

#### Scenario: Filter ignores invalid tag names

**Given** user "john" has various tagged items

**When** GET to `/api/john/items?tags=nonexistent`

**Then** the system should:
- Return empty results (tag doesn't exist)
- Not error on invalid tag
- Gracefully handle missing tags

### Requirement: Combined Search and Filtering

Users MUST be able to search and filter simultaneously.

#### Scenario: Search text AND filter by tag

**Given** user "john" has items:
- Item A: question "Deploy Bun app", tags ["bun", "deployment"]
- Item B: question "Configure Bun", tags ["bun", "config"]
- Item C: question "Deploy TypeScript", tags ["typescript", "deployment"]

**When** GET to `/api/john/items?search=deploy&tags=bun`

**Then** the system should:
- Return only item A
- Match "deploy" in search
- AND has "bun" tag
- Apply both filters together

#### Scenario: Multiple filters with pagination

**Given** user "john" has 100 items matching criteria

**When** GET to `/api/john/items?search=config&tags=bun,typescript&limit=20&offset=20`

**Then** the system should:
- Apply search filter
- Apply tag filters
- Return items 21-40 of matching results
- Include total count of all matches

### Requirement: SQLite FTS5 Integration

The system MUST use SQLite FTS5 for efficient full-text search.

#### Scenario: FTS5 virtual table for items

**Given** database initialization

**When** creating tables

**Then** the system should:
- Create FTS5 virtual table for items
- Index question and answer fields
- Keep FTS5 table in sync with items table
- Use triggers for automatic updates

#### Scenario: FTS5 search query performance

**Given** user has 1000+ items

**When** performing search query

**Then** the system should:
- Use FTS5 match syntax: `MATCH 'search term'`
- Return results in under 100ms (typically)
- Rank results by relevance
- Support prefix matching with `*` suffix

### Requirement: Search Result Ranking

Search results SHALL be ranked by relevance.

#### Scenario: Match in question ranks higher than answer

**Given** two items:
- Item A: question "Bun deployment", answer "Configure your server"
- Item B: question "Server setup", answer "Use Bun for deployment"

**When** GET to `/api/john/items?search=bun deployment`

**Then** the system should:
- Return item A before item B
- Prioritize question matches
- Use FTS5 BM25 ranking

#### Scenario: Multiple term matches rank higher

**Given** two items:
- Item A: contains "deploy" once
- Item B: contains "deploy" three times

**When** GET to `/api/john/items?search=deploy`

**Then** the system should:
- Return item B before item A
- Higher term frequency = higher rank
- Use FTS5 default ranking

### Requirement: Filter UI Integration

The API MUST support tag sidebar filtering workflow.

#### Scenario: Get filter-ready tag list

**Given** user "john" has items with various tags

**When** GET to `/api/john/tags`

**Then** the system should:
- Return all tags with item counts
- Enable UI to show "bun (5)" format
- Allow click to filter by that tag
- Update URL to `?tags=bun`

#### Scenario: Active filter indication

**Given** currently filtering by tags "bun,typescript"

**When** displaying tag sidebar

**Then** the UI should:
- Highlight "bun" and "typescript" tags as active
- Show "Clear filters" button
- Allow clicking active tag to remove it from filter

## Database Schema

### FTS5 Virtual Table

```sql
-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE items_fts USING fts5(
    question,
    answer,
    content=items,
    content_rowid=id
);

-- Triggers to keep FTS5 in sync
CREATE TRIGGER items_fts_insert AFTER INSERT ON items BEGIN
    INSERT INTO items_fts(rowid, question, answer)
    VALUES (new.id, new.question, new.answer);
END;

CREATE TRIGGER items_fts_update AFTER UPDATE ON items BEGIN
    UPDATE items_fts
    SET question = new.question, answer = new.answer
    WHERE rowid = new.id;
END;

CREATE TRIGGER items_fts_delete AFTER DELETE ON items BEGIN
    DELETE FROM items_fts WHERE rowid = old.id;
END;
```

## API Query Parameters

```
GET /api/:username/items
  Query Parameters:
    - search: string (full-text search term)
    - tags: string (comma-separated tag names, AND operation)
    - limit: number (default 50, max 100)
    - offset: number (default 0)

  Response:
    {
      items: [...],
      total: number,
      filters: {
        search: string | null,
        tags: string[] | null
      }
    }
```

## Testing Requirements

- Test-first for search and filter logic
- Test FTS5 queries with various terms
- Test tag filtering (single and multiple)
- Test combined search + filter
- Test ranking and relevance
- Test pagination with filters
- Test empty results gracefully
- Test special characters in search terms
- Use in-memory SQLite with FTS5 enabled

## Implementation Notes

### Domain Layer Structure

```
src/server/db/search.ts
  - Search query builder
  - FTS5 query generation
  - Ranking logic

src/server/db/search.spec.ts
  - Search functionality tests

src/server/db/repositories/item-repository.ts
  - Add search() method
  - Add filterByTags() method
  - Combine with pagination

src/server/api/items.ts
  - Parse search/tags query params
  - Call repository methods
  - Return filtered results
```

### FTS5 Query Examples

```typescript
// Simple search
SELECT items.* FROM items
JOIN items_fts ON items.id = items_fts.rowid
WHERE items_fts MATCH 'deploy'
AND items.user_id = ?

// Prefix search
WHERE items_fts MATCH 'kube*'

// Multiple terms (AND)
WHERE items_fts MATCH 'bun AND deploy'

// Ranking
ORDER BY items_fts.rank
```

### Tag Filter Query

```typescript
// Filter by tags (AND operation)
SELECT items.* FROM items
JOIN item_tags it1 ON items.id = it1.item_id
JOIN tags t1 ON it1.tag_id = t1.id AND t1.name = 'bun'
JOIN item_tags it2 ON items.id = it2.item_id
JOIN tags t2 ON it2.tag_id = t2.id AND t2.name = 'typescript'
WHERE items.user_id = ?
GROUP BY items.id
HAVING COUNT(DISTINCT t1.id) > 0 AND COUNT(DISTINCT t2.id) > 0
```

### Performance Considerations

- FTS5 index for fast full-text search
- Indexes on user_id for filtering
- Indexes on item_tags foreign keys
- Pagination to limit result set size
- Consider query result caching for frequently accessed filters

### Cross-Reference

- **Related**: [item-management/spec.md] for item structure
- **Related**: [tag-management/spec.md] for tag operations
- **Related**: [frontend-ui/spec.md] for search/filter UI components
