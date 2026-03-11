### Requirement: SQLite FTS5 Integration

The system MUST use SQLite FTS5 for efficient full-text search.

#### Scenario: FTS5 virtual table for items

- **WHEN** database migration version 9 runs
- **THEN** the system SHALL:
  - Drop existing `items_fts` virtual table and associated triggers
  - Recreate `items_fts` with `tokenize='unicode61 remove_diacritics 1'`
  - Index `question` and `answer` columns with `content=items, content_rowid=rowid`
  - Recreate AFTER INSERT trigger on `items` to insert into `items_fts`
  - Recreate AFTER UPDATE trigger on `items` to update `items_fts`
  - Recreate AFTER DELETE trigger on `items` to delete from `items_fts`
  - Backfill existing items into the new `items_fts` index

#### Scenario: FTS5 search query performance

- **WHEN** performing a search query on a user with 1000+ items
- **THEN** the system SHALL:
  - Use FTS5 MATCH syntax with sanitized user input
  - Append `*` to search terms for prefix matching
  - Return results ordered by BM25 relevance rank
  - Escape FTS5 special characters in user input

### Requirement: Query Term Normalization

The system MUST normalize query terms to match the form produced by the `unicode61 remove_diacritics` tokenizer, including ASCII umlaut transliterations.

#### Scenario: ASCII umlaut ae matches indexed ä

- **WHEN** the user searches for a term containing `ae` (e.g. "nachtraeglich")
- **THEN** the system SHALL normalize `ae→a` so the query matches items indexed from "nachträglich"

#### Scenario: ASCII umlaut oe matches indexed ö

- **WHEN** the user searches for a term containing `oe` (e.g. "vergroessern")
- **THEN** the system SHALL normalize `oe→o` so the query matches items indexed from "vergrössern"

#### Scenario: ASCII umlaut ue matches indexed ü

- **WHEN** the user searches for a term containing `ue` (e.g. "Uebersicht")
- **THEN** the system SHALL normalize `ue→u` so the query matches items indexed from "Übersicht"

### Requirement: Stop Word Filtering

The system MUST filter common stop words before constructing FTS5 queries to improve result precision.

#### Scenario: Stop words removed from query

- **WHEN** the user searches for a phrase containing German or English stop words (e.g. "wie kann ich die Festplatte vergrössern")
- **THEN** the system SHALL:
  - Remove stop words (wie, kann, ich, die, the, how, can, etc.) from the query
  - Build the FTS5 MATCH expression using only the remaining content terms
  - Require all content terms to appear in matching items (AND logic)

#### Scenario: All terms are stop words

- **WHEN** the user searches for a phrase where every term is a stop word (e.g. "wie kann ich")
- **THEN** the system SHALL fall back to OR logic using all original terms, returning items that match any of them

#### Scenario: Single content term after filtering

- **WHEN** only one content term remains after stop word filtering
- **THEN** the system SHALL search for that single term (AND == OR for one term, behavior unchanged)

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

#### Scenario: Search with umlauts

- **WHEN** searching for "Festplatte" on a system with items containing "Festplatte"
- **THEN** the system SHALL match correctly using the unicode61 tokenizer's diacritic normalization

#### Scenario: Hybrid search vector weight equals FTS5 weight

- **WHEN** hybrid search is active and the user submits a query
- **THEN** the system SHALL fetch 50 FTS5 candidates and 50 KNN candidates before RRF merging, giving vector similarity equal influence in the final ranking

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

- **WHEN** searching for "bun deployment" with items matching in question vs answer AND semantic search is disabled for the user
- **THEN** the system SHALL use FTS5 BM25 ranking with question weighted higher than answer via `bm25(items_fts, 10.0, 1.0)`

#### Scenario: Results without search use creation date ordering

- **WHEN** listing items without a search term (tag filter only or no filters)
- **THEN** the system SHALL order results by `created_at DESC` (most recent first)

#### Scenario: Hybrid RRF ranking used when semantic search is enabled

- **WHEN** user has `semantic_search_enabled = 1` and submits a search query
- **THEN** the system SHALL run both FTS5 and KNN vector search in parallel, merge results using Reciprocal Rank Fusion (`score = 1/(60+fts_rank) + 1/(60+vec_rank)`), and return items sorted by combined score descending

#### Scenario: Search falls back to FTS5 when embedding API fails

- **WHEN** user has `semantic_search_enabled = 1` but the OpenRouter API call for the query embedding fails
- **THEN** the system SHALL log a warning to stdout, use FTS5-only results, and return them normally without surfacing an error to the client

#### Scenario: Tag filtering applied after hybrid merge

- **WHEN** user has `semantic_search_enabled = 1` and submits a search with both text and tag filters
- **THEN** the system SHALL apply tag filters as a post-filter on the merged RRF result set
