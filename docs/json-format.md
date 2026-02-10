# JSON Export Format Specification

## Overview

The HowCanI data migration system uses a portable JSON format for exporting GitHub Issues and importing them into the SQLite database. This format is designed to be:

- **Version-controlled**: Can be committed to repositories
- **Human-readable**: 2-space indentation, clear structure
- **Portable**: Works across different databases and environments
- **Evolvable**: Version field enables format changes over time

## Format Version 1.0

### Root Structure

```typescript
interface ExportData {
  version: string;              // Format version (e.g., "1.0")
  exported_at: string;          // ISO 8601 timestamp
  repository: string;           // GitHub repository (owner/repo)
  total_issues: number;         // Total count of issues
  issues: Issue[];              // Array of issue objects
}
```

### Issue Structure

```typescript
interface Issue {
  number: number;               // GitHub issue number
  title: string;                // Issue title (becomes question)
  body: string | null;          // Issue body (becomes answer, null allowed)
  labels: Label[];              // Array of label objects
  created_at: string;           // ISO 8601 timestamp
  state: 'open' | 'closed';     // Issue state
}
```

### Label Structure

```typescript
interface Label {
  name: string;                 // Label name (becomes tag name)
  color: string;                // 6-digit hex color (no # prefix)
}
```

## Example

```json
{
  "version": "1.0",
  "exported_at": "2026-02-10T20:00:00Z",
  "repository": "janbaer/howcani-data",
  "total_issues": 2,
  "issues": [
    {
      "number": 1,
      "title": "How do I deploy with Bun?",
      "body": "# Deployment Guide\\n\\n1. Install Bun\\n2. Run `bun install`\\n3. Run `bun run build`",
      "labels": [
        { "name": "bun", "color": "0e8a16" },
        { "name": "deployment", "color": "ff5722" }
      ],
      "created_at": "2024-01-15T10:30:00Z",
      "state": "open"
    },
    {
      "number": 2,
      "title": "How do I use Svelte 5?",
      "body": null,
      "labels": [],
      "created_at": "2024-01-16T11:00:00Z",
      "state": "closed"
    }
  ]
}
```

## Validation Rules

### Required Fields

All fields are required except:
- `body` (can be `null` or empty string)
- `labels` array can be empty `[]`

### Field Constraints

**version:**
- Must be a string
- Must match supported version (currently "1.0")
- Mismatched versions are rejected with clear error message

**exported_at:**
- Must be a valid ISO 8601 timestamp string
- Used for auditing and tracking export source

**repository:**
- Must be in format "owner/repo"
- Used for documentation and traceability

**total_issues:**
- Must be a number
- Should match the length of issues array
- Used for validation and progress reporting

**issues:**
- Must be an array
- Can be empty
- Each element must be a valid Issue object

**Issue.number:**
- Must be a number
- Used for ID preservation (best effort)
- Conflicts are tracked and reported

**Issue.title:**
- Must be a non-empty string
- Becomes the item's question
- Trimmed during import
- Used for duplicate detection (case-insensitive)

**Issue.body:**
- Can be `null` or string
- Becomes the item's answer
- `null` is converted to empty string during import
- Markdown formatting is preserved

**Issue.labels:**
- Must be an array
- Can be empty
- Each element must be a valid Label object

**Label.name:**
- Must be a non-empty string
- Becomes tag name
- Case-insensitive matching during import

**Label.color:**
- Must be a 6-character hex color string
- `#` prefix is removed if present
- Invalid colors use default gray (6b7280)
- Normalized to lowercase during import

**Issue.created_at:**
- Must be a valid ISO 8601 timestamp string
- Preserved for reference but not currently used in import

**Issue.state:**
- Must be either "open" or "closed"
- Preserved for reference but not currently used in import

## Import Behavior

### Title to Question

```typescript
// Whitespace is trimmed
"  How do I use Bun?  " → "How do I use Bun?"

// Case is preserved
"How Do I Use BUN?" → "How Do I Use BUN?"

// Special characters are preserved
"How do I use @tags & #hashtags?" → "How do I use @tags & #hashtags?"
```

### Body to Answer

```typescript
// Markdown is preserved
"# Title\n\n**Bold** and *italic*" → "# Title\n\n**Bold** and *italic*"

// null becomes empty string
null → ""

// Empty strings are preserved
"" → ""
```

### Labels to Tags

```typescript
// Colors are normalized
{ name: "bug", color: "#FF0000" } → { name: "bug", color: "ff0000" }
{ name: "bug", color: "FF0000" } → { name: "bug", color: "ff0000" }

// Invalid colors use default
{ name: "test", color: "invalid" } → { name: "test", color: "6b7280" }
{ name: "test", color: "12345" } → { name: "test", color: "6b7280" }
```

### Duplicate Detection

During import, duplicates are detected by normalizing the question:

```typescript
// These are considered duplicates:
"How do I use Bun?" === "how do i use bun?" === "  HOW DO I USE BUN?  "

// Normalized: "how do i use bun?"
```

## Version Evolution

The `version` field enables format changes over time:

**Current Version: 1.0**
- Initial format with all fields documented above

**Future Versions:**
- Version 1.1 might add optional fields
- Version 2.0 might change structure
- Import tool validates version and rejects unsupported formats

### Adding New Fields (Minor Version)

Compatible changes that don't break existing imports:
- Add optional fields to root object
- Add optional fields to Issue or Label
- Add new metadata fields

Example version 1.1:
```json
{
  "version": "1.1",
  "export_tool": "HowCanI CLI v3.0.0",  // New optional field
  ...
}
```

### Breaking Changes (Major Version)

Changes that require import tool updates:
- Remove required fields
- Change field types
- Rename fields
- Change validation rules

Example version 2.0:
```json
{
  "version": "2.0",
  "issues": [
    {
      "id": 1,           // Renamed from "number"
      "question": "...", // Renamed from "title"
      ...
    }
  ]
}
```

## Error Messages

The import tool provides detailed validation errors:

```
✗ Invalid JSON format:

  - version: Unsupported version: expected 1.0, got 2.0
  - issues[0].title: Missing or invalid title field
  - issues[0].labels[0].color: Label color must be a string
  - issues[2].state: Invalid state field (must be "open" or "closed")
```

## Best Practices

### Exporting

1. **Use --verbose** for large exports to monitor progress
2. **Set GITHUB_TOKEN** to avoid rate limits
3. **Commit JSON to git** for version control and backup
4. **Review JSON** before importing to production

### Importing

1. **Dry run first** to validate without changes
   ```bash
   bun run import:json --user john --file data.json --dry-run
   ```

2. **Check summary** for unexpected results
   - High skip count might indicate duplicate data
   - ID mappings show conflicts

3. **Use force carefully** as it updates existing items
   ```bash
   bun run import:json --user john --file data.json --force
   ```

4. **Import to test first** before production
   ```bash
   bun run import:json --user john --file data.json
   DATABASE_URL=./prod.db bun run import:json --user john --file data.json
   ```

## File Size Considerations

**Current Support:**
- Tested with 100-200 issues (typical size: 50-500 KB)
- Should handle up to 1000 issues efficiently

**For Large Exports (1000+ issues):**
- Consider splitting into multiple files
- Use pagination if implementing custom export
- Monitor memory usage during import

**Compression:**
- JSON is text-based and compresses well
- Consider gzipping for storage: `issues.json.gz`
- Bun can read gzipped files directly if needed
