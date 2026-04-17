## Why

Two background jobs run via raw `setInterval`:
- The **daily backup** job ticks every minute and does per-user `HH:MM` string matching in application code to decide which users are due. Timezone handling has bitten us before because `new Date().getHours()` silently follows the host's local time with no explicit TZ.
- The **embedding-backfill** job ticks every 5 minutes.

Per-user scheduling settings (`backup_enabled`, `backup_time`, `backup_retention_days`, `semantic_search_enabled`, `duplicate_threshold`) live on the `users` table, but there is effectively one operator. The per-user model forces every caller to look up the current user just to read a global toggle.

Bun 1.3.12 ships `Bun.cron`, an in-process cron scheduler with first-class timezone support. Using it replaces the timer plumbing with a real scheduler (the handler only runs at the configured time, not every minute), and makes the TZ contract explicit.

## What Changes

- Introduce a new global singleton table `app_settings` with five columns: `semantic_search_enabled`, `duplicate_threshold`, `backup_enabled`, `backup_time`, `backup_retention_days`.
- The scheduling and preference settings move **from the `users` table to `app_settings`**. The five replaced columns are dropped from `users`. Existing per-user values are not preserved — the user will re-toggle after deploy.
- A new `SchedulerService` singleton owns two `Bun.cron` handles: the daily backup cron and the 5-minute embedding-backfill cron.
- Both crons are registered with `timezone: Intl.DateTimeFormat().resolvedOptions().timeZone` so the backup fires at the configured wall-clock time in the server's local TZ.
- A cron is only registered when its toggle (`backup_enabled` / `semantic_search_enabled`) is `1`. The embedding cron additionally requires `OPENROUTER_API_KEY`.
- The settings update route calls the scheduler after the DB write so toggling settings takes effect without a server restart.
- `setInterval`-based scheduling is removed from `src/server/cron.ts` and `src/server/services/backup.service.ts`.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `scheduled-backup`: switches from a per-user per-minute tick to a single global `Bun.cron` registered at the configured time. Backup settings source changes from `users` to `app_settings`. Backup handler iterates all users.
- `vector-embeddings`: embedding backfill runs on `Bun.cron` (`*/5 * * * *`) only when `app_settings.semantic_search_enabled = 1` and `OPENROUTER_API_KEY` is set.
- `user-settings`: settings become global (one row in `app_settings`), not per-user. Any authenticated user can read and modify them.
- `user-management`: drops `semantic_search_enabled`, `duplicate_threshold`, `backup_enabled`, `backup_retention_days`, `backup_time` from the `users` table. Corresponding repository methods are removed.
- `duplicate-detection`: threshold is read from `app_settings.duplicate_threshold` instead of the per-user column.

## Impact

- NEW: `src/server/services/scheduler.service.ts` + `scheduler.service.spec.ts`
- NEW: `src/server/repositories/app-settings.repository.ts` + spec
- NEW: migration in `src/server/db/migrations.ts` (create `app_settings`, drop 5 user columns)
- MODIFIED: `src/server/services/backup.service.ts` — drops time-match logic; exposes `runBackupJob()`
- MODIFIED: `src/server/cron.ts` — scheduling removed; `backfillEmbeddings` becomes an exported handler used by `SchedulerService`
- MODIFIED: `src/server/services/settings.service.ts` — reads/writes `app_settings`
- MODIFIED: `src/server/repositories/user.repository.ts` — removes 5 fields and 5 update methods
- MODIFIED: `src/server/services/item.service.ts` (lines 174, 215, 245) — reads flags from app_settings
- MODIFIED: `src/server/mcp/tools.ts:23` — reads `semantic_search_enabled` from app_settings
- MODIFIED: `src/server/index.ts` — calls `schedulerService.init()` at startup; settings route calls scheduler after DB write
- TESTS: adapted `backup.service.spec.ts`, `settings.service.spec.ts`, `item.service.spec.ts`, `auth.service.spec.ts`, `user.service.spec.ts`, `tag.service.spec.ts`, `migrations.spec.ts`; new `scheduler.service.spec.ts` and `app-settings.repository.spec.ts`
- No UI changes to `src/client/pages/Settings.svelte`: existing form fields map 1:1 to the new `app_settings` columns, and the "server local time" label already matches the TZ contract.
