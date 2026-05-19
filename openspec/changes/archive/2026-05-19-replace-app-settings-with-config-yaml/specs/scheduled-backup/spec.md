## MODIFIED Requirements

### Requirement: Daily backup cron

The system SHALL register a single global backup cron via `Bun.cron`, derived from `config.yaml`'s `backup.time`. The application SHALL NOT use `setInterval` or any polling loop for backup scheduling. When the cron fires, a single handler SHALL iterate every row in `users` and write a per-user backup file under the backup directory. The handler SHALL skip a user if their `{username}-backup-{date}.json` already exists for today, preventing double-runs across restarts. Backup configuration is read once at startup; changing it requires editing `config.yaml` and restarting.

#### Scenario: Cron registered from config backup.time

- **GIVEN** `backup.enabled` is `true` and `backup.time` is `'20:00'` in `config.yaml`
- **WHEN** `SchedulerService.init()` runs
- **THEN** `Bun.cron` is registered with an expression corresponding to 20:00 server-local time

#### Scenario: No cron is registered when backup is disabled

- **GIVEN** `backup.enabled` is `false` in `config.yaml`
- **WHEN** `SchedulerService.init()` runs
- **THEN** no backup cron is registered

#### Scenario: Backup config change takes effect on restart

- **GIVEN** the backup cron is running
- **WHEN** the operator sets `backup.enabled` to `false` in `config.yaml` and restarts the server
- **THEN** no backup cron is registered after restart

#### Scenario: Handler iterates all registered users

- **GIVEN** users `alice` and `bob` exist and `backup.enabled` is `true`
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

The backup handler SHALL delete backup files older than `config.yaml`'s `backup.retentionDays`.

#### Scenario: Old backup files are pruned

- **WHEN** the backup handler completes for a user
- **THEN** any backup files for that user older than `backup.retentionDays` days SHALL be deleted from `./data/backups/`

#### Scenario: Recent files are retained

- **WHEN** the backup handler completes
- **THEN** backup files within the retention window SHALL NOT be deleted

## ADDED Requirements

### Requirement: Backup directory resolution

The backup directory SHALL be resolved from the `BACKUP_DIR` environment variable, defaulting to the **relative** path `./data/backups` when unset. This default SHALL be consistent with the other path defaults (`DATABASE_URL` → `./data/howcani.db`, `HOWCANI_CONFIG_PATH` → `./config.yaml`): all default relative to the process working directory and are pinned to absolute `/data/...` paths by docker-compose. `BACKUP_DIR` is a path/bootstrap pointer, not operator config — it is NOT part of `config.yaml`.

#### Scenario: Default backup directory in dev

- **WHEN** `BACKUP_DIR` is unset and the server runs from the project root
- **THEN** backups SHALL be written under `./data/backups` (resolved against the working directory), not the filesystem-root `/data/backups`

#### Scenario: Backup directory pinned in container

- **WHEN** the container sets `BACKUP_DIR=/data/backups` and mounts the backup volume there
- **THEN** backups SHALL be written to the mounted `/data/backups` volume
