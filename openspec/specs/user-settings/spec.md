
### Requirement: User Settings Storage

The system SHALL store per-user settings in the `users` table.

#### Scenario: semantic_search_enabled column exists after migration

- **WHEN** database migration version 7 runs
- **THEN** the system SHALL add column `semantic_search_enabled INTEGER NOT NULL DEFAULT 0` to the `users` table

#### Scenario: semantic_search_enabled defaults to disabled

- **WHEN** a new user registers
- **THEN** the system SHALL set `semantic_search_enabled = 0` for that user

### Requirement: Settings API

The system SHALL expose a REST API for reading and updating user settings.

#### Scenario: Get settings returns current values

- **WHEN** authenticated user sends GET to `/api/settings`
- **THEN** the system SHALL return `{ "semanticSearchEnabled": false }` (or `true`) with status 200

#### Scenario: Patch settings updates semantic search toggle

- **WHEN** authenticated user sends PATCH to `/api/settings` with body `{ "semanticSearchEnabled": true }`
- **THEN** the system SHALL update `users.semantic_search_enabled = 1` for that user and return the updated settings with status 200

#### Scenario: Settings API requires authentication

- **WHEN** unauthenticated request is sent to GET or PATCH `/api/settings`
- **THEN** the system SHALL return status 401

#### Scenario: Settings scoped to authenticated user

- **WHEN** user A updates their settings
- **THEN** the system SHALL only modify user A's row and not affect other users

### Requirement: Settings UI

The system SHALL provide a settings page in the frontend for users to manage their preferences.

#### Scenario: Settings page accessible via /settings route

- **WHEN** authenticated user navigates to `/settings`
- **THEN** the system SHALL render a settings page with a "Semantic search" toggle

#### Scenario: Toggle reflects current setting

- **WHEN** the settings page loads
- **THEN** the system SHALL fetch the current settings via GET `/api/settings` and display the toggle in the correct on/off state

#### Scenario: Toggling saves immediately

- **WHEN** user clicks the semantic search toggle
- **THEN** the system SHALL send PATCH `/api/settings` with the new value and update the toggle state on success
