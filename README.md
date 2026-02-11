# HowCanI 3

This project contains the source code for my HowCanI project. It's a rewrite of the rewrite of the original version which I developed a few years ago using AngularJS. The second version was developed by myself using Svelte 3 first and later Svelte 5. This version was still hosted on GitHub and used GitHub issues for storing the FAQ items. It was a client-only web application with no backend server. Instead, it was driven by GitHub Pages.

With version 3, I want to change a few things. First of all, I want to have a proper backend server for storing the FAQ items. This will allow me to have more control over the data and also to implement features like user authentication and authorization. I decided against Node.js and instead I want to give Bun a try. Bun is a modern JavaScript runtime like Node.js, but it is built with performance in mind. It also comes with a built-in package manager and a lot of other features that make it easier to develop web applications. The database will be SQLite, because it's supported out of the box by Bun. The webpage will be hosted in the future in my home-lab. Using my Home-Wireguard-VPN, I can reach it from everywhere. More details about this project will be added by Claude soon.

## Migrating Data from Version 2 (GitHub Issues)

HowCanI v3 includes a two-phase migration system to transfer your FAQ data from GitHub Issues (v2) to the SQLite database (v3).

### Why Two-Phase Migration?

- **Repeatable**: Import the same JSON to multiple databases (dev/test/prod)
- **Version Control**: JSON export can be committed to your repository
- **Offline**: Import works without GitHub API access
- **No Rate Limits**: Test imports without hitting API rate limits

### Step 1: Export from GitHub

Export your GitHub Issues to a JSON file (one-time operation):

```bash
# Export from default repository (janbaer/howcani-data)
bun run export:github --output ./data/issues.json

# Export from a different repository
bun run export:github --output ./data/issues.json --repo owner/repo

# With verbose progress
bun run export:github --output ./data/issues.json --verbose

# With GitHub token for higher rate limits (5000/hour vs 60/hour)
GITHUB_TOKEN=ghp_xxxxx bun run export:github --output ./data/issues.json
```

The export creates a portable JSON file with:
- Version tracking for format evolution
- Export metadata (timestamp, repository, count)
- All issues with labels, bodies, and timestamps
- Human-readable 2-space indentation

### Step 2: Import to Database

Import the JSON file to your database (repeatable operation):

```bash
# Create a user first (via API or database)
# Then import for that user

# Dry run first (validate without writing)
bun run import:json --user john --file ./data/issues.json --dry-run

# Actual import
bun run import:json --user john --file ./data/issues.json

# Force update existing items (instead of skipping duplicates)
bun run import:json --user john --file ./data/issues.json --force

# Force re-import (delete ALL existing items and replace with JSON data)
bun run import:json --user john --file ./data/issues.json --force-reimport

# Force re-import non-interactive (auto-confirm deletion)
bun run import:json --user john --file ./data/issues.json --force-reimport --yes

# Import to different database (e.g., production)
DATABASE_URL=./data/prod.db bun run import:json --user john --file ./data/issues.json
```

### Import Features

**Timestamp Preservation:**
- Preserves original GitHub issue creation dates
- Items show historical `created_at` timestamps (not import date)
- Enables correct chronological sorting
- `updated_at` reflects import/update time

**Idempotent (Safe to Re-run):**
- Detects duplicates by normalized title (case-insensitive, trimmed)
- Skips duplicates by default
- Use `--force` to update existing items
- Use `--force-reimport` to delete all and replace with JSON data

**Force Re-Import:**
- `--force-reimport` flag completely replaces existing data
- Prompts for confirmation before deletion (shows item count)
- Use `--yes` flag for non-interactive mode (auto-confirm)
- Fixes incorrect timestamps from previous imports
- Cleans up orphaned tags automatically
- Atomic transaction: rollback on failure

**ID Preservation:**
- Attempts to preserve GitHub issue numbers as item IDs
- Tracks ID conflicts: "Issue #42 → Item #123"
- Maintains URL continuity when possible

**Tag Handling:**
- Creates tags from GitHub labels
- Preserves label colors
- Reuses existing tags (case-insensitive matching)

**Transaction Safety:**
- All-or-nothing import (atomic)
- Automatic rollback on errors
- Database unchanged if import fails

### Example Migration Workflow

```bash
# 1. Export from GitHub (one-time)
bun run export:github --output ./data/howcani-export.json

# 2. Commit JSON to version control (optional)
git add data/howcani-export.json
git commit -m "Add exported FAQ data from GitHub"

# 3. Import to dev database
bun run import:json --user jan --file ./data/howcani-export.json

# 4. Test the import
# Browse the application, verify items and tags

# 5. Import to production (when ready)
DATABASE_URL=./data/prod.db bun run import:json --user jan --file ./data/howcani-export.json
```

### Import Summary

After import, you'll see detailed statistics:
```
✓ Import complete!

Statistics:
  Total issues in JSON: 100
  Items imported: 95
  Items skipped (duplicates): 5
  Tags created: 15
  Tags reused: 10
  Errors: 0
  Time: 2.5s

ID Mappings (due to conflicts):
  Issue #1 → Item #1
  Issue #2 → Item #2
  Issue #100 → Item #123 (ID conflict)
```

### Troubleshooting

**"User not found" error:**
- Create the user first via API or directly in the database
- User must exist before importing items

**"Repository not found" error:**
- Check the repository name format: `owner/repo`
- Ensure the repository is public or provide `GITHUB_TOKEN`

**Rate limit errors:**
- Set `GITHUB_TOKEN` environment variable for higher limits
- Public repos: 60 requests/hour (no token) vs 5000/hour (with token)

**Import fails with errors:**
- Use `--dry-run` first to validate the JSON
- Check error messages for specific issues
- Transaction ensures database is unchanged on failure

**Items show wrong creation dates:**
- Use `--force-reimport` to fix timestamps on existing items
- Original imports may have used current date instead of GitHub date
- Re-importing preserves the original GitHub creation timestamps
