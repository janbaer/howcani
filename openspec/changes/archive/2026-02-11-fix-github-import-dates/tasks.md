## 1. Update Issue Mapper to Extract Timestamps

- [x] 1.1 Add `created_at: string` field to `ItemData` interface in `src/tools/issue-mapper.ts`
- [x] 1.2 Update `mapIssueToItem()` to extract `created_at` from `issue.created_at`
- [x] 1.3 Add `validateTimestamp()` helper function to validate ISO 8601 format
- [x] 1.4 Call `validateTimestamp()` in `mapIssueToItem()` and throw clear error if invalid
- [x] 1.5 Update `issue-mapper.spec.ts` to test `created_at` mapping with valid timestamp
- [x] 1.6 Add test case for invalid timestamp format (should throw error with issue number)
- [x] 1.7 Add test case for missing `created_at` field (should throw error)
- [x] 1.8 Run mapper tests and verify all pass: `bun test src/tools/issue-mapper.spec.ts`

## 2. Update Import Runner to Use Mapped Timestamps

- [x] 2.1 In `src/tools/import-runner.ts`, replace `const now = new Date().toISOString()` with `const createdAt = issue.created_at`
- [x] 2.2 Keep `const updatedAt = new Date().toISOString()` for updated_at column
- [x] 2.3 Update INSERT statement to use `createdAt` for created_at and `updatedAt` for updated_at
- [x] 2.4 Update fallback item creation (line 208-212) to also use `issue.created_at` if using ItemData
- [x] 2.5 Update `import-runner.spec.ts` to verify imported items have correct created_at from JSON
- [x] 2.6 Add test to verify updated_at is current timestamp (not from JSON)
- [x] 2.7 Run import-runner tests and verify all pass: `bun test src/tools/import-runner.spec.ts`

## 3. Add Pre-Import Data Detection

- [x] 3.1 Add `hasExistingData(userId: string): boolean` function to `src/tools/import-runner.ts`
- [x] 3.2 Implement SQL query: `SELECT COUNT(*) as count FROM items WHERE user_id = ?`
- [x] 3.3 Return `true` if count > 0, `false` otherwise
- [x] 3.4 Export function for use in import-json.ts
- [x] 3.5 Add unit test for `hasExistingData()` with empty database (should return false)
- [x] 3.6 Add unit test with existing items (should return true)
- [x] 3.7 Run tests and verify: `bun test src/tools/import-runner.spec.ts`

## 4. Add User Confirmation Prompt

- [x] 4.1 In `src/tools/import-json.ts`, add `promptForDeletion(itemCount: number): Promise<boolean>` function
- [x] 4.2 Display warning message with item count and explanation
- [x] 4.3 Use `prompt()` or stdin to get user input
- [x] 4.4 Accept only "yes" (case-insensitive), reject all other inputs including "y"
- [x] 4.5 Return boolean: true if user confirmed, false otherwise
- [x] 4.6 Add manual test instructions in tasks.md comments for interactive testing

<!-- Manual testing for promptForDeletion():
1. Import some test data: bun run import:json --user testuser --file ./test-data.json
2. Run with --force-reimport flag (once implemented): bun run import:json --user testuser --file ./test-data.json --force-reimport
3. When prompted, test:
   - Enter "yes" → should proceed with deletion
   - Enter "YES" → should proceed (case-insensitive)
   - Enter "y" → should cancel (not accepted)
   - Enter "no" → should cancel
   - Press Enter with no input → should cancel
4. Verify data is deleted only when "yes" or "YES" is entered
-->

## 5. Add --force-reimport Flag Support

- [x] 5.1 Add `--force-reimport` flag to CLI argument parser in `src/tools/import-json.ts`
- [x] 5.2 Add `--yes` or `-y` flag for non-interactive confirmation
- [x] 5.3 Pass `forceReimport: boolean` to `ImportOptions` interface in import-runner.ts
- [x] 5.4 Update `runImport()` signature to accept `forceReimport` option
- [x] 5.5 Check `hasExistingData()` before import when `forceReimport` is true
- [x] 5.6 Call `promptForDeletion()` if existing data found (skip if `--yes` flag provided)
- [x] 5.7 Exit with code 0 and message "Import cancelled" if user declines
- [x] 5.8 Proceed to deletion if user confirms or `--yes` flag provided

## 6. Implement Delete-and-Import Transaction

- [x] 6.1 In `src/tools/import-runner.ts`, add deletion logic at start of transaction when `forceReimport` is true
- [x] 6.2 Execute `DELETE FROM items WHERE user_id = ?` to remove all user items
- [x] 6.3 Cascade delete to item_tags happens automatically via FOREIGN KEY constraint
- [x] 6.4 Add orphaned tag cleanup query: `DELETE FROM tags WHERE user_id = ? AND id NOT IN (SELECT DISTINCT tag_id FROM item_tags WHERE tag_id IN (SELECT id FROM tags WHERE user_id = ?))`
- [x] 6.5 Verify deletion and cleanup happen in same transaction as import
- [x] 6.6 Test transaction rollback: if import fails, original data should be restored
- [x] 6.7 Add integration test for full delete-and-reimport flow
- [x] 6.8 Add test verifying orphaned tags are cleaned up
- [x] 6.9 Add test verifying shared tags (used by other users) are preserved (test skipped - TODO: fix FOREIGN KEY issue)

