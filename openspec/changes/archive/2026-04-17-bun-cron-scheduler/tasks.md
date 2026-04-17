## 1. Database migration

- [x] 1.1 Append a new migration to `src/server/db/migrations.ts` that creates `app_settings` (5 columns, `CHECK(id = 1)` singleton) and inserts the default row (id=1)
- [x] 1.2 In the same migration, drop `semantic_search_enabled`, `duplicate_threshold`, `backup_enabled`, `backup_retention_days`, `backup_time` from `users` via `ALTER TABLE ... DROP COLUMN`
- [x] 1.3 Remove the recovery block in `migrations.ts` that re-adds `duplicate_threshold` if missing (it targets the old column)
- [x] 1.4 Add a test in `migrations.spec.ts` asserting `app_settings` exists with one row matching the five defaults, and the five columns are absent from `users`

## 2. AppSettings repository

- [x] 2.1 Create `src/server/repositories/app-settings.repository.ts` exporting `appSettingsRepository` singleton
- [x] 2.2 Method `get(): AppSettings` — reads the single row; returns a typed object with booleans coerced from `0/1`
- [x] 2.3 Method `update(partial: Partial<AppSettings>): AppSettings` — updates only the provided fields, returns the new full row
- [x] 2.4 Add `src/server/repositories/app-settings.repository.spec.ts` covering the defaults after migration, partial updates, and boolean coercion

## 3. User repository cleanup

- [x] 3.1 Remove `semantic_search_enabled`, `duplicate_threshold`, `backup_enabled`, `backup_retention_days`, `backup_time` from `UserRow` type in `src/server/repositories/user.repository.ts`
- [x] 3.2 Remove methods `updateSemanticSearchEnabled`, `updateDuplicateThreshold`, `updateBackupEnabled`, `updateBackupRetentionDays`, `updateBackupTime`
- [x] 3.3 Remove the five columns from every `SELECT` in user queries so rows no longer carry them
- [x] 3.4 Update any existing user-repo tests that reference the removed fields/methods

## 4. SettingsService rewiring

- [x] 4.1 Update `src/server/services/settings.service.ts` to read via `appSettingsRepository.get()` and write via `appSettingsRepository.update(...)`
- [x] 4.2 Service no longer takes a `userId` for settings reads/writes (settings are global)
- [x] 4.3 Update `settings.service.spec.ts` to exercise the new contract
- [x] 4.4 Update `src/server/routes/settings.routes.ts` to reflect the non-userId API and call `schedulerService.applyBackupSettings` / `applyEmbeddingSettings` after any successful write

## 5. SchedulerService

- [x] 5.1 Create `src/server/services/scheduler.service.ts` exporting `schedulerService` singleton
- [x] 5.2 Constructor accepts an optional `cronFactory` (defaults to `Bun.cron`) for test injection; holds `backupHandle` and `embeddingHandle` state
- [x] 5.3 `init()` — reads `appSettingsRepository.get()` and delegates to the two apply methods
- [x] 5.4 `applyBackupSettings({ enabled, time })` — stops the old handle, if `enabled` registers a new cron at `${m} ${h} * * *` with `timezone: Intl.DateTimeFormat().resolvedOptions().timeZone`
- [x] 5.5 `applyEmbeddingSettings({ enabled })` — stops old handle; if `enabled && OPENROUTER_API_KEY`, registers a `*/5 * * * *` cron with the same timezone option
- [x] 5.6 Create `scheduler.service.spec.ts` that injects a mock `cronFactory` and asserts: (a) toggling enabled=true registers with the right expression; (b) toggling enabled=false stops the handle; (c) changing `backup_time` stops the old handle and registers a new one; (d) embedding cron is never registered without `OPENROUTER_API_KEY`

## 6. Backup service refactor

