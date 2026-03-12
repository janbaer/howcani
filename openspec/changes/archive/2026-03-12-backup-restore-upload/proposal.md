## Why

Users can download backup files but have no way to restore from them — making backups useful only for manual inspection. This gap means data recovery and cross-instance migration require direct database access, which defeats the purpose of having backups.

## What Changes

- Add `POST /settings/backups/restore` API endpoint accepting a multipart file upload
- Validate the uploaded file matches the backup schema (`version`, `username`, `exportedAt`, `items`)
- Optionally delete all existing items and tags for the authenticated user before importing
- Import all items from the backup, preserving original item IDs and `createdAt`/`updatedAt` timestamps (existing items with the same ID are overwritten — idempotent re-import)
- Create or reuse tags by name in the target user's account
- Add an "Upload backup" button and file input to `BackupSection.svelte` in Settings
- Add `settings.restoreBackup(file, clearBeforeRestore)` to the API client

## Capabilities

### New Capabilities

- `backup-restore`: Restore all items and tags from an uploaded backup file into the authenticated user's account, with optional pre-clear

### Modified Capabilities

- `scheduled-backup`: Extends existing backup spec with restore requirements

## Impact

- **Backend**: New route in `settings.routes.ts`, new `restoreBackup()` function in `backup.service.ts`
- **Frontend**: `BackupSection.svelte` gains upload UI; `api.ts` gains `settings.restoreBackup()`
- **Database**: No schema changes — uses existing items/tags/item_tags tables and services
- **Security**: File upload is authenticated; filename/content validated before any DB writes
