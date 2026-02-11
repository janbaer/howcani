## MODIFIED Requirements

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

#### Scenario: Map created_at timestamp

**Given** JSON issue with `created_at: "2024-01-15T10:30:00Z"`

**When** converting to item

**Then** the system should:
- Extract `created_at` field from JSON
- Include timestamp in mapped item data
- Preserve ISO 8601 format
- Validate timestamp is a non-empty string
- Fail with clear error if timestamp is missing or invalid format

## ADDED Requirements

### Requirement: Preserve Original Timestamps During Import

The system MUST use the original `created_at` timestamps from JSON when creating items in the database.

#### Scenario: Import item with explicit created_at

**Given** mapped item with `created_at: "2024-01-15T10:30:00Z"`

**When** inserting item into database

**Then** the system should:
- Use `created_at` value from mapped item data
- NOT generate current timestamp
- Override database `DEFAULT CURRENT_TIMESTAMP` constraint
- Store timestamp in `items.created_at` column
- Set `items.updated_at` to current timestamp (import time)

#### Scenario: Verify imported timestamps

**Given** JSON issue created on 2024-01-15

**When** querying database after import

**Then** the system should:
- Return `items.created_at` as "2024-01-15T10:30:00Z" (original date)
- Return `items.updated_at` as current import timestamp
- Preserve historical accuracy of creation dates
- Enable correct chronological sorting

#### Scenario: Handle invalid timestamp format

**Given** JSON issue with malformed `created_at: "not-a-date"`

**When** attempting to import

**Then** the system should:
- Validate ISO 8601 format during mapping
- Reject with error: "Invalid created_at timestamp format for issue #42"
- Show expected format: "YYYY-MM-DDTHH:MM:SSZ"
- Fail fast before database insertion
- NOT import the item with current timestamp fallback

### Requirement: Pre-Import Data Detection and Confirmation

The system MUST detect existing imported data and prompt user for confirmation before deletion.

#### Scenario: Detect existing data before import

**Given** database contains 50 items for user "john"

**When** running `bun run import:json --user john --file ./data/issues.json --force-reimport`

**Then** the system should:
- Query items table: `SELECT COUNT(*) FROM items WHERE user_id = ?`
- Detect 50 existing items
- Proceed to user confirmation prompt
- NOT proceed with deletion until user confirms

#### Scenario: Prompt user for deletion confirmation

**Given** 50 existing items detected for user "john"

**When** prompting for confirmation

**Then** the system should:
- Display warning: "⚠️  Found 50 existing items in database."
- Explain action: "Re-importing will DELETE all existing data and replace with JSON data."
- Show reason: "This is necessary to fix incorrect created_at timestamps."
- Request explicit confirmation: "Delete existing data and re-import? (yes/no): "
- Wait for user input via stdin
- Accept only exact string "yes" (case-insensitive)
- Reject "y", "Y", or any other input as declined

#### Scenario: User confirms deletion

**Given** user enters "yes" at confirmation prompt

**When** processing confirmation

**Then** the system should:
- Proceed with deletion and re-import
- Delete all user items in transaction
- Import all items from JSON with correct timestamps
- Display progress and summary

#### Scenario: User declines deletion

**Given** user enters "no" at confirmation prompt

**When** processing confirmation

**Then** the system should:
- Abort import process
- NOT delete any data
- NOT import any items
- Exit with message: "Import cancelled. No data was modified."
- Exit with code 0 (user choice, not error)

#### Scenario: No existing data to confirm

**Given** database is empty (0 items for user "john")

**When** running `bun run import:json --user john --file ./data/issues.json --force-reimport`

**Then** the system should:
- Skip confirmation prompt (nothing to delete)
- Proceed directly to import
- Import all items with correct timestamps
- Display progress and summary

#### Scenario: Non-interactive mode with --yes flag

**Given** database contains 50 existing items

**When** running `bun run import:json --user john --file ./data/issues.json --force-reimport --yes`

**Then** the system should:
- Skip interactive confirmation prompt
- Auto-confirm deletion (non-interactive mode)
- Proceed with deletion and re-import
- Useful for automated scripts and CI/CD pipelines

### Requirement: Force Re-Import with Data Deletion

The system MUST support complete data replacement via `--force-reimport` flag.

#### Scenario: Delete and re-import with --force-reimport

**Given** database contains 50 items for user "john"

**And** JSON file contains 100 issues

**When** running `bun run import:json --user john --file ./data/issues.json --force-reimport` and confirming deletion

**Then** the system should:
- Delete all 50 existing items for user "john"
- Cascade delete to `item_tags` (foreign key constraint)
- Delete orphaned tags (no longer referenced by any items)
- Import all 100 issues from JSON
- Use correct `created_at` timestamps from JSON
- Complete operation in single transaction (atomic)

#### Scenario: Transaction atomicity on re-import failure

**Given** re-import operation in progress

**When** error occurs during import (e.g., invalid data on issue #50)

**Then** the system should:
- Rollback entire transaction
- Restore all 50 original items
- NOT leave database in partial state (some deleted, some imported)
- Report error with issue number that caused failure
- Exit with non-zero code
- Allow user to fix JSON and retry

#### Scenario: Orphaned tag cleanup during re-import

**Given** user "john" has items with tags: ["bun", "deployment", "testing"]

**And** tag "testing" is only used by user "john"'s items

**When** re-importing without "testing" tag in JSON

**Then** the system should:
- Delete all items (including those with "testing" tag)
- Identify "testing" tag as orphaned (no items reference it)
- Delete "testing" tag from tags table
- Preserve "bun" and "deployment" tags if used by new items
- Clean up orphaned user-specific tags automatically

#### Scenario: Preserve tags shared across users

**Given** tag "bun" is used by both user "john" and user "alice"

**When** re-importing for user "john" without "bun" tag

**Then** the system should:
- Delete user "john"'s items
- NOT delete "bun" tag (still used by user "alice")
- Orphan detection scoped to user's tags only
- Preserve shared tag data integrity

#### Scenario: Regular import without --force-reimport

**Given** database contains 50 items for user "john"

**When** running `bun run import:json --user john --file ./data/issues.json` (no --force-reimport)

**Then** the system should:
- NOT prompt for deletion
- NOT delete any existing items
- Use normal idempotent import behavior
- Skip duplicates, import only new items
- Preserve existing items not in JSON file

#### Scenario: Distinguish --force from --force-reimport

**Given** database contains item with question "How to deploy?"

**And** JSON contains updated issue with same title but different answer

**When** running `bun run import:json --user john --file ./data/issues.json --force`

**Then** the system should:
- Update existing item's answer (not delete and recreate)
- Preserve existing item's original `created_at` timestamp
- NOT delete items missing from JSON
- Different behavior from `--force-reimport`

**When** running with `--force-reimport` instead

**Then** the system should:
- Delete ALL existing items
- Re-import ALL items from JSON with correct timestamps
- Treat as complete dataset replacement
