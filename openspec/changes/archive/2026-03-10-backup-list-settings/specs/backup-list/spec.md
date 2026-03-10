## ADDED Requirements

### Requirement: List backup files
The API SHALL return a list of backup files belonging to the authenticated user, sorted by date descending.

#### Scenario: Backups exist
- **WHEN** `GET /api/settings/backups` is called by an authenticated user
- **THEN** the response SHALL be a JSON array of objects, each containing `filename` (string), `date` (ISO 8601 date string `YYYY-MM-DD`), and `sizeBytes` (number)
- **AND** entries SHALL be sorted with the most recent date first

#### Scenario: No backups exist
- **WHEN** `GET /api/settings/backups` is called and no backup files exist for the user
- **THEN** the response SHALL be an empty JSON array `[]`

#### Scenario: Unauthenticated request is rejected
- **WHEN** `GET /api/settings/backups` is called without a valid JWT
- **THEN** the server SHALL respond with HTTP 401

### Requirement: Download backup file
The API SHALL allow an authenticated user to download one of their backup files by filename.

#### Scenario: Valid download
- **WHEN** `GET /api/settings/backups/:filename` is called with a filename belonging to the authenticated user
- **THEN** the server SHALL respond with the file content and `Content-Disposition: attachment; filename="<filename>"`
- **AND** the response `Content-Type` SHALL be `application/json`

#### Scenario: Cross-user access is denied
- **WHEN** `GET /api/settings/backups/:filename` is called with a filename whose username prefix does not match the authenticated user
- **THEN** the server SHALL respond with HTTP 404

#### Scenario: Non-existent file returns 404
- **WHEN** `GET /api/settings/backups/:filename` is called with a filename that does not exist on disk
- **THEN** the server SHALL respond with HTTP 404

### Requirement: Backup list UI
The Settings page SHALL display the authenticated user's backup files below the backup configuration controls.

#### Scenario: Backups are listed
- **WHEN** the Settings page loads and backup files exist for the user
- **THEN** each file SHALL be shown with its date and formatted size
- **AND** each entry SHALL have a download button that triggers a file download

#### Scenario: Empty state
- **WHEN** the Settings page loads and no backup files exist
- **THEN** a message SHALL inform the user that no backups are available yet

#### Scenario: Section always visible
- **WHEN** the Settings page loads regardless of whether `backupEnabled` is true or false
- **THEN** the backup list section SHALL be visible
