## Why

Users have no way to recover their knowledge base items if the database is lost or corrupted. A daily automated backup gives users an exportable snapshot of their data that can be re-imported in future.

## What Changes

- Add `backup_enabled` and `backup_retention_days` per-user settings (DB migration v11)
- Add a `BackupService` that runs daily via in-process cron, writing one JSON file per enabled user to `./data/backups/`
- Extend the settings API and UI to expose the new backup toggle and retention input
- Old backup files beyond the user's retention window are automatically deleted

## Capabilities

### New Capabilities
- `scheduled-backup`: Daily per-user JSON backup cron with configurable retention

### Modified Capabilities
- `frontend-ui`: Settings page gains a Backups section (toggle + retention input)

## Impact

- `src/server/db/migrations.ts` — new migration 11
- `src/server/repositories/user.repository.ts` — `User` interface + 2 update methods
- `src/server/services/backup.service.ts` — new service
- `src/server/cron.ts` — call `startBackupCron()`
- `src/server/services/settings.service.ts` — extend `Settings` interface + update logic
- `src/server/routes/settings.routes.ts` — extend PATCH body schema
- `src/client/pages/Settings.svelte` — add Backups section
