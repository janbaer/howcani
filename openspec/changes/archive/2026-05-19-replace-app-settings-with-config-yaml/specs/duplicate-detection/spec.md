## MODIFIED Requirements

### Requirement: Fetch duplicate candidates via API

The system SHALL provide a public endpoint to retrieve semantically near-duplicate items for a given item. Items whose cosine similarity to the queried item is at or above the global `config.yaml` `duplicate.threshold` (expressed as a percentage) SHALL be returned, up to a maximum of 10 results. Each item in the response SHALL include a `relevance` field — an integer percentage (0–100) representing cosine similarity to the queried item.

#### Scenario: Returns duplicate candidates above threshold

- **WHEN** GET `/api/:username/items/:id/duplicates` is called for an item with an embedding, and `duplicate.threshold` is 80
- **THEN** the system returns HTTP 200 with an array of items (up to 10) whose cosine similarity is ≥ 80%, each with `id`, `question`, `answer`, and `relevance` (integer 0–100), ordered by descending relevance, excluding the requested item itself

#### Scenario: Threshold is read from config

- **WHEN** `duplicate.threshold` is `90` in `config.yaml`
- **AND** a GET `/api/:username/items/:id/duplicates` is made
- **THEN** the threshold of `90` is applied (changing it requires editing `config.yaml` and restarting)

#### Scenario: Returns empty array when no duplicates exceed threshold

- **WHEN** GET `/api/:username/items/:id/duplicates` is called and no other item meets the similarity threshold
- **THEN** the system returns HTTP 200 with an empty array

#### Scenario: Returns empty array when item has no embedding

- **WHEN** GET `/api/:username/items/:id/duplicates` is called for an item without a stored embedding
- **THEN** the system returns HTTP 200 with an empty array
