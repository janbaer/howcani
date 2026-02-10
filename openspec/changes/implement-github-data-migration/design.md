## Context

HowCanI version 2 stores FAQ data as GitHub Issues in the `janbaer/howcani-data` repository. Version 3 is a self-hosted application using SQLite for data storage. We need a migration path to transfer existing data while enabling:

- **Repeatable imports** across dev/test/prod environments
- **Version-controlled data** via JSON export files
- **Offline development** without GitHub API access
- **Testing iterations** without rate limit concerns

The existing codebase has:
- Item and Tag repositories with create/update/delete methods
- Tag auto-creation via `TagService.resolveOrCreateTags()`
- Transaction support via SQLite
- Bun test framework for CLI tools

## Goals / Non-Goals

**Goals:**
- Export GitHub Issues to a portable JSON format once
- Import JSON to database repeatedly (idempotent, safe)
- Preserve GitHub issue numbers as item IDs when possible
- Handle pagination, rate limits, and errors gracefully
- Provide clear progress reporting and summaries
- Support dry-run mode for validation
- Enable force-update of existing items

**Non-Goals:**
- Real-time sync between GitHub and database
- Bidirectional migration (database → GitHub)
- Incremental updates (export all, import selectively)
- GUI for migration (CLI only)
- Support for GitHub Pull Requests (Issues only)

## Decisions

### Decision 1: Two-Step Process (GitHub → JSON → Database)

**Choice:** Separate export and import into two commands
**Rationale:**
- **Repeatability**: Import same JSON to multiple databases (dev/test/prod)
- **Version Control**: JSON file can be committed to repository
- **Offline**: Import works without internet/GitHub access
- **Testing**: Iterate on imports without hitting API rate limits
- **Portability**: JSON is a universal format

**Alternatives Considered:**
- **Direct GitHub → Database**: Simple but not repeatable, hits rate limits during development
- **Incremental Sync**: Complex, requires state tracking, out of scope for one-time migration

**Implementation:**
- `export-github.ts`: Fetch from GitHub, write JSON
- `import-json.ts`: Read JSON, write to database
- Shared modules: `github-client`, `issue-mapper`, `json-format`

### Decision 2: JSON Format with Versioning

**Choice:** Structured format with version field and metadata
**Format:**
```json
{
  "version": "1.0",
  "exported_at": "ISO timestamp",
  "repository": "owner/repo",
  "total_issues": number,
  "issues": [...]
}
```

**Rationale:**
- **Version field**: Enable format evolution (v1.0, v1.1, v2.0)
- **Metadata**: Track export source and time for auditability
- **Flat structure**: Simple to parse, validate, and debug
- **Human-readable**: 2-space indent, can review before importing

**Alternatives Considered:**
- **SQLite dump**: Database-specific, not portable across different schemas
- **CSV**: Limited structure, can't represent nested labels
- **YAML**: More human-friendly but parsing overhead, less universal than JSON

### Decision 3: Idempotent Imports via Title Matching

**Choice:** Detect duplicates by normalized title (case-insensitive, trimmed)
**Behavior:**
- Skip existing items by default
- Update with `--force` flag
- Log: "Skipped 95 existing items, imported 5 new"

**Rationale:**
- **Safe by default**: Won't create duplicates on repeated imports
- **Fast dev cycle**: Re-run import during testing without cleanup
- **Explicit updates**: `--force` flag makes updates intentional

**Alternatives Considered:**
- **UUID tracking**: Complex, requires mapping table
- **Always create**: Causes duplicates, poor UX
- **Always update**: Dangerous, could overwrite manual edits

**Implementation:**
```typescript
const normalized = question.toLowerCase().trim();
const existing = await repository.findByQuestion(userId, normalized);
if (existing && !force) {
  skippedCount++;
  continue;
}
```

### Decision 4: Transaction Safety with SQLite

**Choice:** Wrap entire import in a single SQLite transaction
**Behavior:**
- Begin transaction before first item
- Rollback on any error
- Commit only after all items succeed
- Database left unchanged on failure

**Rationale:**
- **All-or-nothing**: Partial imports are confusing
- **Clean retry**: Can fix issues and re-run without cleanup
- **Consistency**: Either all items import or none do

**Alternatives Considered:**
- **Per-item commits**: Fast failure recovery but partial state
- **Savepoints**: Complex, unnecessary for initial implementation
- **Best-effort**: Log errors but continue (rejected, too risky)

**Implementation:**
```typescript
const db = getDatabase();
db.run('BEGIN TRANSACTION');
try {
  for (const issue of issues) {
    // import logic
  }
  db.run('COMMIT');
} catch (error) {
  db.run('ROLLBACK');
  throw error;
}
```

### Decision 5: CLI Argument Parsing with Bun

**Choice:** Use Bun's built-in argument parser
**Format:**
```bash
bun run export:github --output ./data/issues.json --repo owner/repo
bun run import:json --user john --file ./data/issues.json --dry-run --force
```

**Rationale:**
- **No dependencies**: Bun provides argv parsing
- **Simple validation**: Check required args, fail early
- **Standard flags**: `--dry-run`, `--force`, `--verbose`

**Alternatives Considered:**
- **Commander.js**: Extra dependency, overkill for simple CLI
- **Minimist**: Lightweight but still a dependency
- **Positional args**: Less clear than named flags

