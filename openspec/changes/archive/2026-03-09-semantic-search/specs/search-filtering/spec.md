## MODIFIED Requirements

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
