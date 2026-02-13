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

## Docker Deployment

HowCanI v3 includes complete Docker containerization for easy deployment to any environment.

### Prerequisites

- Docker and Docker Compose installed
- Access to Forgejo registry: `forgejo.home.janbaer.de`

### Registry Authentication

Before deploying, authenticate to the private Forgejo registry:

```bash
docker login forgejo.home.janbaer.de
```

Enter your credentials when prompted. Authentication persists and is used for all image operations.

### Building and Publishing Images

Use the automated build script to bump version, build Docker image, and push to registry:

```bash
# Bump patch version (1.0.0 -> 1.0.1) and publish
./scripts/build-docker.sh patch

# Bump minor version (1.0.0 -> 1.1.0) and publish
./scripts/build-docker.sh minor

# Bump major version (1.0.0 -> 2.0.0) and publish
./scripts/build-docker.sh major
```

The build script:
1. Validates prerequisites (Docker running, Bun installed, clean git tree)
2. Bumps version in `package.json` and creates git tag
3. Builds Bun binary
4. Builds Docker image with multi-stage optimization
5. Tags image with both version number and `latest`
6. Pushes both tags to Forgejo registry
7. Cleans up build artifacts

Images are published to:
- `forgejo.home.janbaer.de/jan/howcani:VERSION` (e.g., `3.0.1`)
- `forgejo.home.janbaer.de/jan/howcani:latest`

### Deployment with Docker Compose

#### Initial Setup

1. **Create data directory** with appropriate permissions:
   ```bash
   mkdir -p /path/to/data
   chown $UID:$GID /path/to/data
   ```

2. **Configure environment** (optional - defaults work for most cases):
   Create a `.env` file in the same directory as `docker-compose.yml`:
   ```bash
   # Application port (default: 3000)
   HOWCANI_PORT=8080

   # Data directory path (default: ./data)
   HOWCANI_DATA_DIR=/var/lib/howcani/data

   # User and group ID for file permissions (default: 1000:1000)
   HOWCANI_UID=1001
   HOWCANI_GID=1001
   ```

3. **Pull the latest image**:
   ```bash
   docker-compose pull
   ```

#### Starting the Service

```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Check status and health
docker-compose ps
```

The application will be available at `http://localhost:3000` (or your configured port).

#### Configuration Variables

All runtime configuration is done via environment variables with sensible defaults:

| Variable | Description | Default |
|----------|-------------|---------|
| `HOWCANI_PORT` | Application port (host and container) | `3000` |
| `HOWCANI_DATA_DIR` | Host directory for data persistence | `./data` |
| `HOWCANI_UID` | User ID for container process | `1000` |
| `HOWCANI_GID` | Group ID for container process | `1000` |

These can be set in a `.env` file or passed directly:
```bash
HOWCANI_PORT=8080 docker-compose up -d
```

#### Database Migrations

If database schema changes require migrations:

```bash
# Run migrations on the deployed database
docker-compose run --rm howcani bun run db:migrate
```

Migrations should be run after pulling a new image but before starting the service.

#### Health Monitoring

The container includes a health check that polls the application endpoint every 30 seconds:

```bash
# Check health status
docker-compose ps

# View health check logs
docker inspect howcani | grep -A 10 Health
```

#### Accessing Logs

```bash
# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail 100

# Logs for specific time period
docker logs howcani --since 1h
```

#### Managing the Service

```bash
# Stop the service
docker-compose down

# Restart the service
docker-compose restart

# Pull latest image and restart
docker-compose pull && docker-compose up -d

# View resource usage
docker stats howcani
```

### Deploying Specific Versions

By default, Docker Compose uses the `latest` tag. To deploy a specific version:

1. Edit `docker-compose.yml` and change the image tag:
   ```yaml
   image: forgejo.home.janbaer.de/jan/howcani:3.0.1
   ```

2. Pull and restart:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

### Rollback Strategy

If a deployment introduces issues, roll back to a previous version:

1. **Identify the last known good version** from your deployment notes or git tags

2. **Update image tag** in `docker-compose.yml`:
   ```yaml
   image: forgejo.home.janbaer.de/jan/howcani:3.0.0  # Previous version
   ```

3. **Deploy the previous version**:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

4. **Restore database backup** (if schema changed):
   ```bash
   docker-compose down
   cp /path/to/data/howcani.db.backup /path/to/data/howcani.db
   docker-compose up -d
   ```

**Best Practice:** Always backup the database before deploying major version changes:
```bash
cp /path/to/data/howcani.db /path/to/data/howcani.db.backup-$(date +%Y%m%d)
```

### Data Persistence

All application data (SQLite database, uploads) is stored in the mounted data directory. This persists across container restarts and updates.

**Backup the data directory regularly:**
```bash
# Simple file copy
cp -r /path/to/data /path/to/backups/howcani-$(date +%Y%m%d)

# With compression
tar -czf howcani-backup-$(date +%Y%m%d).tar.gz /path/to/data
```

