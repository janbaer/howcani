## Context

The existing backup system writes daily JSON snapshots to `/data/backups/` and serves them for download. The backup file format (`BackupFile`) includes version, username, exportedAt, and a flat items array with tag names. There is no restore path — users can download backups but cannot import them.

The restore feature must work across users and instances (a backup from user A can be imported by user B), which means the importing user's identity must be decoupled from the `username` field inside the backup file.

## Goals / Non-Goals

**Goals:**
- Accept a backup file upload via the Settings UI
- Validate the backup file schema before touching the database
- Import all items with their original `createdAt`/`updatedAt` timestamps
- Optionally clear the authenticated user's data before importing (clean restore)
- Work cross-user: backup from any user/instance imports into the authenticated user's account

**Non-Goals:**
- Incremental/merge import (deduplication by content or ID) — too complex for v1, full import only
- Progress indication for large imports
- Re-generating embeddings during import (the existing 5-minute cron backfill handles this)

## Decisions

### D1: Upsert on original ID

Backup items carry their original UUIDs. On import, use `INSERT OR REPLACE` with the original ID so re-importing the same backup is idempotent.

**Why:** Fresh UUIDs would create duplicates on every re-import of the same backup. Upserting on original ID means same-user recovery is safe to repeat, and cross-user imports work because the target user has no items with those IDs. The UI warns the user that existing items with matching IDs will be overwritten.

**Alternative considered:** New UUIDs — rejected because it silently creates duplicates on repeated imports.

### D2: Tags resolved by name, not ID

Tags in backup files are stored as name strings. During import, look up each tag by name for the target user; create it if it does not exist.

**Why:** Tag IDs are local to the instance and user. Name-based resolution is the only portable approach.

### D3: Clear-before-restore is a request parameter, not a separate endpoint

A boolean `clearBeforeRestore` field in the multipart form body controls whether to wipe existing items/tags before importing.

**Why:** Single endpoint is simpler to implement, test, and document. The two operations (clear + import) are atomic from the user's perspective.

### D4: Import done directly in backup service, not via ItemService

The restore function writes directly to the repository layer, bypassing `ItemService` business logic (embedding generation, etc.).

**Why:** Embedding generation is async/fire-and-forget and handled by the cron backfill. Bypassing ItemService avoids triggering unnecessary side effects on bulk import and keeps the restore path fast.

### D5: Schema validation before any DB writes

Validate the uploaded JSON against the `BackupFile` shape before starting any database transaction. Return 400 if validation fails.

**Why:** Fail-fast prevents partial writes and gives the user a clear error message if they upload the wrong file type.

## Risks / Trade-offs

- **Large backup files**: No streaming — entire file parsed into memory. For typical personal knowledge bases this is fine; unusually large databases (10k+ items) could spike memory. → Mitigation: document a reasonable max size; Elysia body size limit applies.
- **Clear-before-restore is irreversible**: If the upload fails mid-import after clearing, user data is gone. → Mitigation: validate and parse the entire backup file before issuing any DELETE; wrap clear + insert in a single SQLite transaction.
- **Upsert silently overwrites edits**: A re-import overwrites any changes made to an item since the backup was taken. → Mitigation: UI displays a persistent warning that existing items may be overwritten before the user confirms the upload.

## Migration Plan

No database schema changes. Deploy is a standard version bump; rollback is redeploying the previous image.

## Open Questions

None — design is complete.
