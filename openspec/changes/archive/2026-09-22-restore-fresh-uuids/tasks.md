# Tasks: restore-fresh-uuids

## 1. Implementation

- [x] 1.1 `restoreBackup`: resolve the authenticated user's username; when it
      differs from `data.username`, assign fresh UUIDs to all imported items
      (and use them for tag linking)
- [x] 1.2 Cross-user test: B's restored items get new UUIDs, none matches an
      ID from the backup; A's items unchanged (same IDs, owner, content, tags)
- [x] 1.3 Cross-user test: B's restored items carry the backup's tags
- [x] 1.4 Replace `works cross-user` test with one that seeds A with tagged
      items, exports a real backup via `runBackupForUser`, restores into B, and
      asserts A's items are untouched
- [x] 1.5 Keep same-user idempotency test green (original IDs on re-import)

## 2. Validation

- [x] 2.1 `bun run lint` passes
- [x] 2.2 `bun test --isolate` passes (all restore tests incl. new ones)