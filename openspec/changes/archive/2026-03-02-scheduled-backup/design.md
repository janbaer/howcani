## Context

The project already has an in-process cron (`src/server/cron.ts`) that runs embedding backfill every 5 minutes via `setInterval`. Per-user settings (`semantic_search_enabled`, `duplicate_threshold`) are stored as columns on the `users` table and exposed through `SettingsService` + `PATCH /api/:username/settings`. The Settings page follows a consistent toggle/input pattern for each setting.

## Goals / Non-Goals

**Goals:**
- Daily per-user JSON backup written to `./data/backups/<username>-backup-YYYY-MM-DD.json`
- Opt-in toggle and configurable retention window (1–30 days, default 7) in Settings
- Automatic pruning of backup files older than the user's retention window

**Non-Goals:**
- In-app download of backup files (follow-up)
- Import/restore from backup (follow-up)
- Off-site or cloud backup storage

## Decisions

**In-process cron over external scheduler** — The project already uses `setInterval` for embeddings; adding a second interval in `cron.ts` keeps deployment identical (no crontab, no systemd timers). Trade-off: backup is skipped if the server is down at the 24h mark, which is acceptable for a best-effort local backup.

**One file per user per day** — Named `<username>-backup-YYYY-MM-DD.json` so pruning is purely date-based (parse filename, compare to cutoff) without needing a manifest file.

**JOIN query for items + tags** — A single SQL query joining `items`, `item_tags`, and `tags` avoids N+1 queries. Rows are collapsed in memory per item to build the `tags: string[]` array.

**No non-null assertions** — Tag name can be null from the LEFT JOIN; explicitly guarded before pushing to the tags array.

## Risks / Trade-offs

- [Large knowledge base] → A user with thousands of items produces a large JSON file. Acceptable for a self-hosted tool; no streaming needed at this scale.
- [Clock skew / DST] → Using `new Date().toISOString().slice(0, 10)` (UTC date) avoids DST ambiguity in filenames.
- [Concurrent writes] — `setInterval` is single-threaded in Bun; no race conditions possible.
