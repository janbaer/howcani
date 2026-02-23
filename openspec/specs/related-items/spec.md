### Requirement: Fetch related items via API

The system SHALL provide a public endpoint to retrieve semantically similar items for a given item, using KNN vector search on stored embeddings.

#### Scenario: Returns top 5 related items

- **WHEN** GET `/api/:username/items/:id/related` is called for an item with an embedding
- **THEN** the system returns HTTP 200 with an array of up to 5 items, each with `id`, `question`, and `answer`, excluding the requested item itself

#### Scenario: Returns empty array when item has no embedding

- **WHEN** GET `/api/:username/items/:id/related` is called for an item without a stored embedding
- **THEN** the system returns HTTP 200 with an empty array

#### Scenario: Returns empty array when sqlite-vec is unavailable

- **WHEN** GET `/api/:username/items/:id/related` is called and sqlite-vec extension is not loaded
- **THEN** the system returns HTTP 200 with an empty array

#### Scenario: Returns 404 for non-existent item

- **WHEN** GET `/api/:username/items/:id/related` is called for an item that does not exist
- **THEN** the system returns HTTP 404

#### Scenario: No authentication required

- **WHEN** GET `/api/:username/items/:id/related` is called without an Authorization header
- **THEN** the system returns HTTP 200 (public endpoint)

### Requirement: Related items panel on detail page

The detail page SHALL display a collapsible "Related items" panel at the bottom of the item view that lazily loads semantically similar items on expand.

#### Scenario: Panel is collapsed by default

- **WHEN** a user navigates to an item detail page
- **THEN** the "Related items" section is visible but collapsed (not showing items)

#### Scenario: Lazy load on first expand

- **WHEN** the user clicks to expand the "Related items" panel for the first time
- **THEN** the system fetches related items from the API and displays them as clickable links

#### Scenario: No duplicate API call on re-expand

- **WHEN** the user collapses and re-expands the "Related items" panel
- **THEN** the system does not make a new API call — it reuses the previously loaded results

#### Scenario: Each related item links to its detail page

- **WHEN** related items are displayed
- **THEN** each item renders as a link that navigates to that item's detail page

#### Scenario: Empty state shown when no related items

- **WHEN** the API returns an empty array
- **THEN** the panel displays a message indicating no related items were found