**Important:** Ensure the data directory on the host has correct ownership:
```bash
chown -R $UID:$GID /path/to/data
```

The container runs as the specified user (default: 1000:1000) and must have read/write permissions to the mounted directory.

### SQLite Database Backups

HowCanI uses SQLite with WAL (Write-Ahead Logging) mode for better concurrency. When backing up the database, you must handle the WAL file correctly to ensure data consistency.

#### Understanding SQLite WAL Files

SQLite creates three files:
- `howcani.db` - Main database file
- `howcani.db-wal` - Write-Ahead Log (recent transactions not yet in main file)
- `howcani.db-shm` - Shared memory (index to WAL file)

**Important:** Recent changes may be in the `.db-wal` file and not in the main `.db` file. Copying only the `.db` file without checkpointing can result in data loss!

#### Checkpoint Command

The checkpoint command merges WAL changes back into the main database file:

```bash
sqlite3 /path/to/howcani.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

**Output format:** `0|0|0`
- First number: Return code (0 = success)
- Second number: Number of pages checkpointed from WAL
- Third number: Number of pages remaining in WAL

Examples:
```bash
0|0|0    # Success, no pending changes, WAL empty
0|150|0  # Success, checkpointed 150 pages, WAL now empty
0|0|25   # Success, but 25 pages couldn't be checkpointed (database in use)
1|0|0    # Error occurred
```

#### Backup Methods

**Option 1: Checkpoint First (Recommended)**

The safest method - checkpoint to merge WAL, then copy only the main database:

```bash
# 1. Stop the application
docker-compose down

# 2. Checkpoint to merge WAL into main database
sqlite3 /path/to/data/howcani.db "PRAGMA wal_checkpoint(TRUNCATE);"

# 3. Copy just the .db file (it now contains everything)
cp /path/to/data/howcani.db /backups/howcani-$(date +%Y%m%d).db

# 4. Restart the application
docker-compose up -d
```

**Option 2: Copy All Files Together**

If you can't checkpoint, copy all three files atomically:

```bash
# 1. Stop the application
docker-compose down

# 2. Copy all SQLite files together
cp /path/to/data/howcani.db* /backups/

# 3. On backup destination, checkpoint to merge
sqlite3 /backups/howcani.db "PRAGMA wal_checkpoint(TRUNCATE);"

# 4. Restart the application
docker-compose up -d
```

#### Restoring from Backup

```bash
# 1. Stop the application
docker-compose down

# 2. Restore the database file
cp /backups/howcani-20250213.db /path/to/data/howcani.db

# 3. Remove old WAL files (will be recreated)
rm -f /path/to/data/howcani.db-wal /path/to/data/howcani.db-shm

# 4. Restart the application
docker-compose up -d
```

#### Automated Backup Script

Create a backup script for regular backups:

```bash
#!/bin/bash
# backup-howcani.sh

BACKUP_DIR="/backups/howcani"
DATA_DIR="/path/to/data"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Stop application
docker-compose -f /path/to/docker-compose.yml down

# Checkpoint database
sqlite3 "$DATA_DIR/howcani.db" "PRAGMA wal_checkpoint(TRUNCATE);"

# Copy database
cp "$DATA_DIR/howcani.db" "$BACKUP_DIR/howcani-$DATE.db"

# Restart application
docker-compose -f /path/to/docker-compose.yml up -d

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "howcani-*.db" -mtime +7 -delete

echo "Backup complete: $BACKUP_DIR/howcani-$DATE.db"
```

Schedule with cron:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-howcani.sh >> /var/log/howcani-backup.log 2>&1
```

#### Copying Database Between Servers

When migrating to a new server:

```bash
# On source server:
# 1. Stop application
docker-compose down

# 2. Checkpoint database
sqlite3 /data/howcani.db "PRAGMA wal_checkpoint(TRUNCATE);"

# 3. Copy to destination
scp /data/howcani.db user@newserver:/data/

# On destination server:
# 4. Set correct permissions
chown 1000:1000 /data/howcani.db

# 5. Start application (WAL files will be created automatically)
docker-compose up -d
```

### Troubleshooting

**Port already in use:**
```bash
# Check what's using the port
sudo lsof -i :3000

# Change port in .env file
echo "HOWCANI_PORT=8080" > .env
docker-compose up -d
```

**Permission denied on data directory:**
```bash
# Fix ownership
chown -R $UID:$GID /path/to/data

# Or match container user
chown -R 1000:1000 /path/to/data
```

**Container fails to start:**
```bash
# Check logs for errors
docker-compose logs

# Verify image exists
docker images | grep howcani

# Pull image again
docker-compose pull
```

**Health check failing:**
```bash
# Check if application is responding
curl http://localhost:3000/

# Check container logs
docker-compose logs

# Restart container
docker-compose restart
```
