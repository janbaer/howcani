# Data Migration Specification

## Purpose

The data migration feature provides a two-step process to migrate existing FAQ data from GitHub Issues (`janbaer/howcani-data` repository) into local SQLite databases:

1. **Export**: Fetch issues from GitHub and save to a portable JSON file (one-time)
2. **Import**: Load JSON file into database (repeatable on dev/test/prod)

This separation enables version-controlled data exports, repeatable imports across environments, and eliminates GitHub API rate limits for testing and development.

## Requirements

### Requirement: Export GitHub Issues to JSON

The system MUST fetch issues from GitHub and save them to a JSON file.

#### Scenario: Export all issues to JSON file

**Given** GitHub repository `janbaer/howcani-data` exists

**When** running `bun run export:github --output ./data/issues.json`

**Then** the system should:
- Query GitHub API: `GET /repos/janbaer/howcani-data/issues`
- Fetch all issues (including closed)
- Handle pagination (GitHub returns 30 issues per page)
- Include issue labels with colors
- Save to JSON file at specified path
- Create parent directories if needed
- Not require authentication (public repo)

#### Scenario: Handle GitHub API rate limits during export

**Given** export fetches many issues

**When** approaching GitHub rate limit

**Then** the system should:
- Detect rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- Wait if rate limited
- Show progress: "Rate limited, waiting 60s..."
- Resume when limit resets
- Complete eventually without failing

#### Scenario: Export shows progress

**Given** exporting 100 issues

**When** fetching from GitHub

**Then** the system should show:
```
Exporting issues from janbaer/howcani-data...
Fetched page 1/4 (30 issues)
Fetched page 2/4 (60 issues)
Fetched page 3/4 (90 issues)
Fetched page 4/4 (100 issues)

Export complete!
Saved 100 issues to ./data/issues.json
```

#### Scenario: Export creates valid JSON format

**Given** export completes successfully

**When** JSON file is written

**Then** the file should contain:
```json
{
  "version": "1.0",
  "exported_at": "2026-02-10T19:30:00Z",
  "repository": "janbaer/howcani-data",
  "total_issues": 100,
  "issues": [
    {
      "number": 42,
      "title": "How do I deploy with Bun?",
      "body": "Step-by-step guide...",
      "labels": [
        { "name": "bun", "color": "0e8a16" },
        { "name": "deployment", "color": "ff5722" }
      ],
      "created_at": "2024-01-15T10:30:00Z",
      "state": "open"
    }
  ]
}
```

### Requirement: Import from JSON File (Repeatable)

The system MUST import items from a JSON file into the database.

#### Scenario: Import JSON file to user's items

**Given** JSON file exists at `./data/issues.json`

**And** user "john" exists in database

**When** running `bun run import:json --user john --file ./data/issues.json`

**Then** the system should:
- Read and parse JSON file
- Validate JSON structure
- Transform issues to items
- Import items for user "john"
- Create/reuse tags
- Show progress
- Report summary

#### Scenario: Import is repeatable (idempotent)

**Given** import has run once

**When** running import again with same JSON file

**Then** the system should:
- Check for existing items by title (case-insensitive)
- Skip duplicates
- Import only new issues
- Log: "Skipped 95 existing items, imported 5 new items"
- Update existing items if `--force` flag provided

#### Scenario: Import handles different databases

**Given** JSON file with 100 issues

**When** importing to multiple databases:
- `bun run import:json --user john --file ./data/issues.json` (dev)
- `DATABASE_URL=./prod.db bun run import:json --user john --file ./data/issues.json` (prod)

**Then** each database should:
- Import items independently
- Maintain separate data
- Use same source JSON file
- Not affect other databases

#### Scenario: Import validates JSON format

**Given** JSON file with invalid structure

**When** attempting import

**Then** the system should:
- Validate required fields (version, issues array)
- Check issue structure (number, title, labels)
- Reject invalid JSON with clear error
- Not write to database if validation fails
- Show which field failed validation

### Requirement: Issue to Item Transformation

The system MUST transform GitHub issues into FAQ items during import.

#### Scenario: Map issue title to question

**Given** JSON issue with title "How do I deploy with Bun?"

**When** converting to item

**Then** the system should:
- Use title as-is for item question
- Trim whitespace
- Preserve original capitalization

#### Scenario: Map issue body to answer

**Given** JSON issue with markdown body

**When** converting to item

**Then** the system should:
- Use body as-is for item answer
- Preserve markdown formatting
- Handle empty/null bodies (set answer to "")
- Keep newlines and whitespace

