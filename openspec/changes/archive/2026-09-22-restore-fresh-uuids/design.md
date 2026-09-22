# Design: restore-fresh-uuids

## Context

`restoreBackup(userId, data, clearBeforeRestore)` inserts items with the IDs
from the backup file. Ownership comes from the `userId` argument, so a
cross-user import with `INSERT OR REPLACE` replaces the original owner's rows.

## Approach

Look up the authenticated user's username (already needed context: the backup
carries `username`). If `data.username !== authenticatedUser.username`, map
every backup item to a fresh `crypto.randomUUID()` and insert with that ID;
tag links use the new IDs too. Same-user restores skip the mapping entirely so
re-import stays idempotent.

The username comparison needs the authenticated user's username, not just the
id; `restoreBackup` resolves it via `userRepository.findById(userId)` inside
the validated transaction path.

Fresh IDs mean the restored items have no embeddings (`vec_items` rows);
the existing embedding backfill picks them up on its next tick — same behavior
as any newly created item.

## Risks / Trade-offs

- Two restores of the same foreign backup into the same account produce
  duplicates (fresh IDs each time). This is correct for the cross-user case:
  the restore is an import, not an upsert, and the alternative (deterministic
  IDs) recreates the ownership bug. `clearBeforeRestore` covers the
  replace-everything case.

## Migration Plan

None — restore-time behavior only, no stored data changes.