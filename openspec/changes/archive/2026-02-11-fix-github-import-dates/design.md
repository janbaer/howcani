## Context

The data migration import feature currently ignores `created_at` timestamps from the GitHub JSON export. The JSON schema includes `created_at` (ISO timestamp), and the database schema supports explicit timestamp values, but the import implementation generates the current timestamp instead of using the JSON value.

**Current Implementation**:
- `src/tools/issue-mapper.ts`: `ItemData` interface lacks `created_at` field, so `mapIssueToItem()` doesn't extract it
- `src/tools/import-runner.ts:196`: Creates `const now = new Date().toISOString()` and uses it for both `created_at` and `updated_at`
- Database schema (migration v3): `created_at TEXT DEFAULT CURRENT_TIMESTAMP` allows explicit values to override the default
- Duplicate detection: Already implemented via `findExistingItem()` using normalized question matching
- Force flag: Existing `--force` flag updates existing items

**Constraints**:
- Must preserve backward compatibility with existing import command structure
- Users have already imported data with incorrect timestamps
- Database uses SQLite with TEXT columns for timestamps (ISO format)
- Import runs in a transaction for atomicity

## Goals / Non-Goals

**Goals:**
- Preserve original GitHub `created_at` timestamps during import
- Provide migration path for users to re-import with correct dates
- Prevent accidental data loss when re-importing
- Maintain transaction safety and idempotency

**Non-Goals:**
- Automatically fixing existing data (requires explicit user action)
- Migrating to different timestamp format or database type
- Batch updating existing records without full re-import
- Supporting partial timestamp updates (all-or-nothing re-import)

## Decisions

### Decision 1: Extend ItemData Interface to Include Timestamps

**Choice**: Add `created_at` field to `ItemData` interface and map it in `mapIssueToItem()`.

**Rationale**:
- **Why this**: Separation of concerns - mapper handles data transformation, runner handles database operations
- **Alternative considered**: Pass full `Issue` object to import-runner and extract timestamp there
  - **Rejected because**: Violates single responsibility - mapper's job is to transform all relevant fields
- **Alternative considered**: Create separate timestamp mapping function
  - **Rejected because**: Adds complexity, timestamps are part of item data like question/answer

**Implementation**:
```typescript
// src/tools/issue-mapper.ts
export interface ItemData {
  id?: number;
  question: string;
  answer: string;
  tags: TagData[];
  created_at: string; // Add ISO timestamp from JSON
}

export function mapIssueToItem(issue: Issue): ItemData {
  return {
    id: issue.number,
    question: mapTitleToQuestion(issue.title),
    answer: mapBodyToAnswer(issue.body),
    tags: mapLabelsToTags(issue.labels),
    created_at: issue.created_at, // Map from JSON
  };
}
```

### Decision 2: Use Explicit Timestamp in Database Insertion

**Choice**: Replace `const now = new Date().toISOString()` with `issue.created_at` from mapped data.

**Rationale**:
- **Why this**: Database schema already supports explicit values - `DEFAULT CURRENT_TIMESTAMP` is overridden when value provided
- **Alternative considered**: Modify schema to remove DEFAULT constraint
  - **Rejected because**: Breaking change, would require migration, DEFAULT is useful for other item creation paths
- **Alternative considered**: Use two different INSERT queries (with/without explicit timestamp)
  - **Rejected because**: Unnecessary complexity, single query handles both cases

**Implementation**:
```typescript
// src/tools/import-runner.ts (line 196-203)
const createdAt = issue.created_at; // Use from JSON instead of now
const updatedAt = new Date().toISOString(); // Keep current for updated_at

db.run(
  `INSERT INTO items (id, user_id, question, answer, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [id, userId, issue.question, issue.answer || "", createdAt, updatedAt],
);
```

**Note**: `updated_at` remains current timestamp since it represents when the record was last modified (initial import counts as update).

### Decision 3: Add Pre-Import Data Detection

**Choice**: Query items table before import to detect existing data for the user.

**Rationale**:
- **Why this**: Prevents accidental data loss by warning user before deletion
- **Alternative considered**: Always prompt regardless of existing data
  - **Rejected because**: Annoying for first-time imports on empty databases
- **Alternative considered**: Use file-based marker to detect previous imports
  - **Rejected because**: Database is source of truth, file state can diverge

**Implementation**:
```typescript
// src/tools/import-runner.ts
function hasExistingData(userId: string): boolean {
  const result = db.query<{ count: number }, []>(
    'SELECT COUNT(*) as count FROM items WHERE user_id = ?'
  ).get(userId);
  return result && result.count > 0;
}
```

### Decision 4: User Confirmation via Stdin Prompt

**Choice**: Add interactive prompt asking user to confirm deletion before re-import.

**Rationale**:
- **Why this**: Explicit user consent prevents accidental data destruction
- **Alternative considered**: Require `--yes` or `-y` flag to skip prompt
  - **Accepted as additional feature**: Support both interactive and non-interactive modes
- **Alternative considered**: Create backup before deletion
  - **Rejected because**: Adds complexity, users can backup database file manually if needed

**Implementation**:
```typescript
// src/tools/import-json.ts
async function promptForDeletion(itemCount: number): Promise<boolean> {
  console.log(`\n⚠️  Found ${itemCount} existing items in database.`);
  console.log('Re-importing will DELETE all existing data and replace with JSON data.');
  console.log('This is necessary to fix incorrect created_at timestamps.\n');

  const answer = prompt('Delete existing data and re-import? (yes/no): ');
  return answer?.toLowerCase() === 'yes';
}
```

### Decision 5: Add --force-reimport Flag

**Choice**: Add new `--force-reimport` flag instead of overloading existing `--force` flag.

**Rationale**:
- **Why this**: Separates "update duplicates" behavior from "delete all and re-import" behavior
- **Existing `--force`**: Updates existing items during import (preserves items not in JSON)
- **New `--force-reimport`**: Deletes ALL user items before import (replaces entire dataset)
- **Alternative considered**: Reuse `--force` flag with different behavior
  - **Rejected because**: Confusing semantic overload, risk of data loss from misunderstanding
- **Alternative considered**: Require both flags together (`--force --delete-existing`)
  - **Rejected because**: Verbose, single flag is clearer

**Implementation**:
```bash
# Update existing duplicates (preserves other items)
bun run import:json --user john --file ./data/issues.json --force

