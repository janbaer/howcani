## ADDED Requirements

### Requirement: Service Worker file generation
The build script SHALL generate `public/sw.js` with the current version embedded so the file changes on every version bump.

#### Scenario: SW file is written during production build
- **WHEN** the production build runs
- **THEN** `public/sw.js` SHALL be written containing the current version string

#### Scenario: SW file not written in dev
- **WHEN** running in dev mode
- **THEN** `public/sw.js` is not generated and no SW is registered

### Requirement: Service Worker registration
The client SHALL register the service worker in production and listen for update lifecycle events.

#### Scenario: SW is registered on app mount
- **WHEN** the app mounts and `navigator.serviceWorker` is available and not in dev mode
- **THEN** the client registers `/sw.js`

#### Scenario: Already-waiting SW detected on load
- **WHEN** the app loads and a waiting SW already exists (tab was open during a deploy)
- **THEN** the client SHALL immediately mark an update as available

#### Scenario: New SW detected while tab is open
- **WHEN** a new SW is installed while the tab is open (updatefound → state: installed)
- **THEN** the client SHALL mark an update as available

### Requirement: Version update banner
The client SHALL display a dismissible bottom banner when a version update is detected.

#### Scenario: Banner appears on update detection
- **WHEN** a new SW version is waiting
- **THEN** a bottom banner SHALL appear with a "Refresh" and a "Dismiss" button

#### Scenario: Refresh triggers new SW activation and page reload
- **WHEN** user clicks "Refresh"
- **THEN** `SKIP_WAITING` message is sent to the waiting SW
- **AND** the page reloads when the new SW takes control

#### Scenario: Dismiss hides banner for the session
- **WHEN** user clicks "Dismiss"
- **THEN** the banner is hidden and does not reappear during the current browser session
