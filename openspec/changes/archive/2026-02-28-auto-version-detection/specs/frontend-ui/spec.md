## ADDED Requirements

### Requirement: Version update banner component
The app shell SHALL include a version update banner that appears when a new version is detected.

#### Scenario: Banner is visible when update available
- **WHEN** a version update is available and not yet dismissed
- **THEN** a banner SHALL be displayed in the app layout with a "Refresh" and a "Dismiss" button

#### Scenario: Banner is hidden otherwise
- **WHEN** no version update is detected or the user has dismissed the banner
- **THEN** no banner is shown
