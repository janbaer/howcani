## MODIFIED Requirements

### Requirement: Tag sidebar visibility
The tag sidebar SHALL adapt its visibility based on viewport size and device orientation.

#### Scenario: Tag sidebar visible on desktop
- **WHEN** viewport width is 1024px or greater
- **THEN** the tag sidebar SHALL be visible in the left column

#### Scenario: Tag sidebar visible on tablet landscape
- **WHEN** viewport width is between 768px and 1023px AND device orientation is landscape
- **THEN** the tag sidebar SHALL be visible in the left column

#### Scenario: Tag sidebar hidden on mobile
- **WHEN** viewport width is less than 768px
- **THEN** the tag sidebar SHALL be hidden by default
- **AND** SHALL only be visible when the tag overlay is opened via hamburger button

#### Scenario: Tag sidebar hidden on tablet portrait
- **WHEN** viewport width is between 768px and 1023px AND device orientation is portrait
- **THEN** the tag sidebar SHALL be hidden by default
- **AND** SHALL only be visible when the tag overlay is opened via hamburger button
