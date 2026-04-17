## MODIFIED Requirements

### Requirement: User Settings Storage

The system SHALL store application settings in a single global `app_settings` singleton table, not on individual `users` rows. The table SHALL hold `semantic_search_enabled`, `duplicate_threshold`, `backup_enabled`, `backup_time`, and `backup_retention_days`. Singleton invariant SHALL be enforced via `CHECK(id = 1)` on the primary key. The five corresponding columns SHALL be removed from `users`.

#### Scenario: app_settings singleton row exists after migration

- **WHEN** the migration that introduces `app_settings` runs on a fresh database
- **THEN** the table has exactly one row with `semantic_search_enabled=1`, `duplicate_threshold=80`, `backup_enabled=0`, `backup_time='20:00'`, `backup_retention_days=7`

#### Scenario: Second-row insert fails

- **WHEN** code tries to insert a second row into `app_settings`
- **THEN** the database rejects it via the `CHECK(id = 1)` constraint

#### Scenario: users table no longer carries settings columns

- **WHEN** the migration has run
- **THEN** the columns `semantic_search_enabled`, `duplicate_threshold`, `backup_enabled`, `backup_retention_days`, and `backup_time` are absent from the `users` table

#### Scenario: Existing per-user values are not preserved

- **GIVEN** a pre-migration database with per-user settings set to non-default values
- **WHEN** the migration runs
- **THEN** `app_settings` is populated with defaults only; the previous per-user values are discarded

### Requirement: Settings API

The system SHALL expose a REST API for reading and updating the global application settings. Any authenticated user SHALL be able to read and modify them. After a successful write the scheduler SHALL be re-applied so the new values take effect without a server restart.

#### Scenario: Get settings returns current values

- **WHEN** an authenticated user sends GET to `/api/settings`
- **THEN** the system returns the current `app_settings` values (including `semanticSearchEnabled`, `duplicateThreshold`, `backupEnabled`, `backupTime`, `backupRetentionDays`) with status 200

#### Scenario: Patch settings updates the global row

- **WHEN** an authenticated user sends PATCH to `/api/settings` with a partial body such as `{ "semanticSearchEnabled": true }`
- **THEN** the system calls `appSettingsRepository.update(...)`, returns the updated settings with status 200, and calls `schedulerService.applyBackupSettings` / `applyEmbeddingSettings` as appropriate

#### Scenario: Settings API requires authentication

- **WHEN** an unauthenticated request is sent to GET or PATCH `/api/settings`
- **THEN** the system returns status 401

#### Scenario: Settings are shared across all users

- **WHEN** user A updates a setting
- **THEN** a subsequent GET from user B returns the same updated value (settings are global, not per-user)

### Requirement: Settings UI

The system SHALL provide a settings page in the frontend for managing the global application settings. Any authenticated user SHALL be able to view and update them.

#### Scenario: Settings page accessible via /settings route

- **WHEN** an authenticated user navigates to `/settings`
- **THEN** the system renders a settings page with controls for semantic search, duplicate threshold, backup enabled, backup time, and backup retention days

#### Scenario: Controls reflect current settings

- **WHEN** the settings page loads
- **THEN** the system fetches the current settings via GET `/api/settings` and displays each control in the correct state

#### Scenario: Changes save immediately

- **WHEN** the user changes a control
- **THEN** the system sends PATCH `/api/settings` with the new value and updates the control state on success
