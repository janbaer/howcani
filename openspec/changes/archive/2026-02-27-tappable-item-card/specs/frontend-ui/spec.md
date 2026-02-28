## MODIFIED Requirements

### Requirement: Item List Component

The item list MUST display FAQ items with previews and interaction options.

#### Scenario: Display item in list
- **WHEN** rendering an item in the list
- **THEN** the card SHALL show the question as a clickable title, full answer preview, ALL tags without truncation, and timestamps

#### Scenario: Show all tags without truncation
- **WHEN** an item has any number of tags
- **THEN** ALL tags SHALL be displayed on the card with no `+N` overflow indicator
- **AND** tags SHALL wrap to additional lines as needed

#### Scenario: Show timestamps on desktop and tablet
- **WHEN** viewport width is 768px or greater (md breakpoint)
- **THEN** the card SHALL display both `created_at` and `updated_at` timestamps without seconds
- **AND** `updated_at` SHALL only be shown if it differs from `created_at`

#### Scenario: Show timestamp on mobile
- **WHEN** viewport width is less than 768px
- **THEN** the card SHALL display only `created_at` without seconds
- **AND** `updated_at` SHALL NOT be shown on mobile

#### Scenario: Item never edited
- **WHEN** an item's `updated_at` equals its `created_at`
- **THEN** only `created_at` SHALL be shown, even on desktop/tablet
- **AND** no "Updated" timestamp or label SHALL appear

#### Scenario: Truncate long answers
- **WHEN** item has answer longer than 200 characters
- **THEN** the component should show first 200 characters with "..." ellipsis, preserving word boundaries

#### Scenario: Empty state when no items
- **WHEN** user has zero items
- **THEN** the component should show "No items yet" and an "Add your first item" button (if owner)

#### Scenario: Loading state during fetch
- **WHEN** API request is in progress
- **THEN** the component should show a loading indicator or skeleton

#### Scenario: Pagination
- **WHEN** user has more items than page size
- **THEN** the component MUST show current page items, total count, and pagination controls

#### Scenario: Card-wide tap target navigates to detail
- **WHEN** user taps or clicks anywhere on the card body (not on a link or button)
- **THEN** the system SHALL navigate to the item detail page

#### Scenario: Edit button not affected by card tap
- **WHEN** user taps the edit button on a card
- **THEN** the edit modal SHALL open and navigation SHALL NOT occur

#### Scenario: Delete button not affected by card tap
- **WHEN** user taps the delete button on a card
- **THEN** the delete confirmation SHALL appear and navigation SHALL NOT occur

#### Scenario: Question title link still works
- **WHEN** user clicks the question title link
- **THEN** the system SHALL navigate to the item detail page (via the anchor element)
