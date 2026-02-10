## MODIFIED Requirements

This change updates the data-migration specification from a one-step direct migration (GitHub → Database) to a two-step process (GitHub → JSON → Database) that enables repeatable imports and version-controlled data.

### Requirement: Export GitHub Issues to JSON

The system MUST fetch issues from GitHub and save them to a JSON file.

#### Scenario: Export all issues to JSON file

**WHEN** running `bun run export:github --output ./data/issues.json`

**THEN** the system SHALL:
- Query GitHub API for all issues (including closed)
- Handle pagination automatically
- Include issue labels with colors
- Save to JSON file at specified path
- Create parent directories if needed

#### Scenario: Handle GitHub API rate limits during export

**WHEN** approaching GitHub rate limit

**THEN** the system SHALL:
- Detect rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- Wait if rate limited with progress message
- Resume when limit resets
- Complete eventually without failing

#### Scenario: Export creates valid JSON format

**WHEN** export completes successfully

**THEN** the JSON file SHALL contain:
- Version field for format evolution
- Export metadata (timestamp, repository, total count)
- Array of issues with number, title, body, labels, timestamps, state
- Human-readable formatting (2-space indent)

### Requirement: Import from JSON File (Repeatable)

The system MUST import items from a JSON file into the database with repeatable and idempotent behavior.

#### Scenario: Import JSON file to user's items

**WHEN** running `bun run import:json --user john --file ./data/issues.json`

**THEN** the system SHALL:
- Read and parse JSON file
- Validate JSON structure and version
- Transform issues to items
- Import items for specified user
- Create or reuse tags
- Show progress
- Report summary with statistics

#### Scenario: Import is repeatable (idempotent)

**WHEN** running import multiple times with same JSON file

**THEN** the system SHALL:
- Check for existing items by normalized title (case-insensitive)
- Skip duplicates by default
- Import only new issues
- Log count of skipped vs imported items
- Update existing items only if `--force` flag provided

#### Scenario: Import handles different databases

**WHEN** importing same JSON to multiple databases (dev/test/prod)

**THEN** each database SHALL:
- Import items independently
- Maintain separate data
- Use same source JSON file
- Not affect other databases

#### Scenario: Import validates JSON format

**WHEN** JSON file has invalid structure

**THEN** the system SHALL:
- Validate required fields (version, issues array)
- Check issue structure (number, title, labels)
- Reject invalid JSON with clear error message
- Not write to database if validation fails
- Show which field failed validation

### Requirement: JSON Format Specification

The system SHALL define a standard JSON format with versioning for data portability.

#### Scenario: JSON includes version and metadata

**WHEN** exporting issues to JSON

**THEN** the JSON SHALL include:
- `version` field (e.g., "1.0") for format evolution
- `exported_at` ISO timestamp
- `repository` name (owner/repo)
- `total_issues` count
- `issues` array with complete issue data

#### Scenario: JSON format enables version compatibility

**WHEN** importing JSON with version field

**THEN** the system SHALL:
- Check version compatibility
- Error if version unsupported: "Expected v1.0, got v2.0"
- Enable future format migrations

### Requirement: Import Transaction Safety

The import MUST be atomic and safe with rollback support.

#### Scenario: All-or-nothing import

**WHEN** error occurs during import

**THEN** the system SHALL:
- Rollback entire transaction
- Leave database in original state
- Report error clearly with issue number
- Allow retry after fixing issue

#### Scenario: Dry-run mode

**WHEN** running import with `--dry-run` flag

**THEN** the system SHALL:
- Read and validate JSON
- Show what would be imported
- Log: "Would create N items, skip N duplicates"
- Not write to database
- Exit successfully

## ADDED Requirements

### Requirement: Progress and Error Reporting

The system MUST provide detailed progress and results for both export and import operations.

#### Scenario: Show export progress

**WHEN** exporting issues from GitHub

**THEN** the system SHALL show:
- Repository being exported
- Pagination progress: "Fetched page N/M (X issues)"
- Completion message with total count and file path

#### Scenario: Show import progress

**WHEN** importing JSON file

**THEN** the system SHALL show:
- JSON file validation
- Import progress: "Importing: N/M (skipped: N)"
- Completion summary with statistics

#### Scenario: Generate import summary

**WHEN** import completes

**THEN** the system SHALL output:
- Total issues in JSON
- Items imported vs skipped
- Tags created vs reused
- ID mappings (issue number → item ID)
- Any errors encountered
- Total execution time

### Requirement: GitHub API Authentication (Export Only)

For private repos or higher rate limits, export SHALL support optional authentication.

#### Scenario: Use GitHub token for export

**WHEN** environment variable `GITHUB_TOKEN` is set

**THEN** the export SHALL:
- Include token in API requests: `Authorization: Bearer ${token}`
- Get higher rate limit (5000 vs 60 requests/hour)
- Access private repos if needed
- Fall back to unauthenticated if token invalid
