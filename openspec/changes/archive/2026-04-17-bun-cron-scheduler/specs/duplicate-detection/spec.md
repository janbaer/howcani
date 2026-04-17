## MODIFIED Requirements

### Requirement: Fetch duplicate candidates via API

The system SHALL provide a public endpoint to retrieve semantically near-duplicate items for a given item. Items whose cosine similarity to the queried item is at or above the global `app_settings.duplicate_threshold` (expressed as a percentage) SHALL be returned, up to a maximum of 10 results. Each item in the response SHALL include a `relevance` field — an integer percentage (0–100) representing cosine similarity to the queried item.

#### Scenario: Returns duplicate candidates above threshold

- **WHEN** GET `/api/:username/items/:id/duplicates` is called for an item with an embedding, and `app_settings.duplicate_threshold` is 80
- **THEN** the system returns HTTP 200 with an array of items (up to 10) whose cosine similarity is ≥ 80%, each with `id`, `question`, `answer`, and `relevance` (integer 0–100), ordered by descending relevance, excluding the requested item itself

#### Scenario: Threshold change takes immediate effect without a restart

- **WHEN** `duplicate_threshold` is updated from `80` to `90` via `PATCH /api/settings`
- **AND** a subsequent GET `/api/:username/items/:id/duplicates` is made
- **THEN** the new threshold of `90` is applied

#### Scenario: Returns empty array when no duplicates exceed threshold

- **WHEN** GET `/api/:username/items/:id/duplicates` is called and no other item meets the similarity threshold
- **THEN** the system returns HTTP 200 with an empty array

#### Scenario: Returns empty array when item has no embedding

- **WHEN** GET `/api/:username/items/:id/duplicates` is called for an item without a stored embedding
- **THEN** the system returns HTTP 200 with an empty array

#### Scenario: Returns empty array when sqlite-vec is unavailable

- **WHEN** GET `/api/:username/items/:id/duplicates` is called and the sqlite-vec extension is not loaded
- **THEN** the system returns HTTP 200 with an empty array

#### Scenario: Returns 404 for non-existent item

- **WHEN** GET `/api/:username/items/:id/duplicates` is called for an item that does not exist
- **THEN** the system returns HTTP 404

#### Scenario: No authentication required

- **WHEN** GET `/api/:username/items/:id/duplicates` is called without an Authorization header
- **THEN** the system returns HTTP 200 (public endpoint)
