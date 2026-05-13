# embedding-provider-debug Specification

## Purpose
TBD - created by archiving change add-llamacpp-embedding-provider. Update Purpose after archive.
## Requirements
### Requirement: Search Debug Endpoint

The system SHALL expose an owner-authenticated HTTP endpoint that returns FTS5, KNN, and RRF rankings side-by-side for a given query, enabling manual comparison of ranking quality across embedding providers.

#### Scenario: Authenticated owner requests debug results

- **WHEN** an authenticated owner sends `GET /api/admin/search-debug?q=<query>&limit=<n>` with a valid JWT
- **THEN** the system SHALL return HTTP 200 with a JSON body containing four fields:
  - `query` (string): the input query
  - `fts` (array): top-`limit` FTS5 BM25 results, each `{ id, question, rank }`
  - `knn` (array): top-`limit` KNN vector results, each `{ id, question, distance }` — empty array when no provider is configured or `semantic_search_enabled = 0`
  - `rrf` (array): top-`limit` RRF-merged results, each `{ id, question, score }` — empty array when no provider is configured or `semantic_search_enabled = 0`

#### Scenario: Unauthenticated request rejected

- **WHEN** an unauthenticated request hits `GET /api/admin/search-debug`
- **THEN** the system SHALL return HTTP 401 with no result data

#### Scenario: Default limit applied

- **WHEN** the `limit` query parameter is omitted
- **THEN** the system SHALL default to `limit=10`

#### Scenario: Empty query rejected

- **WHEN** the `q` parameter is empty, missing, or only whitespace
- **THEN** the system SHALL return HTTP 400 with a validation error

