# Data Migration Specification

## Purpose

The data migration feature imports existing FAQ data from GitHub Issues (`janbaer/howcani-data` repository) into the local SQLite database. This is a one-time migration to transition from the GitHub-based version 2 to the self-hosted version 3.

## Requirements

### Requirement: GitHub Issues API Client

The system MUST fetch issues from the GitHub repository.

#### Scenario: Fetch all issues from repository

**Given** GitHub repository `janbaer/howcani-data` exists

**When** running migration command

**Then** the system should:
- Query GitHub API: `GET /repos/janbaer/howcani-data/issues`
- Fetch all issues (including closed)
- Handle pagination (GitHub returns 30 issues per page)
- Include issue labels
- Not require authentication (public repo)

#### Scenario: Handle GitHub API rate limits

**Given** migration fetches many issues

**When** approaching GitHub rate limit

**Then** the system should:
- Detect rate limit headers
- Wait if rate limited
- Show progress messages
- Resume when limit resets
- Complete eventually without failing

#### Scenario: Fetch issue details

**Given** an issue exists with number 42

**When** fetching issue data

**Then** the system should extract:
- Issue number: 42
- Title: Issue title
- Body: Issue body (markdown)
- Labels: Array of label objects with name and color
- Created date: ISO timestamp
- State: open/closed

### Requirement: Issue to Item Mapping

The system MUST transform GitHub issues into FAQ items.

#### Scenario: Map issue title to question

**Given** GitHub issue with title "How do I deploy with Bun?"

**When** converting to item

**Then** the system should:
- Use title as-is for item question
- Trim whitespace
- Preserve original capitalization

#### Scenario: Map issue body to answer

**Given** GitHub issue with markdown body

**When** converting to item

**Then** the system should:
- Use body as-is for item answer
- Preserve markdown formatting
- Handle empty bodies (set answer to "")
- Keep newlines and whitespace

#### Scenario: Map labels to tags

**Given** GitHub issue with labels:
- "bun" (color: "0e8a16")
- "deployment" (color: "ff5722")

**When** converting to item

**Then** the system should:
- Create tag "bun" with color "0e8a16"
- Create tag "deployment" with color "ff5722"
- Associate both tags with item
- Reuse tags if already created

#### Scenario: Handle label colors

**Given** GitHub label with color "0e8a16" (6-digit hex)

**When** creating tag

**Then** the system should:
- Use label color directly (already in correct format)
- Remove "#" prefix if present
- Validate hex format
- Use default color if invalid

#### Scenario: Handle issues without labels

**Given** GitHub issue with no labels

**When** converting to item

**Then** the system should:
- Create item without tags
- Not fail migration
- Allow tagging later through UI

### Requirement: Preserve Issue Numbers

The system SHALL attempt to preserve GitHub issue numbers as item IDs for URL continuity.

#### Scenario: Map issue number to item ID

**Given** GitHub issue #42

**When** importing

**Then** the system should:
- Attempt to insert item with id=42
- Preserve URL mapping: `/john/items/42`
- Enable old links to work (if possible)

#### Scenario: Handle ID conflicts

**Given** item with id=42 already exists

**When** importing issue #42

**Then** the system should:
- Skip or assign new ID
- Log mapping: "Issue #42 -> Item #123"
- Store mapping for reference
- Document ID changes

### Requirement: Migration CLI Command

The system MUST provide a CLI command to run migration.

#### Scenario: Run migration command

**Given** HowCanI application is set up

**When** running `bun run migrate:github`

**Then** the system should:
- Start migration process
- Show progress: "Fetching issues from GitHub..."
- Show progress: "Imported 42/100 issues"
- Complete with summary
- Report any errors

#### Scenario: Migration requires target username

**Given** migration command is run

**When** no username specified

**Then** the system should:
- Prompt for username: "Import to which user?"
- Validate user exists in database
- Error if user doesn't exist: "Create user first"

#### Scenario: Migration is idempotent

**Given** migration has been run once

**When** running migration again

