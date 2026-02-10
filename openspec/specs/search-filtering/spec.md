## MODIFIED Requirements

### Requirement: SQLite FTS5 Integration

The system MUST use SQLite FTS5 for efficient full-text search.

#### Scenario: FTS5 virtual table for items

- **WHEN** database migration version 5 runs
- **THEN** the system SHALL:
  - Create FTS5 virtual table `items_fts` with `content=items, content_rowid=rowid`
  - Index `question` and `answer` columns
  - Create AFTER INSERT trigger on `items` to insert into `items_fts`
  - Create AFTER UPDATE trigger on `items` to update `items_fts`
  - Create AFTER DELETE trigger on `items` to delete from `items_fts`
  - Backfill existing items into `items_fts`

#### Scenario: FTS5 search query performance

- **WHEN** performing a search query on a user with 1000+ items
- **THEN** the system SHALL:
  - Use FTS5 MATCH syntax with sanitized user input
  - Append `*` to search terms for prefix matching
  - Return results ordered by BM25 relevance rank
  - Escape FTS5 special characters in user input

### Requirement: Full-Text Search

The system MUST provide fast, relevant full-text search across questions and answers.

#### Scenario: Search finds items by question text

- **WHEN** GET to `/api/john/items?search=deploy`
- **THEN** the system SHALL return only items containing "deploy" in the question field, matching case-insensitively

#### Scenario: Search finds items by answer text

- **WHEN** GET to `/api/john/items?search=deployment`
- **THEN** the system SHALL return items containing "deployment" in either question or answer fields, with full item details and tags

#### Scenario: Search finds items by partial word

- **WHEN** GET to `/api/john/items?search=kube`
- **THEN** the system SHALL return items matching the prefix "kube*" via FTS5 prefix matching

#### Scenario: Search returns empty for no matches

- **WHEN** GET to `/api/john/items?search=python` and no items match
- **THEN** the system SHALL return `{ items: [], total: 0 }` with status OK

#### Scenario: Search is case-insensitive

- **WHEN** searching for "bun", "BUN", or "Bun"
- **THEN** the system SHALL return the same results regardless of case

#### Scenario: Empty search returns all items

- **WHEN** GET to `/api/john/items?search=` (empty string)
- **THEN** the system SHALL return all items as if no search parameter was provided

#### Scenario: Search with FTS5 special characters

- **WHEN** searching for input containing FTS5 special characters like `AND`, `OR`, `"`, `*`
- **THEN** the system SHALL escape special characters and treat them as literal text

### Requirement: Tag Filtering

The system MUST allow filtering items by one or more tags.

#### Scenario: Filter by single tag

- **WHEN** GET to `/api/john/items?tags=bun`
- **THEN** the system SHALL return only items that have the "bun" tag, with full item details and all tags

#### Scenario: Filter by multiple tags (AND operation)

- **WHEN** GET to `/api/john/items?tags=bun,typescript`
- **THEN** the system SHALL return only items that have both "bun" AND "typescript" tags, using GROUP BY/HAVING COUNT to verify all tags are present

#### Scenario: Filter with no matching items

- **WHEN** GET to `/api/john/items?tags=python` and no items have that tag
- **THEN** the system SHALL return `{ items: [], total: 0 }` with status OK

#### Scenario: Filter ignores nonexistent tag names

- **WHEN** GET to `/api/john/items?tags=nonexistent`
- **THEN** the system SHALL return empty results without error

#### Scenario: Tag names matched case-insensitively

- **WHEN** filtering by tag "Bun" and the stored tag is "bun"
- **THEN** the system SHALL match tags case-insensitively using COLLATE NOCASE

### Requirement: Combined Search and Filtering

Users MUST be able to search and filter simultaneously.

#### Scenario: Search text AND filter by tag

- **WHEN** GET to `/api/john/items?search=deploy&tags=bun`
- **THEN** the system SHALL return only items matching "deploy" in FTS5 AND having the "bun" tag

#### Scenario: Multiple filters with pagination

- **WHEN** GET to `/api/john/items?search=config&tags=bun,typescript&limit=20&offset=20`
- **THEN** the system SHALL apply search filter, tag filters, and pagination together, returning the correct page of combined results with accurate total count

### Requirement: Search Result Ranking

Search results SHALL be ranked by relevance.

#### Scenario: Match in question ranks higher than answer

- **WHEN** searching for "bun deployment" with items matching in question vs answer
- **THEN** the system SHALL use FTS5 BM25 ranking with question weighted higher than answer via `bm25(items_fts, 10.0, 1.0)`

#### Scenario: Results without search use creation date ordering

- **WHEN** listing items without a search term (tag filter only or no filters)
- **THEN** the system SHALL order results by `created_at DESC` (most recent first)
