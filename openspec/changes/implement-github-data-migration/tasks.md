# Implementation Tasks

## 1. JSON Format Module

- [ ] 1.1 Create `src/tools/json-format.ts` with TypeScript interfaces (`ExportData`, `Issue`, `Label`)
- [ ] 1.2 Add version constant (`EXPORT_FORMAT_VERSION = "1.0"`)
- [ ] 1.3 Implement `validateExportData()` function (check version, issues array, required fields)
- [ ] 1.4 Implement `validateIssue()` function (check number, title, labels structure)
- [ ] 1.5 Create `src/tools/json-format.spec.ts` test file
- [ ] 1.6 Test validation with valid JSON structure
- [ ] 1.7 Test validation with missing version field
- [ ] 1.8 Test validation with invalid issues array
- [ ] 1.9 Test validation with malformed issue objects

## 2. GitHub Client Module

- [ ] 2.1 Create `src/tools/github-client.ts` module
- [ ] 2.2 Implement `fetchAllIssues()` function with pagination support
- [ ] 2.3 Add rate limit detection using `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers
- [ ] 2.4 Implement auto-wait when rate limited (calculate wait time from reset header)
- [ ] 2.5 Add optional GitHub token support via `GITHUB_TOKEN` env var
- [ ] 2.6 Add progress callback for pagination: `onProgress(page, totalPages, issueCount)`
- [ ] 2.7 Handle GitHub API errors gracefully (network errors, 404, 403)
- [ ] 2.8 Create `src/tools/github-client.spec.ts` test file
- [ ] 2.9 Mock GitHub API responses for testing
- [ ] 2.10 Test pagination with multiple pages
- [ ] 2.11 Test rate limit detection and waiting
- [ ] 2.12 Test authentication with token vs without
- [ ] 2.13 Test error handling (network failure, invalid repo)

## 3. Issue Mapper Module

- [ ] 3.1 Create `src/tools/issue-mapper.ts` module
- [ ] 3.2 Implement `mapIssueToItem()` function (issue → item transformation)
- [ ] 3.3 Map issue title to question (trim whitespace, preserve case)
- [ ] 3.4 Map issue body to answer (preserve markdown, handle null/empty)
- [ ] 3.5 Implement `mapLabelsToTags()` function (labels → tag names and colors)
- [ ] 3.6 Validate and normalize label colors (remove `#`, validate hex, use default if invalid)
- [ ] 3.7 Create `src/tools/issue-mapper.spec.ts` test file
- [ ] 3.8 Test title mapping (whitespace, special characters, unicode)
- [ ] 3.9 Test body mapping (markdown, null, empty)
- [ ] 3.10 Test label mapping (with colors, without labels, invalid colors)

## 4. Export Tool

- [ ] 4.1 Create `src/tools/export-github.ts` CLI entry point
- [ ] 4.2 Implement command-line argument parsing (--output, --repo, --verbose)
- [ ] 4.3 Validate required arguments (--output path)
- [ ] 4.4 Set default repository to `janbaer/howcani-data`
- [ ] 4.5 Fetch all issues using `github-client.fetchAllIssues()`
- [ ] 4.6 Show progress during fetch: "Fetched page N/M (X issues)"
- [ ] 4.7 Build `ExportData` object with version, metadata, and issues
- [ ] 4.8 Create parent directories for output path if needed (`mkdir -p`)
- [ ] 4.9 Write JSON file with 2-space indentation using `Bun.write()`
- [ ] 4.10 Show completion message: "Export complete! Saved N issues to <path>"
- [ ] 4.11 Handle errors and exit with non-zero code on failure

## 5. Import Runner Module

