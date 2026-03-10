## Context

Backup files are written to `BACKUP_DIR` (`/data/backups`) with the naming convention `<username>-backup-YYYY-MM-DD.json`. The backup service already reads this directory for pruning. The Settings page currently allows configuring backup behaviour but has no visibility into what files actually exist.

## Goals / Non-Goals

**Goals:**
- Expose a read-only list of the authenticated user's backup files via the existing settings API
- Allow per-file download from the API
- Render the list inline in the Settings page

**Non-Goals:**
- Deleting backup files from the UI
- Triggering a manual backup from the UI
- Pagination (retention is max 30 days; the list is always short)

## Decisions

**Serve files as a streaming download, not base64 JSON** — The files can be several MB. Streaming via `Bun.file()` / `Response` with `Content-Disposition: attachment` avoids buffering the entire file in memory and is the idiomatic Bun/Elysia approach.

**List endpoint filters by username prefix** — `<username>-backup-` is already the established naming convention. The endpoint reads `BACKUP_DIR`, filters by prefix and `.json` extension, parses the date from the filename, and returns `{ filename, date, sizeBytes }` sorted newest-first. No DB query needed.

**Download endpoint validates filename ownership** — The route param `:filename` is validated server-side to match the authenticated user's prefix before serving, preventing path traversal or cross-user access.

**UI: always show the section** — The backup list is shown regardless of whether `backupEnabled` is on. Users may have historic backups and turn off the feature; they should still be able to download them.

## Risks / Trade-offs

- [Large backup directory] → Mitigated by retention pruning (max 30 files per user in practice)
- [Filename param injection] → Mitigated by server-side prefix check and `node:path basename` normalisation before file serving

## Migration Plan

No schema changes. Deploy is a standard Docker image push.
