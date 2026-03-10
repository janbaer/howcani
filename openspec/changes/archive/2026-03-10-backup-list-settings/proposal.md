## Why

Users who enable daily backups have no way to verify they exist or retrieve them without server access. Showing the backup list directly in Settings gives confidence that backups are working and makes data portability self-serve.

## What Changes

- New API endpoint `GET /api/settings/backups` returns the list of backup files for the authenticated user (filename, date, size in bytes), sorted newest-first
- New API endpoint `GET /api/settings/backups/:filename` streams the backup file as a download
- Settings page gains a "Your backups" section below the backup settings, listing files with date, size, and a download button
- Empty state shown when no backup files exist for the user

## Capabilities

### New Capabilities
- `backup-list`: List and download backup files belonging to the authenticated user via the Settings API and UI

### Modified Capabilities
- `scheduled-backup`: No requirement changes — implementation only adds new read endpoints on top of the existing backup service

## Impact

- `src/server/services/backup.service.ts` — new `listBackupsForUser()` function
- `src/server/routes/settings.routes.ts` — two new GET routes
- `src/client/pages/Settings.svelte` — new backup list UI section
- No schema changes, no migrations required
