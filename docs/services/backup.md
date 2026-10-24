> **Status:** Final — 2026-10-24
> **Open:** —

# Backup

## The filename is the contract

Backups are `<username>-backup-YYYY-MM-DD.json`, dated in server-local time (`TZ` from compose). Pruning parses the date from the name, and listing and download rely on the username prefix; there is no manifest and no database query. Download normalises the name with `basename` against path traversal and accepts only the prefix followed by a date and `.json`: usernames may contain `-`, so a prefix alone would let `bob` fetch the file of a user `bob-backup-x`. Change the format and list, download and pruning have to change together.

Satisfies: R13, R18 · Origin: #54, #72 · Date: 2026-03-02

## Restore keeps IDs only for the same user

If the backup's `username` equals the authenticated user, items keep their IDs and are upserted, so a re-import is idempotent. Otherwise every item gets a fresh UUID: without that, a backup of `jan` imported into `jana` replaced and re-owned 306 of jan's items. Restoring the same foreign backup twice duplicates items; `clearBeforeRestore` is the replace-everything path. Deterministic IDs were rejected because they bring the ownership bug back. Tags resolve by name, since IDs are not portable. The file is validated completely before any write, and clear plus insert run in one transaction.

Satisfies: R14, R2 · Origin: #78, #129 · Date: 2026-03-12, 2026-09-22
