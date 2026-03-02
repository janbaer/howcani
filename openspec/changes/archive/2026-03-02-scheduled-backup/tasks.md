## 1. Database Migration

- [x] 1.1 Add migration 11 to `src/server/db/migrations.ts` adding `backup_enabled INTEGER NOT NULL DEFAULT 0` and `backup_retention_days INTEGER NOT NULL DEFAULT 7` columns to `users`
- [x] 1.2 Extend `User` interface in `src/server/repositories/user.repository.ts` with `backup_enabled: number` and `backup_retention_days: number`
- [x] 1.3 Add `updateBackupEnabled(id, enabled)` and `updateBackupRetentionDays(id, days)` methods to `UserRepository`

## 2. Settings Service & Route

- [x] 2.1 Extend `Settings` interface in `src/server/services/settings.service.ts` with `backupEnabled: boolean` and `backupRetentionDays: number`
- [x] 2.2 Update `getSettings()` to return the new fields (default: `false` and `7`)
- [x] 2.3 Update `updateSettings()` to handle `backupEnabled` and `backupRetentionDays` (validate 1–30 range)
- [x] 2.4 Extend `PATCH /settings` body schema in `src/server/routes/settings.routes.ts` with `backupEnabled` and `backupRetentionDays`

## 3. BackupService

- [x] 3.1 Create `src/server/services/backup.service.ts` with `fetchItemsForUser(userId)` — JOIN query collapsing tags per item
- [x] 3.2 Implement `pruneOldBackups(username, retentionDays)` — delete files older than retention window
- [x] 3.3 Implement `runBackup()` — query enabled users, write `./data/backups/<username>-backup-YYYY-MM-DD.json`, prune
- [x] 3.4 Implement `startBackupCron()` — 24h `setInterval` calling `runBackup()`

## 4. Wire Cron

- [x] 4.1 Import and call `startBackupCron()` in `src/server/cron.ts` inside `startCron()`

## 5. Settings UI

- [x] 5.1 Add `backupEnabled` and `backupRetentionDays` state variables to `src/client/pages/Settings.svelte`
- [x] 5.2 Load backup settings from API response in the `$effect`
- [x] 5.3 Add `toggleBackup()`, `onRetentionInput()`, and `onRetentionBlur()` handlers
- [x] 5.4 Add Backups section to the settings card (toggle + conditional retention input)

## 6. Verification

- [x] 6.1 Run `bun run lint` — no errors
- [x] 6.2 Run `bun test` — all pass
- [x] 6.3 Run `bun run build` — build successful
