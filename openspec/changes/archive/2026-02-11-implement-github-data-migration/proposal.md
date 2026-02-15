## Why

The HowCanI application needs to migrate existing FAQ data from the GitHub Issues-based version 2 (`janbaer/howcani-data` repository) to the new self-hosted version 3 with SQLite storage. A two-step export/import process enables repeatable migrations across dev/test/prod environments, eliminates GitHub API rate limits during testing, and creates a version-controlled portable data format.

## What Changes

- **Export Tool**: CLI command to fetch GitHub Issues and save to JSON file (`bun run export:github`)
- **Import Tool**: CLI command to load JSON file into database, repeatable and idempotent (`bun run import:json`)
- **JSON Format**: Portable data format with version tracking, metadata, and issue structure
- **GitHub Client**: API integration with pagination, rate limit handling, and optional authentication
- **Issue Mapper**: Transform GitHub issues to FAQ items, labels to tags
- **Transaction Safety**: Atomic imports with rollback support
- **CLI Scripts**: Add `export:github` and `import:json` to package.json
- **Progress Reporting**: Real-time progress and detailed summaries for both operations
- **Testing**: Comprehensive test coverage for export, import, mapping, and validation

## Capabilities

### New Capabilities

None - this change implements an existing specification.

### Modified Capabilities

- `data-migration`: Updated from one-time direct GitHub-to-database migration to a two-step process (GitHub → JSON → Database) with repeatable imports, JSON format specification, and separate export/import commands

## Impact

**New Files**:
- `src/tools/export-github.ts` - Export CLI entry point
- `src/tools/import-json.ts` - Import CLI entry point
- `src/tools/github-client.ts` - GitHub API integration
- `src/tools/json-format.ts` - JSON schema and validation
- `src/tools/issue-mapper.ts` - Issue-to-Item transformation
- `src/tools/import-runner.ts` - Import orchestration and transaction management
- Test files for all modules

**Modified Files**:
- `package.json` - Add `export:github` and `import:json` scripts

**Dependencies**:
- No new dependencies (uses native fetch, Bun APIs)

**Systems Affected**:
- Database (item creation, tag creation, transaction handling)
- File system (JSON file read/write)
- External API (GitHub API for export only)
