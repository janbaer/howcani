## REMOVED Requirements

### Requirement: User Settings Storage

**Reason**: Operator configuration moves from the `app_settings` SQLite singleton to `config.yaml` (see `operator-config`). Migration 14 drops the `app_settings` table.

**Migration**: Operators author `config.yaml` (copy `config.example.yaml`) with `embedding`, `backup`, and `duplicate` sections. Previous `app_settings` values are discarded — the same precedent set by migration 13. The server fails fast if `config.yaml` is missing.

## MODIFIED Requirements

### Requirement: Settings API

The system SHALL expose a read-only REST endpoint for the Settings UI to display current operator configuration. `GET /api/settings` SHALL return the effective values derived from `config.yaml`. There SHALL be no `PATCH /api/settings` endpoint; operator configuration is changed by editing `config.yaml` and restarting, not at runtime.

#### Scenario: Get settings returns current config values

- **WHEN** an authenticated user sends GET to `/api/settings`
- **THEN** the system returns the current effective values derived from `config.yaml` (including `semanticSearchEnabled`, `duplicateThreshold`, `backupEnabled`, `backupTime`, `backupRetentionDays`) with status 200

#### Scenario: PATCH settings no longer exists

- **WHEN** a PATCH or PUT request is sent to `/api/settings`
- **THEN** the system returns status 404 (no route registered)

#### Scenario: Settings API requires authentication

- **WHEN** an unauthenticated request is sent to GET `/api/settings`
- **THEN** the system returns status 401

#### Scenario: Settings are global

- **WHEN** any authenticated user reads `/api/settings`
- **THEN** the returned values reflect the single global `config.yaml`, identical for every user

### Requirement: Settings UI

The system SHALL provide a settings page in the frontend that surfaces user-facing concerns only — the backup file list, backup restore upload, and duplicates overview. The page SHALL NOT render operator-configuration controls (semantic-search toggle, duplicate-threshold input, backup enable/time/retention controls), because those are now set in `config.yaml`.

#### Scenario: Settings page accessible via /settings route

- **WHEN** an authenticated user navigates to `/settings`
- **THEN** the system renders the settings page with the backup list, restore upload, and duplicates overview

#### Scenario: Operator toggles are absent

- **WHEN** the settings page renders
- **THEN** there SHALL be no semantic-search toggle, no duplicate-threshold input, and no backup enable/time/retention controls

#### Scenario: Duplicates overview still uses the configured threshold

- **WHEN** the settings page renders the duplicates overview
- **THEN** it SHALL use the duplicate threshold from `config.yaml` (obtained via `GET /api/settings`) without offering an editable control