#### Scenario: Map labels to tags

**Given** JSON issue with labels:
- "bun" (color: "0e8a16")
- "deployment" (color: "ff5722")

**When** converting to item

**Then** the system should:
- Create tag "bun" with color "0e8a16"
- Create tag "deployment" with color "ff5722"
- Associate both tags with item
- Reuse tags if already created for this user

#### Scenario: Handle label colors

**Given** JSON label with color "0e8a16" (6-digit hex)

**When** creating tag

**Then** the system should:
- Use label color directly (already in correct format)
- Remove "#" prefix if present
- Validate hex format (6 characters, 0-9a-f)
- Use default color if invalid

#### Scenario: Handle issues without labels

**Given** JSON issue with no labels

**When** converting to item

**Then** the system should:
- Create item without tags
- Not fail import
- Allow tagging later through UI

### Requirement: Preserve Issue Numbers (Best Effort)

The system SHALL attempt to preserve GitHub issue numbers as item IDs for URL continuity.

#### Scenario: Map issue number to item ID

**Given** JSON issue #42

**When** importing to empty database

**Then** the system should:
- Attempt to insert item with id=42
- Preserve URL mapping: `/john/items/42`
- Enable old links to work

#### Scenario: Handle ID conflicts

**Given** item with id=42 already exists in database

**When** importing JSON issue #42

**Then** the system should:
- Detect ID conflict
- Assign next available ID (e.g., 123)
- Log mapping: "Issue #42 -> Item #123 (ID conflict)"
- Store mapping in import report
- Continue with import

### Requirement: Import Transaction Safety

The import MUST be atomic and safe.

#### Scenario: All-or-nothing import

**Given** importing JSON with 100 issues

**When** error occurs on issue #50

**Then** the system should:
- Rollback entire transaction
- Leave database in original state
- Report error clearly
- Allow retry after fixing issue

#### Scenario: Dry-run mode

**Given** running import with `--dry-run` flag

**When** processing JSON file

**Then** the system should:
- Read and validate JSON
- Show what would be imported
- Log: "Would create 95 items, skip 5 duplicates"
- Not write to database
- Exit successfully

### Requirement: Progress and Error Reporting

The system MUST provide detailed progress and results.

#### Scenario: Show import progress

**Given** importing JSON with 100 issues

**When** import is running

**Then** the system should show:
```
Reading ./data/issues.json...
Validated 100 issues in JSON file

Importing to user: john
Checking for duplicates...

Importing: 1/95 (skipped: 5)
Importing: 25/95 (skipped: 5)
Importing: 50/95 (skipped: 5)
Importing: 75/95 (skipped: 5)
Importing: 95/95 (skipped: 5)

Import Complete!
```

#### Scenario: Generate import summary

**Given** import completes

**When** all issues processed

**Then** the system should output:
```
Import Complete!

Statistics:
- Total issues in JSON: 100
- Items imported: 95
- Items skipped (duplicates): 5
- Tags created: 15
- Tags reused: 10
- Errors: 0

ID Mappings:
- Issue #1 -> Item #1
- Issue #2 -> Item #2
- ...
- Issue #100 -> Item #123 (ID conflict)

Time: 2.5 seconds
```

#### Scenario: Log import errors

**Given** some issues fail to import

**When** import completes

**Then** the system should:
- Continue with other issues (if not in transaction)
- Log each error with issue number
- Save error log to file
- Report total errors in summary
- Exit with error code if any failures

### Requirement: GitHub API Authentication (Export Only)

For private repos or higher rate limits, export SHALL support authentication.

#### Scenario: Use GitHub token for export

**Given** environment variable `GITHUB_TOKEN` is set

**When** running export

**Then** the system should:
- Include token in API requests: `Authorization: Bearer ${token}`
- Get higher rate limit (5000 vs 60 requests/hour)
- Access private repos if needed
- Fall back to unauthenticated if token invalid

## CLI Command Structure

### Export Commands

```bash
# Basic export (public repo)
bun run export:github --output ./data/issues.json

# With GitHub token (private repo or higher rate limit)
GITHUB_TOKEN=ghp_xxx bun run export:github --output ./data/issues.json

# Specific repository (default: janbaer/howcani-data)
bun run export:github --repo owner/repo --output ./data/issues.json

# Export with progress
bun run export:github --output ./data/issues.json --verbose
```

### Import Commands