**Then** the system should:
- Check for existing items by title
- Skip duplicates
- Import only new issues
- Log: "Skipped 42 existing items"
- Update existing items if --force flag provided

### Requirement: Migration Transaction Safety

The migration MUST be atomic and safe.

#### Scenario: All-or-nothing import

**Given** migration starts importing 100 issues

**When** error occurs on issue #50

**Then** the system should:
- Rollback entire transaction
- Leave database in original state
- Report error clearly
- Allow retry after fixing issue

#### Scenario: Dry-run mode

**Given** running migration with --dry-run flag

**When** processing issues

**Then** the system should:
- Fetch and parse all issues
- Validate data
- Show what would be imported
- Not write to database
- Exit successfully

### Requirement: Migration Report

The system MUST provide detailed migration results.

#### Scenario: Generate migration summary

**Given** migration completes

**When** all issues processed

**Then** the system should output:
```
Migration Complete!

Statistics:
- Total issues fetched: 100
- Items imported: 95
- Items skipped (duplicates): 5
- Tags created: 25
- Errors: 0

ID Mappings:
- Issue #42 -> Item #42
- Issue #100 -> Item #101 (conflict)

Time: 30 seconds
```

#### Scenario: Log migration errors

**Given** some issues fail to import

**When** migration completes

**Then** the system should:
- Continue with other issues
- Log each error
- Include issue number and error message
- Save error log to file
- Report total errors in summary

### Requirement: GitHub API Authentication (Optional)

For private repos or higher rate limits, the system SHALL support authentication.

#### Scenario: Use GitHub token for migration

**Given** environment variable `GITHUB_TOKEN` is set

**When** running migration

**Then** the system should:
- Include token in API requests
- Get higher rate limit (5000 vs 60 requests/hour)
- Access private repos if needed
- Fall back to unauthenticated if token invalid

## CLI Command Structure

```bash
# Basic migration
bun run migrate:github --user john

# Dry run (no database changes)
bun run migrate:github --user john --dry-run

# Force update existing items
bun run migrate:github --user john --force

# With GitHub token (optional)
GITHUB_TOKEN=ghp_xxx bun run migrate:github --user john

# Specific repository (default: janbaer/howcani-data)
bun run migrate:github --user john --repo owner/repo
```

## Implementation Structure

```
src/tools/migrate-from-github.ts
  - CLI entry point
  - Argument parsing
  - Progress reporting

src/tools/github-client.ts
  - GitHub API integration
  - Issue fetching with pagination
  - Rate limit handling

src/tools/github-client.spec.ts
  - Test GitHub API interactions
  - Mock API responses

src/tools/migration-mapper.ts
  - Issue to Item transformation
  - Label to Tag mapping
  - Data validation

src/tools/migration-mapper.spec.ts
  - Test data transformation logic

src/tools/migration-runner.ts
  - Orchestrate migration
  - Transaction management
  - Error handling
  - Reporting

src/tools/migration-runner.spec.ts
  - Test migration flow
  - Test rollback scenarios
```

## Testing Requirements

- Test-first for mapper and runner logic
- Mock GitHub API responses
- Test pagination handling
- Test error scenarios
- Test idempotency (run twice)
- Test dry-run mode
- Test transaction rollback
- Use in-memory SQLite for tests

## Implementation Notes

### GitHub API

```typescript
// Fetch issues
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

### Issue Data Structure

```typescript
interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  labels: Array<{
    name: string;
    color: string;
  }>;
  created_at: string;
  state: 'open' | 'closed';
}
```

### Progress Tracking

```typescript
for (let i = 0; i < issues.length; i++) {
  const issue = issues[i];
  // Process issue
  console.log(`Importing ${i + 1}/${issues.length}: #${issue.number}`);
}
```

### Dry Run Implementation

```typescript
if (dryRun) {
  console.log('[DRY RUN] Would create item:', item);
  // Don't call repository.create()
} else {
  await repository.create(item);
}
```

## Cross-Reference

- **Related**: [user-management/spec.md] for user validation
- **Related**: [item-management/spec.md] for item creation
- **Related**: [tag-management/spec.md] for tag auto-creation
