## Context

Before this change, scheduling lives in two modules:

1. `src/server/cron.ts` — `setInterval(backfillEmbeddings, 5 * 60 * 1000)`.
2. `src/server/services/backup.service.ts` — `setInterval(runScheduledBackups, 60 * 1000)`. Inside `runScheduledBackups(dir, time = currentHHMM())`, a SQL query matches users whose `backup_time` equals the current HH:MM string.

The per-user design comes from an earlier multi-user model that never materialised in practice. All operator-facing settings (`semantic_search_enabled`, `duplicate_threshold`, `backup_enabled`, `backup_retention_days`, `backup_time`) are columns on `users`. The current operator is a single user with a handful of legacy accounts from GitHub imports.

Bun 1.3.12 introduced `Bun.cron(expression, handler, options)`. The handler returns a Disposable (has `.stop()`), and `options.timezone` accepts an IANA name.

## Goals / Non-Goals

### Goals
- Replace both `setInterval` schedulers with `Bun.cron`.
- Give the backup cron explicit timezone semantics (no reliance on `Date.getHours()`).
- Collapse the five scheduling columns on `users` into a single global singleton table `app_settings`.
- Settings changes take effect without a server restart.

### Non-Goals
- No UI changes. The Settings page already has the five fields; only the data source flips.
- No per-user cron registration. Only one backup cron and one embedding cron run globally.
- No TZ column in `app_settings`. The server TZ is the source of truth.
- No preservation of existing per-user values during migration.
- No new capabilities beyond the two existing crons.

## Decisions

### Decision 1: Singleton table enforced by `CHECK(id = 1)`

```sql
CREATE TABLE app_settings (
  id                      INTEGER PRIMARY KEY CHECK(id = 1),
  semantic_search_enabled INTEGER NOT NULL DEFAULT 1,
  duplicate_threshold     INTEGER NOT NULL DEFAULT 80,
  backup_enabled          INTEGER NOT NULL DEFAULT 0,
  backup_time             TEXT    NOT NULL DEFAULT '20:00',
  backup_retention_days   INTEGER NOT NULL DEFAULT 7
);
INSERT INTO app_settings (id) VALUES (1);
```

**Why not a key/value settings table?** The key set is small, known, and typed. Named columns stay honest with the schema; key/value would push the shape into application code and force stringly-typed reads.

**Why `CHECK(id = 1)` rather than no primary key?** Guarantees at most one row. Any attempt to insert a second row fails. Reads are `SELECT ... FROM app_settings WHERE id = 1`.

### Decision 2: Drop the five replaced columns from `users`

SQLite supports `ALTER TABLE ... DROP COLUMN` since 3.35. The migration drops `semantic_search_enabled`, `duplicate_threshold`, `backup_enabled`, `backup_retention_days`, `backup_time`. Keeping them would let code drift and create confusion about which value is authoritative.

### Decision 3: Defaults-only migration (no value preservation)

The migration inserts the singleton row using column defaults. It does not copy values from any existing user row. The single operator will re-toggle after deploy.

**Alternative considered:** copying values from the first user by `created_at ASC`. Rejected — the operator explicitly chose simplicity over one-time migration correctness, and the only cost is re-enabling two toggles.

### Decision 4: Timezone from the server's runtime

`Bun.cron` defaults to UTC. Backup fires use `timezone: Intl.DateTimeFormat().resolvedOptions().timeZone`, which returns the process's current TZ (`TZ` env var or OS default). The UI label "server local time" becomes literally accurate.

**Alternative considered:** hardcoding `'Europe/Berlin'` or adding a `timezone` column. Rejected — the Docker container's `TZ` env var already controls the server TZ; a column would duplicate that.

### Decision 5: `SchedulerService` owns the cron handles

```ts
class SchedulerService {
  private backupHandle: Disposable | null = null;
  private embeddingHandle: Disposable | null = null;

  init(): void {
    // Read app_settings, call applyBackupSettings and applyEmbeddingSettings.
  }

  applyBackupSettings({ enabled, time }: { enabled: boolean; time: string }): void {
    this.backupHandle?.stop();
    this.backupHandle = null;
    if (!enabled) return;
    const [h, m] = time.split(':').map(Number);
    this.backupHandle = Bun.cron(`${m} ${h} * * *`, () => runBackupJob(), {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }

  applyEmbeddingSettings({ enabled }: { enabled: boolean }): void {
    this.embeddingHandle?.stop();
    this.embeddingHandle = null;
    if (!enabled || !process.env.OPENROUTER_API_KEY) return;
    this.embeddingHandle = Bun.cron('*/5 * * * *', () => backfillEmbeddings(), {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }
}
```

Called once from `src/server/index.ts` at startup, and from the `PATCH /api/settings` route after the DB write. Tests mock `Bun.cron` to observe the expression string and `.stop()` calls.

### Decision 6: Backup handler iterates all users

The backup cron fires at a single time; the handler iterates every row in `users` and calls the existing `runBackupForUser(user, dir)` for each, which remains idempotent (skips if today's file exists). This future-proofs the "more than one user" case without adding complexity.

## Risks / Trade-offs

- **Operator must re-toggle after deploy.** Accepted — the cost is two clicks.
- **Dropping columns in SQLite triggers a table rebuild.** With the current row count this is negligible; we run it inside `runMigrations()` at startup.
- **Bun.cron is new (1.3.12).** Risk of handler-in-flight-vs-stop races. Mitigated by idempotency (backup's file-exists check, embedding's per-item write) — a handler that keeps running after `.stop()` will finish correctly; only new ticks are suppressed.
- **Test doubles for `Bun.cron`.** We wrap the call behind a `cronFactory` injected into `SchedulerService` so tests can assert the cron expression and stop behavior without real timers firing.

## Migration Plan

Single migration entry appended to `src/server/db/migrations.ts`:

```sql
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  semantic_search_enabled INTEGER NOT NULL DEFAULT 1,
  duplicate_threshold INTEGER NOT NULL DEFAULT 80,
  backup_enabled INTEGER NOT NULL DEFAULT 0,
  backup_time TEXT NOT NULL DEFAULT '20:00',
  backup_retention_days INTEGER NOT NULL DEFAULT 7
);
INSERT INTO app_settings (id) VALUES (1);
ALTER TABLE users DROP COLUMN semantic_search_enabled;
ALTER TABLE users DROP COLUMN duplicate_threshold;
ALTER TABLE users DROP COLUMN backup_enabled;
ALTER TABLE users DROP COLUMN backup_retention_days;
ALTER TABLE users DROP COLUMN backup_time;
```

After the migration runs, the operator must re-toggle `backup_enabled` and set `backup_time` via the Settings page (defaults: backup off, semantic search on).

## Open Questions

None. All design questions were resolved in the interview on 2026-04-17.
