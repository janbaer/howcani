## ADDED Requirements

### Requirement: Detail page timestamp format

The detail page SHALL show timestamps with date and time on desktop and tablet, matching the listview format.

#### Scenario: Timestamps with time on desktop and tablet
- **WHEN** viewport width is 768px or greater (md breakpoint)
- **THEN** the detail page SHALL display `created_at` and `updated_at` with date and time, formatted without seconds
- **AND** `updated_at` SHALL only be shown if it differs from `created_at`

#### Scenario: Timestamps date-only on mobile
- **WHEN** viewport width is less than 768px
- **THEN** the detail page SHALL display `created_at` and `updated_at` with date only (no time)

### Requirement: Consistent edit icon across listview and detail page

The edit icon SHALL be visually identical on both the listview item cards and the detail page.

#### Scenario: Same edit icon on detail page
- **WHEN** an owner views the detail page
- **THEN** the edit button icon SHALL be the same pencil icon used on listview item cards