**Implementation:**
```typescript
const args = Bun.argv.slice(2); // Remove 'bun' and script name
const flags = parseFlags(args);
if (!flags.user) throw new Error('--user required');
```

### Decision 6: Progress Reporting via Console

**Choice:** Real-time console output with counters
**Format:**
```
Exporting issues from janbaer/howcani-data...
Fetched page 1/4 (30 issues)
Fetched page 2/4 (60 issues)
...
Export complete! Saved 100 issues to ./data/issues.json
```

**Rationale:**
- **User feedback**: Shows the tool is working, not hung
- **Troubleshooting**: Can see which page/item failed
- **Transparency**: Total count, duplicates, errors all visible

**Alternatives Considered:**
- **Silent**: Fast but poor UX, looks broken
- **Verbose logging**: Too noisy, harder to read
- **Spinner**: Hides progress, less informative

### Decision 7: Best-Effort ID Preservation

**Choice:** Attempt to use GitHub issue number as item ID
**Fallback:** Assign next auto-increment ID on conflict
**Logging:** "Issue #42 → Item #123 (ID conflict)"

**Rationale:**
- **URL continuity**: Old links might work if IDs match
- **Not critical**: New app, breaking URLs is acceptable
- **Simple**: Single INSERT attempt, catch conflict

**Alternatives Considered:**
- **Always preserve**: Requires pre-filling ID gaps, complex
- **Ignore numbers**: Simpler but breaks all old URLs
- **Mapping table**: Track old→new IDs, out of scope

### Decision 8: GitHub Authentication Optional

**Choice:** Support `GITHUB_TOKEN` env var but don't require it
**Rationale:**
- **Public repo**: No auth needed for `janbaer/howcani-data`
- **Rate limits**: Token increases limit (60 → 5000/hour)
- **Private repos**: Token enables access if needed later

**Implementation:**
```typescript
const token = process.env.GITHUB_TOKEN;
const headers = {
  'Accept': 'application/vnd.github+json',
  ...(token && { 'Authorization': `Bearer ${token}` }),
};
```

## Risks / Trade-offs

### Risk: GitHub API Rate Limits During Export

**Risk:** Export fails mid-way due to rate limit
**Likelihood:** Medium (public repo: 60 requests/hour, need ~4 pages for 100 issues)
**Impact:** Export incomplete, must wait for rate limit reset
**Mitigation:**
- Detect rate limit headers (`X-RateLimit-Remaining`)
- Auto-wait if rate limited, resume when reset
- Support `GITHUB_TOKEN` for higher limits (5000/hour)
- Cache exported JSON, don't re-export unnecessarily

### Risk: Large JSON Files (>1000 Issues)

**Risk:** JSON file becomes unwieldy (memory, file size)
**Likelihood:** Low (repo has ~100 issues currently)
**Impact:** Slow parsing, high memory usage
**Mitigation:**
- Acceptable for initial implementation (100-200 issues)
- Future: Streaming JSON parser if needed
- Future: Paginated import (batch processing)
- Monitor: Log file size after export

### Risk: ID Conflicts During Import

**Risk:** Issue #42 exists, but item #42 already in database
**Likelihood:** High (on repeated imports or existing data)
**Impact:** Issue gets different ID, URL mapping breaks
**Mitigation:**
- Detect INSERT failure (UNIQUE constraint)
- Assign next available ID
- Log mapping: "Issue #42 → Item #123"
- Save mapping to summary report
- Acceptable: New app, URL continuity nice-to-have

### Risk: JSON Schema Evolution

**Risk:** Export format changes, old JSON files incompatible
**Likelihood:** Medium (future enhancements)
**Impact:** Need to re-export or convert old files
**Mitigation:**
- Version field in JSON (`"version": "1.0"`)
- Validate version on import
- Error if unsupported version: "Expected v1.0, got v2.0"
- Future: Version-specific importers or converters

### Risk: Transaction Rollback on Error

**Trade-off:** All-or-nothing vs. best-effort import
**Chosen:** All-or-nothing (transaction rollback)
**Benefits:** Clean state, easy retry
**Drawbacks:** One bad issue blocks entire import
**Mitigation:**
- Validate JSON structure before transaction
- Clear error messages with issue number
- Dry-run mode to catch issues early

### Risk: Tag Name Collisions

**Risk:** Different GitHub labels with same normalized name
**Example:** "API" and "api" both normalize to "api"
**Likelihood:** Low (repo uses lowercase consistently)
**Impact:** Tags merged unexpectedly
**Mitigation:**
- Acceptable: Tag auto-creation already handles this
- Database enforces unique(user_id, name COLLATE NOCASE)
- Users can rename/split tags after import

## Migration Plan

Not applicable - this is a development tool, not a production migration. Deployment steps:

1. **Development:**
   - Implement export/import tools
   - Test with janbaer/howcani-data
   - Export JSON to `./data/github-issues.json`
   - Commit JSON to version control

2. **Testing:**
   - Import to dev database
   - Import to test database
   - Verify duplicate detection (run twice)
   - Test dry-run mode

3. **Production:**
   - Import JSON to production database
   - Verify items and tags created
   - No rollback needed (additive operation)

## Open Questions

None - design is complete and ready for implementation.