# Delete all items and re-import (replaces all data)
bun run import:json --user john --file ./data/issues.json --force-reimport

# Non-interactive mode (auto-confirm deletion)
bun run import:json --user john --file ./data/issues.json --force-reimport --yes
```

### Decision 6: Delete-and-Import Strategy

**Choice**: Delete all user items in same transaction before importing with correct timestamps.

**Rationale**:
- **Why this**: Transaction ensures atomicity - either all old data deleted and new data imported, or nothing changes
- **Alternative considered**: Update existing items with new timestamps
  - **Rejected because**: Complex mapping (item IDs may have changed due to conflicts), doesn't handle deleted items
- **Alternative considered**: Truncate entire table
  - **Rejected because**: Multi-user system, would delete other users' data

**Implementation**:
```typescript
// src/tools/import-runner.ts
if (options.forceReimport) {
  runTransaction(() => {
    // Delete all user items (cascades to item_tags via FOREIGN KEY)
    db.run('DELETE FROM items WHERE user_id = ?', [userId]);

    // Delete orphaned tags (no longer referenced by any items)
    db.run('DELETE FROM tags WHERE user_id = ? AND id NOT IN (SELECT tag_id FROM item_tags)', [userId]);

    // Import all items with correct timestamps
    for (const issue of issues) {
      // ... import logic
    }
  })();
}
```

## Risks / Trade-offs

**[Risk] Users may not realize they need to re-import** → Mitigation:
- Add migration guide to proposal/docs
- Log warning on first import after fix: "Note: If you imported before 2026-02-11, re-import with --force-reimport to fix timestamps"

**[Risk] Accidental data loss from misunderstanding --force-reimport** → Mitigation:
- Interactive prompt requires typing "yes" (not just y)
- Clear warning message explaining data will be deleted
- Non-interactive mode requires explicit `--yes` flag

**[Risk] Large datasets may take time to delete and re-import** → Mitigation:
- Transaction ensures atomicity - no partial state
- Progress indicators show import status
- Users can test with `--dry-run` first

**[Trade-off] updated_at uses current timestamp instead of JSON value**:
- **Accepted because**: `updated_at` represents last modification time, import IS a modification
- **Benefit**: Distinguishes between original creation and import time
- **Alternative**: Could add `imported_at` column separately if needed in future

**[Trade-off] Requires full re-import to fix existing data**:
- **Accepted because**: Simpler than complex timestamp-only updates, ensures data integrity
- **Benefit**: Re-import also picks up any other JSON data that might have been skipped previously
- **Limitation**: Users must have original JSON file (already requirement for repeatable imports)

## Migration Plan

**For New Users**:
- No action needed - fix is transparent, imports use correct timestamps automatically

**For Existing Users** (who already imported data):
1. Ensure JSON export file is available (`./data/issues.json` or equivalent)
2. Backup database if desired: `cp database.db database.backup.db`
3. Run re-import with new flag:
   ```bash
   bun run import:json --user <username> --file ./data/issues.json --force-reimport
   ```
4. Confirm deletion when prompted (or use `--yes` for non-interactive)
5. Verify correct timestamps in UI or database query:
   ```sql
   SELECT question, created_at FROM items WHERE user_id = '<user-id>' ORDER BY created_at LIMIT 10;
   ```

**Rollback Strategy**:
- If import fails mid-transaction, automatic rollback restores original state
- If user has backup: `cp database.backup.db database.db`
- If no backup and import completed: Re-run import with original JSON to restore (timestamps will still be wrong)

**Deployment**:
- Code change only - no database migration needed (schema already supports explicit timestamps)
- Backward compatible - existing imports without re-import continue working (just with wrong dates)
- Can deploy immediately, users re-import at their convenience

## Open Questions

**Q: Should we add `imported_at` column to track when data was imported?**
- Current: `updated_at` serves this purpose
- Trade-off: Adds column complexity vs better auditability
- **Decision deferred**: Not needed for this fix, can add in separate change if needed

**Q: Should we validate timestamp format from JSON before import?**
- Current: JSON validation already checks `created_at` is a string
- Risk: Invalid ISO format could cause SQLite errors
- **Decision**: Add basic ISO format validation in mapper (regex check) to fail fast with clear error

**Q: Should --force-reimport also update tags with new colors from JSON?**
- Current: Tag deletion removes orphaned tags, re-import creates with JSON colors
- Edge case: If tag exists for other items, color won't update
- **Decision**: Accepted limitation for now - focus on timestamps, tag color sync can be separate feature
