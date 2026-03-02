## ADDED Requirements

### Requirement: Backup settings in Settings page
The Settings page SHALL include a Backups section allowing authenticated users to enable daily backups and configure the retention period.

#### Scenario: Backup toggle visible in Settings
- **WHEN** an authenticated user opens the Settings page
- **THEN** a "Daily backups" toggle SHALL be visible

#### Scenario: Retention input visible only when backup enabled
- **WHEN** the backup toggle is enabled
- **THEN** a "Retention period" number input (range 1–30, default 7) SHALL be visible
- **AND** the input SHALL auto-save on blur with debounce, matching the duplicate threshold pattern

#### Scenario: Retention input hidden when backup disabled
- **WHEN** the backup toggle is disabled
- **THEN** the retention period input SHALL NOT be visible
