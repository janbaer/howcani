## ADDED Requirements

### Requirement: Tag filters persisted in URL
The system SHALL encode selected tag filters as a `?tags=` query param in the URL so that state survives navigation and page reload.

#### Scenario: Tags encoded on toggle
- **WHEN** the user toggles a tag on the item list page
- **THEN** the URL SHALL be updated to include `?tags=<comma-separated-tag-names>` using `history.replaceState`

#### Scenario: Tags removed from URL when all deselected
- **WHEN** the user deselects all tags
- **THEN** the `?tags=` param SHALL be removed from the URL entirely

#### Scenario: Tags restored on page mount
- **WHEN** the item list page mounts and the URL contains `?tags=linux,docker`
- **THEN** `selectedTags` SHALL be initialized to `["linux", "docker"]` and items SHALL be fetched with those filters applied

#### Scenario: Tags survive navigation to detail and back
- **WHEN** the user has `?tags=linux` active, navigates to an item detail page, then presses the browser back button
- **THEN** the item list SHALL remount with `selectedTags = ["linux"]` restored from the URL

#### Scenario: Tag URL param combined with search
- **WHEN** the URL contains `?search=kennwort&tags=linux`
- **THEN** the item list SHALL apply both the search filter and the tag filter simultaneously
