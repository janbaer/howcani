# Proposal: restore-fresh-uuids

## Why

`restoreBackup` keeps the original item IDs from the backup file and upserts
with `INSERT OR REPLACE`. Restoring a backup created by user A into user B's
account therefore overwrites user A's existing items and silently reassigns
their ownership to B (observed with a `jan` backup imported into a new `jana`
account: 306 items moved owner).

## What Changes

- When the backup's `username` differs from the authenticated user performing
  the restore, every imported item gets a fresh UUID instead of the original.
- Same-user restores (idempotent re-imports) keep the original IDs.
- Tests: cross-user restore generates new UUIDs and leaves user A's items
  untouched; same-user restore stays idempotent.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — internal data-integrity fix in the backup restore path)

## Impact

- `src/server/services/backup.service.ts` (restore path)
- `src/server/services/backup.service.spec.ts` (cross-user tests)