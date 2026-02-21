## MODIFIED Requirements

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
