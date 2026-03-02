## MODIFIED Requirements

### Requirement: Mobile Header Navigation
The mobile header SHALL display the same authenticated navigation actions as the desktop header, including a link to the settings page.

#### Scenario: Settings link visible on mobile when authenticated
- **WHEN** an authenticated user views the application on a mobile viewport
- **THEN** the header SHALL display a settings icon link to `/settings` in the right-side action bar
- **AND** the link SHALL only be visible when the user is authenticated
