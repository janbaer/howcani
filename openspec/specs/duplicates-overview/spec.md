# duplicates-overview Specification

## Purpose

Provides a centralized view of all semantically similar item pairs in a user's knowledge base. The duplicate detection uses KNN vector similarity (sqlite-vec) against the user's configured `duplicate_threshold`. Results are surfaced on the Settings page in a collapsible section so the expensive O(n²) query is only triggered on explicit user request.

## Requirements

### Requirement: Fetch all duplicate groups via API

The system SHALL provide a public endpoint `GET /api/:username/duplicates` that returns all duplicate item groups for a given user. Each group SHALL contain a primary item and a list of items considered its duplicates (cosine similarity at or above the user's `duplicate_threshold`). Symmetric pairs SHALL be deduplicated so each pair appears in exactly one group. Groups with no duplicates SHALL be excluded. Each duplicate entry SHALL include a `relevance` field (integer 0–100). The response SHALL be an empty array when sqlite-vec is unavailable or when no duplicates exist.

#### Scenario: Returns grouped duplicate pairs

- **WHEN** GET `/api/:username/duplicates` is called and the user has items with near-identical embeddings above the threshold
- **THEN** the system returns HTTP 200 with an array of groups, each with an `item` object and a non-empty `duplicates` array; each duplicate has `id`, `question`, `answer`, and `relevance`

#### Scenario: Each pair appears exactly once

- **WHEN** items A and B are mutual duplicates
- **THEN** the response contains exactly one group where either A or B is the primary item — not both

#### Scenario: Returns empty array when no duplicates exist

- **WHEN** GET `/api/:username/duplicates` is called and no items exceed the similarity threshold
- **THEN** the system returns HTTP 200 with an empty array

#### Scenario: Returns empty array when sqlite-vec is unavailable

- **WHEN** GET `/api/:username/duplicates` is called and the sqlite-vec extension is not loaded
- **THEN** the system returns HTTP 200 with an empty array

#### Scenario: Returns 404 for unknown username

- **WHEN** GET `/api/:username/duplicates` is called for a username that does not exist
- **THEN** the system returns HTTP 404

#### Scenario: No authentication required

- **WHEN** GET `/api/:username/duplicates` is called without an Authorization header
- **THEN** the system returns HTTP 200 (public endpoint)

### Requirement: Duplicates overview section on Settings page

The Settings page SHALL display a "Possible duplicates" collapsible section below the threshold input. The section SHALL be **collapsed by default** and SHALL NOT fetch data on page load. When the user expands the section for the first time, the system SHALL fetch and render all duplicate groups as a hierarchical list: each group shows the primary item as a link followed by its duplicates as indented links with relevance badges. Each link SHALL navigate to that item's detail page. When no duplicates are found, a short empty-state message SHALL be shown. Subsequent collapse/expand cycles SHALL reuse the already-fetched data without re-fetching. When the user changes the duplicate threshold while the section is open, the list SHALL refresh automatically to reflect the new threshold.

#### Scenario: Section is collapsed on page load

- **WHEN** the Settings page loads
- **THEN** the duplicates section heading is visible but the list is hidden and no API request is made

#### Scenario: First expand triggers fetch and shows list

- **WHEN** the user clicks the section heading to expand it
- **THEN** the section expands, a loading skeleton is shown, the API is called, and results are rendered

#### Scenario: Grouped list renders primary item and its duplicates

- **WHEN** the section is expanded and duplicate groups exist
- **THEN** each group renders the primary item as a link, with each duplicate indented below it showing its question text and a relevance badge

#### Scenario: Each item links to its detail page

- **WHEN** a user clicks any item or duplicate link in the duplicates section
- **THEN** they are navigated to that item's detail page

#### Scenario: Collapse and re-expand reuses cached data

- **WHEN** the user collapses and then re-expands the section
- **THEN** the previously fetched data is shown immediately without making a new API request

#### Scenario: Empty state shown when no duplicates

- **WHEN** the API returns an empty array
- **THEN** the section displays a message such as "No duplicates found"

#### Scenario: Threshold change refreshes open section

- **WHEN** the user changes the duplicate threshold while the section is expanded
- **THEN** the list re-fetches and updates to reflect the new threshold

#### Scenario: Threshold change does not fetch when section is closed

- **WHEN** the user changes the duplicate threshold while the section is collapsed
- **THEN** no API request is made; the next expand will fetch with the current threshold
