## 1. Backend — Backup Service

- [x] 1.1 Add `listBackupsForUser(username, dir?)` to `backup.service.ts` — reads `BACKUP_DIR`, filters by `<username>-backup-` prefix and `.json` extension, returns `{ filename, date, sizeBytes }[]` sorted newest-first

## 2. Backend — API Routes

- [x] 2.1 Add `GET /backups` route to `settings.routes.ts` — calls `listBackupsForUser`, requires auth
- [x] 2.2 Add `GET /backups/:filename` route — validates filename prefix matches authenticated user, streams the file with `Content-Disposition: attachment`, returns 404 for missing/wrong-user files

## 3. Backend — Tests

- [x] 3.1 Add unit tests for `listBackupsForUser` in `backup.service.spec.ts`
- [x] 3.2 Add route tests for `GET /backups` and `GET /backups/:filename` in `settings.routes.spec.ts`

## 4. Frontend — API Client

- [x] 4.1 Add `listBackups()` and `downloadBackupUrl(filename)` helpers to the `settings` API module in `src/client/lib/api.ts`

## 5. Frontend — Settings Page

- [x] 5.1 Add backup list state (`backups`, `backupsLoading`) to `Settings.svelte` and fetch on mount
- [x] 5.2 Add "Your backups" section to Settings.svelte — renders a list with date, formatted size, and download link per entry; shows empty state when the array is empty
