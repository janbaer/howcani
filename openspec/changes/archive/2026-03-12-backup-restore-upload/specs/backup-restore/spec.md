## ADDED Requirements

### Requirement: Restore from uploaded backup file
The system SHALL accept a JSON backup file upload via `POST /settings/backups/restore` and import all items and tags into the authenticated user's account. The `username` field in the backup file is informational only and does not restrict who can import it.

#### Scenario: Successful restore without pre-clear
- **WHEN** an authenticated user uploads a valid backup file with `clearBeforeRestore=false`
- **THEN** all items from the backup SHALL be inserted into the user's account with new UUIDs
- **AND** the original `createdAt` and `updatedAt` timestamps SHALL be preserved
- **AND** tags SHALL be created by name if they do not already exist for the user
- **AND** the response SHALL return `{ imported: N }` with the count of items imported

#### Scenario: Successful restore with pre-clear
- **WHEN** an authenticated user uploads a valid backup file with `clearBeforeRestore=true`
- **THEN** all existing items and tags for the authenticated user SHALL be deleted first
- **AND** the backup items SHALL then be imported as in the no-pre-clear scenario
- **AND** the clear and import SHALL be executed in a single SQLite transaction

#### Scenario: Invalid backup file rejected
- **WHEN** the uploaded file is not valid JSON or is missing required fields (`version`, `items`)
- **THEN** the endpoint SHALL return HTTP 400 with a descriptive error message
- **AND** no data SHALL be written to the database

#### Scenario: Cross-user restore works
- **WHEN** a user uploads a backup file whose `username` field belongs to a different user
- **THEN** the items SHALL be imported into the authenticated user's account regardless

### Requirement: Restore UI in Settings
The Settings page SHALL provide a UI to upload a backup file and trigger a restore.

#### Scenario: Upload button visible in BackupSection
- **WHEN** the user views the Settings page
- **THEN** an "Upload backup" button SHALL be visible in the Backup section

#### Scenario: Pre-clear option visible before confirming
- **WHEN** the user selects a backup file to upload
- **THEN** a "Delete existing data before restoring" checkbox SHALL be visible before submitting

#### Scenario: Success feedback after restore
- **WHEN** a restore completes successfully
- **THEN** the UI SHALL display the number of items imported
- **AND** the item list in the app SHALL reflect the newly imported items
