## ADDED Requirements

### Requirement: Daily backup cron
The system SHALL run a daily backup for all users who have `backup_enabled = true`, writing a JSON file per user to `./data/backups/`.

#### Scenario: Backup file created for enabled user
- **WHEN** the daily backup cron fires
- **THEN** a file named `<username>-backup-YYYY-MM-DD.json` SHALL be written to `./data/backups/`
- **AND** the file SHALL contain all items belonging to that user with their tag names

#### Scenario: Disabled user is skipped
- **WHEN** the daily backup cron fires
- **THEN** users with `backup_enabled = false` SHALL NOT have a backup file written

### Requirement: Backup file format
Each backup file SHALL be a valid JSON document with version, username, export timestamp, and a flat array of items.

#### Scenario: Backup file structure
- **WHEN** a backup file is written
- **THEN** the top-level object SHALL contain `version` (integer 1), `username` (string), `exportedAt` (ISO 8601 string), and `items` (array)
- **AND** each item SHALL contain `id`, `question`, `answer`, `tags` (array of tag name strings), `createdAt`, `updatedAt`

### Requirement: Automatic retention pruning
The backup service SHALL delete backup files for a user that are older than that user's `backup_retention_days` setting.

#### Scenario: Old backup files are pruned
- **WHEN** a backup run completes for a user
- **THEN** any backup files for that user older than `backup_retention_days` days SHALL be deleted from `./data/backups/`

#### Scenario: Recent files are retained
- **WHEN** a backup run completes
- **THEN** backup files within the retention window SHALL NOT be deleted

### Requirement: Backup settings per user
Each user SHALL be able to independently enable/disable daily backups and configure the retention window.

#### Scenario: Default state is disabled
- **WHEN** a new user is created
- **THEN** `backup_enabled` SHALL default to `false` and `backup_retention_days` SHALL default to `7`

#### Scenario: Retention days range
- **WHEN** `backup_retention_days` is updated
- **THEN** the value MUST be between 1 and 30 inclusive; values outside this range SHALL be rejected with a validation error
