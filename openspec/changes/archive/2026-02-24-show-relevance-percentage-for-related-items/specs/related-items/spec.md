## MODIFIED Requirements

### Requirement: Fetch related items via API

The system SHALL provide a public endpoint to retrieve semantically similar items for a given item, using KNN vector search on stored embeddings. Each item in the response SHALL include a `relevance` field — an integer percentage (0–100) representing cosine similarity to the queried item.

#### Scenario: Returns top 5 related items with relevance scores

- **WHEN** GET `/api/:username/items/:id/related` is called for an item with an embedding
- **THEN** the system returns HTTP 200 with an array of up to 5 items, each with `id`, `question`, `answer`, and `relevance` (integer 0–100), ordered by descending relevance, excluding the requested item itself

#### Scenario: Returns empty array when item has no embedding

- **WHEN** GET `/api/:username/items/:id/related` is called for an item without a stored embedding
- **THEN** the system returns HTTP 200 with an empty array

#### Scenario: Returns 404 for non-existent item

- **WHEN** GET `/api/:username/items/:id/related` is called for an item that does not exist
- **THEN** the system returns HTTP 404

#### Scenario: No authentication required

- **WHEN** GET `/api/:username/items/:id/related` is called without an Authorization header
- **THEN** the system returns HTTP 200 (public endpoint)

### Requirement: Related items panel on detail page

The detail page SHALL display a "Related items" panel in the sidebar that auto-loads semantically similar items. Each related item SHALL display its question text followed by a subtle relevance percentage badge.

#### Scenario: Relevance badge shown for each related item

- **WHEN** related items are displayed in the panel
- **THEN** each item renders as a link followed by a muted percentage badge (e.g. "87%") indicating its relevance score

#### Scenario: Panel loads items automatically on page load

- **WHEN** a user navigates to an item detail page
- **THEN** the related items panel fetches and displays items without requiring user interaction

#### Scenario: Each related item links to its detail page

- **WHEN** related items are displayed
- **THEN** each item renders as a link that navigates to that item's detail page

#### Scenario: Empty state shown when no related items

- **WHEN** the API returns an empty array
- **THEN** the panel displays a message indicating no related items were found