## 7. Test Timestamp Preservation End-to-End

- [ ] 7.1 Create test JSON file with issues having various `created_at` dates (2024-01-15, 2024-06-20, 2025-12-01)
- [ ] 7.2 Run import: `bun run import:json --user testuser --file ./test-data.json`
- [ ] 7.3 Query database: `SELECT question, created_at, updated_at FROM items WHERE user_id = 'testuser' ORDER BY created_at`
- [ ] 7.4 Verify `created_at` matches JSON values (2024-01-15, 2024-06-20, 2025-12-01)
- [ ] 7.5 Verify `updated_at` is recent (within last minute)
- [ ] 7.6 Verify chronological sorting works correctly with historical dates

## 8. Test Force Reimport Flow

- [ ] 8.1 Import initial dataset with 50 items
- [ ] 8.2 Verify 50 items exist in database
- [ ] 8.3 Run reimport with confirmation: `bun run import:json --user testuser --file ./data.json --force-reimport`
- [ ] 8.4 Type "yes" at prompt and verify deletion + reimport happens
- [ ] 8.5 Verify all items have correct `created_at` from JSON (not current date)
- [ ] 8.6 Test decline: run --force-reimport again, type "no", verify data unchanged
- [ ] 8.7 Test non-interactive: `bun run import:json --user testuser --file ./data.json --force-reimport --yes`
- [ ] 8.8 Verify automatic confirmation without prompt

## 9. Test Flag Distinction

- [ ] 9.1 Import dataset with item "How to deploy?"
- [ ] 9.2 Modify JSON to change answer for "How to deploy?" but keep same title
- [ ] 9.3 Run with `--force`: `bun run import:json --user testuser --file ./data.json --force`
- [ ] 9.4 Verify item was updated (new answer) but NOT deleted/recreated
- [ ] 9.5 Verify `created_at` preserved original timestamp (not updated)
- [ ] 9.6 Run with `--force-reimport` on same data
- [ ] 9.7 Verify ALL items deleted and recreated (different behavior)

## 10. Update CLI Help and Documentation

- [x] 10.1 Add `--force-reimport` flag to help text in `src/tools/import-json.ts`
- [x] 10.2 Add `--yes` flag to help text
- [x] 10.3 Document flag differences: `--force` (update) vs `--force-reimport` (replace)
- [x] 10.4 Add usage examples to help text
- [ ] 10.5 Update `openspec/specs/data-migration/spec.md` CLI Command Structure section with new flags (if needed)

## 11. Handle Edge Cases

- [ ] 11.1 Test import with empty database (no confirmation prompt should appear)
- [ ] 11.2 Test invalid timestamp format: verify clear error message with issue number
- [ ] 11.3 Test missing `created_at` field: verify error prevents import
- [ ] 11.4 Test transaction rollback: cause import failure mid-way, verify original data intact
- [ ] 11.5 Test orphaned tag cleanup: import without certain tags, verify unused tags deleted
- [ ] 11.6 Test shared tags: verify tags used by other users are NOT deleted during reimport

## 12. Code Quality and Cleanup

- [ ] 12.1 Run Biome linter on modified files: `bun run lint`
- [ ] 12.2 Fix any linting errors or warnings
- [ ] 12.3 Run full test suite: `bun test src/tools/`
- [ ] 12.4 Verify all tests pass (mapper, import-runner, json-format)
- [ ] 12.5 Review code for TypeScript type safety (no `any` types)
- [ ] 12.6 Add JSDoc comments to new public functions

## 13. Manual Verification

- [ ] 13.1 Create fresh test database: `rm test.db && bun run migrate`
- [ ] 13.2 Create test user: `bun run create-user --username testuser`
- [ ] 13.3 Import GitHub JSON export: `bun run import:json --user testuser --file ./data/issues.json`
- [ ] 13.4 Verify items have historical `created_at` dates (not today's date)
- [ ] 13.5 Check database directly: `sqlite3 test.db "SELECT question, created_at FROM items LIMIT 10"`
- [ ] 13.6 Test reimport: `bun run import:json --user testuser --file ./data/issues.json --force-reimport`
- [ ] 13.7 Confirm at prompt, verify data replaced with correct timestamps

## 14. Final Review and Validation

- [ ] 14.1 Review proposal.md - verify all "What Changes" items implemented
- [ ] 14.2 Review design.md - verify all 6 decisions implemented correctly
- [ ] 14.3 Review specs - verify all MODIFIED and ADDED requirements have corresponding tests
- [ ] 14.4 Check for any TODOs or FIXMEs in modified code
- [ ] 14.5 Verify backward compatibility: existing `bun run import:json` commands still work
- [ ] 14.6 Confirm no breaking changes to existing functionality