- [ ] 5.1 Create `src/tools/import-runner.ts` module
- [ ] 5.2 Implement `runImport()` orchestration function
- [ ] 5.3 Accept parameters: userId, issues array, force flag, dryRun flag
- [ ] 5.4 Begin SQLite transaction (`db.run('BEGIN TRANSACTION')`)
- [ ] 5.5 Implement duplicate detection by normalized title (case-insensitive, trimmed)
- [ ] 5.6 Use `TagService.resolveOrCreateTags()` for tag auto-creation
- [ ] 5.7 Attempt to preserve issue numbers as item IDs (best effort)
- [ ] 5.8 Handle ID conflicts gracefully (assign next available ID, log mapping)
- [ ] 5.9 Show progress: "Importing: N/M (skipped: N)"
- [ ] 5.10 Commit transaction on success, rollback on error
- [ ] 5.11 Return summary object with counts (imported, skipped, errors, mappings)
- [ ] 5.12 Implement dry-run mode (validate but don't write to database)
- [ ] 5.13 Create `src/tools/import-runner.spec.ts` test file
- [ ] 5.14 Test import with in-memory SQLite database
- [ ] 5.15 Test duplicate detection (skip vs force update)
- [ ] 5.16 Test ID preservation and conflict handling
- [ ] 5.17 Test transaction rollback on error
- [ ] 5.18 Test dry-run mode (no database changes)
- [ ] 5.19 Test tag auto-creation and reuse

## 6. Import Tool

- [ ] 6.1 Create `src/tools/import-json.ts` CLI entry point
- [ ] 6.2 Implement command-line argument parsing (--user, --file, --dry-run, --force, --verbose)
- [ ] 6.3 Validate required arguments (--user, --file)
- [ ] 6.4 Verify user exists in database (error if not found: "User not found. Create user first.")
- [ ] 6.5 Read JSON file using `Bun.file().json()`
- [ ] 6.6 Validate JSON structure using `json-format.validateExportData()`
- [ ] 6.7 Show validation summary: "Validated N issues in JSON file"
- [ ] 6.8 Transform issues using `issue-mapper.mapIssueToItem()`
- [ ] 6.9 Run import using `import-runner.runImport()`
- [ ] 6.10 Display import summary with statistics (total, imported, skipped, tags, errors, time)
- [ ] 6.11 Show ID mappings if any conflicts occurred
- [ ] 6.12 Exit with non-zero code if any errors occurred
- [ ] 6.13 Handle file not found errors gracefully

## 7. Package.json Scripts

- [ ] 7.1 Add `"export:github": "bun run src/tools/export-github.ts"` to package.json
- [ ] 7.2 Add `"import:json": "bun run src/tools/import-json.ts"` to package.json

## 8. Integration Testing

- [ ] 8.1 Create test data directory `tests/fixtures/` with sample JSON
- [ ] 8.2 Create integration test: export → validate JSON → import → verify database
- [ ] 8.3 Test full flow: export from GitHub (mocked API) → import to database
- [ ] 8.4 Test repeated imports (run import twice, verify idempotency)
- [ ] 8.5 Test import to multiple databases (same JSON, different DB files)
- [ ] 8.6 Test error scenarios (invalid JSON, missing user, network errors)

## 9. Documentation

- [ ] 9.1 Add usage examples to README or tools documentation
- [ ] 9.2 Document CLI flags and their behavior
- [ ] 9.3 Document JSON format specification
- [ ] 9.4 Add migration guide (export once, import repeatedly)

## 10. Verification

- [ ] 10.1 Run `bun test` and ensure all tests pass
- [ ] 10.2 Run linter (`bun lint` or `bunx biome check src/tools/`)
- [ ] 10.3 Test export: `bun run export:github --output ./data/test-export.json`
- [ ] 10.4 Verify exported JSON file structure and content
- [ ] 10.5 Create test user in dev database
- [ ] 10.6 Test import: `bun run import:json --user testuser --file ./data/test-export.json`
- [ ] 10.7 Verify items and tags created in database
- [ ] 10.8 Test import again (verify duplicates skipped)
- [ ] 10.9 Test dry-run mode: `bun run import:json --user testuser --file ./data/test-export.json --dry-run`
- [ ] 10.10 Test force update: `bun run import:json --user testuser --file ./data/test-export.json --force`

## Dependencies

- Tasks in group 1 (JSON Format) can run first
- Task 2 (GitHub Client) depends on 1.1-1.4 (interfaces)
- Task 3 (Issue Mapper) depends on 1.1-1.4 (interfaces)
- Task 4 (Export Tool) depends on groups 1, 2, 3
- Task 5 (Import Runner) depends on groups 1, 3
- Task 6 (Import Tool) depends on groups 1, 5
- Task 7 (Scripts) can run anytime
- Task 8 (Integration) depends on all implementation tasks
- Task 9 (Documentation) can run in parallel with implementation
- Task 10 (Verification) must be last