```bash
# Basic import
bun run import:json --user john --file ./data/issues.json

# Dry run (no database changes)
bun run import:json --user john --file ./data/issues.json --dry-run

# Force update existing items
bun run import:json --user john --file ./data/issues.json --force

# Import to specific database
DATABASE_URL=./prod.db bun run import:json --user john --file ./data/issues.json

# Import with verbose output
bun run import:json --user john --file ./data/issues.json --verbose
```

## Implementation Structure

```
src/tools/export-github.ts
  - CLI entry point for export
  - Argument parsing
  - Orchestrate export flow
  - Write JSON file

src/tools/import-json.ts
  - CLI entry point for import
  - Argument parsing
  - Orchestrate import flow
  - Read JSON file

src/tools/github-client.ts
  - GitHub API integration
  - Issue fetching with pagination
  - Rate limit handling
  - Authentication support

src/tools/github-client.spec.ts
  - Test GitHub API interactions
  - Mock API responses
  - Test pagination
  - Test rate limiting

src/tools/json-format.ts
  - JSON schema definition
  - JSON validation
  - Type definitions

src/tools/json-format.spec.ts
  - Test JSON validation
  - Test schema compliance

src/tools/issue-mapper.ts
  - Issue to Item transformation
  - Label to Tag mapping
  - Data validation

src/tools/issue-mapper.spec.ts
  - Test data transformation logic
  - Test edge cases

src/tools/import-runner.ts
  - Orchestrate import
  - Transaction management
  - Duplicate detection
  - Error handling
  - Reporting

src/tools/import-runner.spec.ts
  - Test import flow
  - Test rollback scenarios
  - Test idempotency
```

## JSON Format Specification

```typescript
interface ExportData {
  version: string;              // Format version (e.g., "1.0")
  exported_at: string;          // ISO timestamp
  repository: string;           // "owner/repo"
  total_issues: number;         // Count
  issues: Issue[];
}

interface Issue {
  number: number;
  title: string;
  body: string | null;
  labels: Label[];
  created_at: string;           // ISO timestamp
  state: 'open' | 'closed';
}

interface Label {
  name: string;
  color: string;                // 6-digit hex (no # prefix)
}
```

## Testing Requirements

### Export Tests
- Test GitHub API pagination
- Test rate limit handling
- Test JSON file creation
- Test authentication with token
- Mock GitHub API responses

### Import Tests
- Test JSON validation
- Test issue-to-item mapping
- Test duplicate detection
- Test ID conflict handling
- Test transaction rollback
- Test dry-run mode
- Test force update
- Use in-memory SQLite for tests

### Integration Tests
- Export from GitHub → Import to database (full flow)
- Import same JSON to multiple databases
- Repeated imports (idempotency)

## Implementation Notes

### GitHub API

```typescript
// Fetch issues with pagination
const response = await fetch(
  'https://api.github.com/repos/janbaer/howcani-data/issues?state=all&per_page=100',
  {
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': token ? `Bearer ${token}` : undefined,
    },
  }
);

// Rate limit headers
const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');
```

### JSON File Writing

```typescript
const exportData: ExportData = {
  version: '1.0',
  exported_at: new Date().toISOString(),
  repository: 'janbaer/howcani-data',
  total_issues: issues.length,
  issues: issues,
};

await Bun.write(outputPath, JSON.stringify(exportData, null, 2));
```

### JSON File Reading

```typescript
const file = Bun.file(filePath);
const data = await file.json();

// Validate schema
if (!data.version || !Array.isArray(data.issues)) {
  throw new Error('Invalid JSON format');
}
```

### Duplicate Detection

```typescript
// Check by normalized title
const normalized = question.toLowerCase().trim();
const existing = await repository.findByQuestion(userId, normalized);

if (existing && !force) {
  console.log(`Skipping duplicate: "${question}"`);
  continue;
}
```

### Progress Tracking

```typescript
for (let i = 0; i < issues.length; i++) {
  const issue = issues[i];
  // Process issue
  console.log(`Importing: ${i + 1}/${issues.length}`);
}
```

## Benefits of Two-Step Approach

1. **Version Control**: JSON file can be committed to repository
2. **Repeatability**: Import same data to dev/test/prod databases
3. **No API Limits**: Import doesn't hit GitHub rate limits
4. **Faster Development**: Test imports without fetching from GitHub
5. **Portability**: JSON file is a portable data format
6. **Backup**: JSON serves as data backup
7. **Offline**: Import works without internet connection
8. **Auditable**: Can review exported data before importing

## Cross-Reference

- **Related**: [user-management/spec.md] for user validation
- **Related**: [item-management/spec.md] for item creation
- **Related**: [tag-management/spec.md] for tag auto-creation
