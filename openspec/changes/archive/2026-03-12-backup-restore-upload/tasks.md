## 1. Backend — Service

- [x] 1.1 Add `restoreBackup(userId, file, clearBeforeRestore)` to `backup.service.ts`: parse JSON, validate schema (`version`, `items`), return 400 on failure
- [x] 1.2 Implement clear logic: if `clearBeforeRestore=true`, delete all items (cascades to `item_tags`) then all tags for the user
- [x] 1.3 Implement import loop: for each item, upsert into `items` using `INSERT OR REPLACE` with original ID and original `createdAt`/`updatedAt`, resolve-or-create tags by name, insert `item_tags` rows
- [x] 1.4 Wrap clear + insert in a single SQLite transaction

## 2. Backend — Route

- [x] 2.1 Add `POST /settings/backups/restore` to `settings.routes.ts`: accept multipart body (`file`, `clearBeforeRestore` boolean string)
- [x] 2.2 Call `restoreBackup()`, return `{ imported: N }` on success or appropriate HTTP error
- [x] 2.3 Add route tests to `settings.routes.spec.ts`: valid file, invalid file (400), cross-user backup file, clear-before-restore

## 3. Backend — Service Tests

- [x] 3.1 Add unit tests to `backup.service.spec.ts`: valid restore, invalid JSON, missing fields, timestamp preservation, tag creation, clear-before-restore

## 4. Frontend — API Client

- [x] 4.1 Add `settings.restoreBackup(file: File, clearBeforeRestore: boolean): Promise<{ imported: number }>` to `api.ts`

## 5. Frontend — UI

- [x] 5.1 Add upload UI to `BackupSection.svelte`: hidden file input, "Upload backup" button that triggers it
- [x] 5.2 Show a warning that existing items may be overwritten, plus a "Delete existing data before restoring" checkbox, when a file is selected
- [x] 5.3 Call `settings.restoreBackup()` on submit, show success message with item count
- [x] 5.4 Show error message if restore fails
