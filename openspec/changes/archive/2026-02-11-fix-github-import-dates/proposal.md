## Why

The data migration import currently ignores the original `created_at` timestamps from the GitHub JSON export, causing all imported items to have the current date instead of their historical creation dates. This makes the temporal data inaccurate and loses important historical context about when questions were originally asked.

The JSON export already contains the correct `created_at` timestamps from GitHub, but the import logic doesn't use them—it lets the database auto-generate timestamps, resulting in all items appearing to be created "today" regardless of their actual age.

## What Changes

- **Preserve original timestamps**: Modify import logic to read and use `created_at` from JSON instead of allowing database to auto-generate timestamps
- **Update database insertion**: Ensure SQLite `items` table insertion accepts explicit `created_at` values (disable auto-generation during import)
- **Pre-import data check**: Add detection of existing imported data before starting import
- **User confirmation prompt**: Ask user whether to delete existing data before re-importing with correct dates
- **Re-import support**: Add `--force-reimport` flag to automatically delete existing data and perform fresh import with correct timestamps

## Capabilities

### New Capabilities
<!-- No new capabilities being introduced -->

### Modified Capabilities
- `data-migration`:
  - Add requirement to preserve original `created_at` timestamps from JSON during import
  - Add requirement for user confirmation prompt when existing data is detected
  - Add `--force-reimport` flag to delete and re-import data with correct dates

## Impact

**Code Changes**:
- `src/tools/import-json.ts` - Add pre-import check for existing data, add user confirmation prompt for deletion
- `src/tools/import-runner.ts` - Modify item insertion to use `created_at` from JSON instead of auto-generated timestamps
- `src/tools/issue-mapper.ts` - Add `created_at` field mapping during issue-to-item transformation
- Database schema/query logic - Verify `items` table accepts explicit `created_at` values (may need to modify `DEFAULT CURRENT_TIMESTAMP` behavior during import)

**Data Impact**:
- All currently imported items have incorrect timestamps (current date instead of original GitHub creation date)
- Users will need to re-import JSON data after this fix to get correct historical dates
- Pre-import prompt prevents accidental data loss when re-importing
