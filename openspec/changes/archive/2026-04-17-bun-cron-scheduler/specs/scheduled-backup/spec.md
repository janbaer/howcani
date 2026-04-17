## MODIFIED Requirements

### Requirement: Daily backup cron

The system SHALL register a single global backup cron via `Bun.cron`, derived from `app_settings.backup_time`. The application SHALL NOT use `setInterval` or any polling loop for backup scheduling. When the cron fires, a single handler SHALL iterate every row in `users` and write a per-user backup file under the backup directory. The handler SHALL skip a user if their `{username}-backup-{date}.json` already exists for today, preventing double-runs across restarts.

#### Scenario: Cron registered from app_settings.backup_time

- **GIVEN** `app_settings.backup_enabled = 1` and `app_settings.backup_time = '20:00'`
- **WHEN** `SchedulerService.init()` runs
- **THEN** `Bun.cron` is registered with an expression corresponding to 20:00 server-local time

#### Scenario: No cron is registered when backup is disabled

- **GIVEN** `app_settings.backup_enabled = 0`
- **WHEN** `SchedulerService.init()` runs
- **THEN** no backup cron is registered

#### Scenario: Toggling backup_enabled takes effect without a restart

- **GIVEN** the backup cron is running
- **WHEN** the user toggles `backup_enabled` off via `PATCH /api/settings`
- **THEN** the previous handle is stopped and no further backups fire

#### Scenario: Handler iterates all registered users

- **GIVEN** users `alice` and `bob` exist and `app_settings.backup_enabled = 1`
- **WHEN** the backup cron handler fires on 2026-04-17
- **THEN** the backup directory contains both `alice-backup-2026-04-17.json` and `bob-backup-2026-04-17.json`
- **AND** each file contains all items belonging to that user with their tag names

#### Scenario: Idempotent skip within a day

- **GIVEN** `alice-backup-2026-04-17.json` already exists
- **WHEN** the handler runs again the same day
- **THEN** `alice`'s file is not rewritten

#### Scenario: Per-user failure does not abort the job

- **GIVEN** writing `alice`'s file fails (e.g. disk error)
- **WHEN** the handler runs for users `alice` and `bob`
- **THEN** `alice`'s failure is logged, `bob`'s file is still written, and the handler logs a summary of successes and failures

### Requirement: Automatic retention pruning

The backup handler SHALL delete backup files older than `app_settings.backup_retention_days`.

#### Scenario: Old backup files are pruned

- **WHEN** the backup handler completes for a user
- **THEN** any backup files for that user older than `app_settings.backup_retention_days` days SHALL be deleted from `./data/backups/`

#### Scenario: Recent files are retained

- **WHEN** the backup handler completes
- **THEN** backup files within the retention window SHALL NOT be deleted

## REMOVED Requirements

### Requirement: Backup settings per user
**Reason:** Backup scheduling is now global. `backup_enabled`, `backup_time`, and `backup_retention_days` move from the `users` table to the singleton `app_settings` row (see `user-settings` spec). The cron no longer matches per-user `HH:MM` in application code.
**Migration:** Existing per-user values are not preserved. Defaults after migration: `backup_enabled=0`, `backup_time='20:00'`, `backup_retention_days=7`. The operator re-toggles and re-sets values through the Settings page after deploy.
