## ADDED Requirements

### Requirement: Daily backup cron
The system SHALL check every minute whether any enabled user has a `backup_time` matching the current local time (HH:MM), and run a backup for each such user. Today's backup file existence is used as the guard to prevent double-runs within the same minute or across restarts.

#### Scenario: Backup file created at configured time
- **WHEN** the current local time matches a user's `backup_time` and no backup file for today exists yet
- **THEN** a file named `<username>-backup-YYYY-MM-DD.json` SHALL be written to `./data/backups/`
- **AND** the file SHALL contain all items belonging to that user with their tag names

#### Scenario: Double-run prevented
- **WHEN** a backup file for today already exists for a user
- **THEN** the scheduler SHALL skip that user even if `backup_time` matches the current minute

#### Scenario: Disabled user is skipped
- **WHEN** the scheduler checks and a user has `backup_enabled = false`
- **THEN** that user SHALL NOT have a backup file written

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
Each user SHALL be able to independently enable/disable daily backups, configure the backup time, and configure the retention window.

#### Scenario: Default state is disabled
- **WHEN** a new user is created
- **THEN** `backup_enabled` SHALL default to `false`, `backup_retention_days` SHALL default to `7`, and `backup_time` SHALL default to `'20:00'`

#### Scenario: Retention days range
- **WHEN** `backup_retention_days` is updated
- **THEN** the value MUST be between 1 and 30 inclusive; values outside this range SHALL be rejected with a validation error

#### Scenario: Backup time format
- **WHEN** `backup_time` is updated
- **THEN** the value MUST match the pattern `HH:MM` with a valid hour (00–23) and minute (00–59); invalid values SHALL be rejected with a validation error
