# duplicate-detection Specification

## Purpose
TBD - created by archiving change duplicate-detection. Update Purpose after archive.
## Requirements
### Requirement: Fetch duplicate candidates via API

The system SHALL provide a public endpoint to retrieve semantically near-duplicate items for a given item. Items whose cosine similarity to the queried item is at or above the owner's configured `duplicate_threshold` (expressed as a percentage) SHALL be returned, up to a maximum of 10 results. Each item in the response SHALL include a `relevance` field — an integer percentage (0–100) representing cosine similarity to the queried item.

#### Scenario: Returns duplicate candidates above threshold

- **WHEN** GET `/api/:username/items/:id/duplicates` is called for an item with an embedding, and the owner's threshold is 92
- **THEN** the system returns HTTP 200 with an array of items (up to 10) whose cosine similarity is ≥ 92%, each with `id`, `question`, `answer`, and `relevance` (integer 0–100), ordered by descending relevance, excluding the requested item itself

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

### Requirement: Possible Duplicates panel on detail page

The item detail page SHALL display a "Possible Duplicates" panel below the Related Items panel in the right sidebar. The panel SHALL only be visible on desktop and tablet (hidden on mobile). Its behaviour SHALL mirror the Related Items panel: it auto-loads on page load, shows each duplicate as a clickable link with a relevance badge, and shows an empty-state message when no duplicates are found.

#### Scenario: Panel is hidden on mobile

- **WHEN** the item detail page is viewed on a mobile viewport
- **THEN** the Possible Duplicates panel is not rendered or is visually hidden

#### Scenario: Panel auto-loads on page load

- **WHEN** a user navigates to an item detail page on a desktop or tablet viewport
- **THEN** the duplicates panel fetches and displays results without requiring user interaction

#### Scenario: Each duplicate links to its detail page

- **WHEN** duplicate items are displayed in the panel
- **THEN** each item renders as a link that navigates to that item's detail page

#### Scenario: Relevance badge shown for each duplicate

- **WHEN** duplicate items are displayed in the panel
- **THEN** each item shows a muted percentage badge (e.g. "95%") indicating its similarity score

#### Scenario: Empty state shown when no duplicates

- **WHEN** the API returns an empty array
- **THEN** the panel displays a message indicating no duplicates were found