- [x] 6.1 In `src/server/services/backup.service.ts`, remove `startBackupCron`, `TICK_INTERVAL_MS`, and the `setInterval` state
- [x] 6.2 Expose `runBackupJob(dir?)` that reads `app_settings.backup_retention_days`, queries all users in `users`, and runs `runBackupForUser(user, dir)` for each, swallowing per-user errors with a `console.error`
- [x] 6.3 Update `runBackupForUser` to accept retention from `app_settings` instead of the user row
- [x] 6.4 Drop the `backup_retention_days` / `backup_time` fields from the `ScheduledUser` type
- [x] 6.5 Rework `backup.service.spec.ts`: remove the `runScheduledBackups(dir, time)` time-injection tests; add coverage for `runBackupJob()` (iterates all users, respects retention from app_settings, preserves the file-exists idempotency skip)

## 7. Embedding cron refactor

- [x] 7.1 In `src/server/cron.ts`, remove `startCron`, `cronInterval`, `CRON_INTERVAL_MS`, and the `setInterval` state
- [x] 7.2 Keep `backfillEmbeddings` as a named export so `SchedulerService` can pass it as the cron handler
- [x] 7.3 If `cron.ts` becomes trivial, move `backfillEmbeddings` into a small module under `services/` and delete `cron.ts`

## 8. Server bootstrap and route wiring

- [x] 8.1 In `src/server/index.ts`, replace the `startCron()` call with `schedulerService.init()`
- [x] 8.2 Ensure `runMigrations()` runs before `schedulerService.init()` so `app_settings` exists
- [x] 8.3 Ensure `PATCH /api/settings` calls both `schedulerService.applyBackupSettings({...})` and `schedulerService.applyEmbeddingSettings({...})` after a successful DB write
- [x] 8.4 Add an integration-ish unit test verifying the route triggers the scheduler (mock `schedulerService`)

## 9. Call-site updates (reads of old user fields)

- [x] 9.1 `src/server/services/item.service.ts:174` — read `semantic_search_enabled` from `appSettingsRepository.get()`; remove the user lookup for this flag
- [x] 9.2 `src/server/services/item.service.ts:215,245` — read `duplicate_threshold` from `appSettingsRepository.get()`
- [x] 9.3 `src/server/mcp/tools.ts:23` — read `semantic_search_enabled` from `appSettingsRepository.get()`; the session still carries `userId`, just not the flag
- [x] 9.4 Search for any other reads of the five removed fields and update them (e.g. test helpers that build fake users)

## 10. Test adaptations

- [x] 10.1 Update `auth.service.spec.ts`, `user.service.spec.ts`, `tag.service.spec.ts`, `item.service.spec.ts` factories to stop setting the five removed fields on test users
- [x] 10.2 Ensure `setupTestDatabase()` / `clearTestDatabase()` in `db/test-helpers.ts` leave the `app_settings` row intact between tests (or reset it to defaults explicitly)
- [x] 10.3 Update any spec that exercises settings routes to account for the global (non-userId) contract

## 11. Quality gates

- [x] 11.1 `bun run lint` clean
- [x] 11.2 `bun test` green
- [x] 11.3 `bun run build` succeeds

## 12. Manual verification (per issue #85 "How to Test")

- [x] 12.1 Fresh DB: start the server, confirm `app_settings` has one row with expected defaults
- [x] 12.2 Toggle `backup_enabled` on, set `backup_time` to ~2 minutes in the future, confirm a `{username}-backup-{date}.json` appears at the configured minute in server local time
- [x] 12.3 Toggle `backup_enabled` off, confirm cron stops (log) and no further backups fire
- [x] 12.4 Toggle `semantic_search_enabled` off/on with `OPENROUTER_API_KEY` set; confirm embedding cron stops/starts
- [x] 12.5 Create a new item; confirm embedding is generated (fire-and-forget) and next `*/5` tick backfills missing items
- [x] 12.6 Duplicate detection on Settings page and item detail still works; threshold value read from `app_settings`

## 13. Release

- [x] 13.1 Commit with message `scheduler ♻️: Migrating scheduled jobs to Bun.cron and app_settings`
- [x] 13.2 Push `feature/85-bun-cron-scheduler` and notify via ntfy
