## MODIFIED Requirements

### Requirement: Tag Filtering
The system MUST allow filtering items by one or more tags. Selected tags MUST be reflected in the URL as `?tags=<comma-separated-names>` and initialized from the URL on page mount.

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

#### Scenario: Client syncs selected tags to URL on toggle
- **WHEN** the user clicks a tag chip or tag sidebar item to toggle it
- **THEN** the client SHALL update the URL query param `?tags=` via `history.replaceState` (not pushState) to reflect the new selection

#### Scenario: Client reads tags from URL on mount
- **WHEN** the item list page mounts with a URL containing `?tags=linux,docker`
- **THEN** `ItemListStore.load()` SHALL parse the `tags` query param and initialize `selectedTags` with the tag names from the URL before fetching items
