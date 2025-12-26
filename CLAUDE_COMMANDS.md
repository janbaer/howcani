# HowCanI Migration - Commands Reference

Quick reference for all commands needed to execute the migration plan.

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Claude Code CLI Commands](#claude-code-cli-commands)
3. [Bun Development Commands](#bun-development-commands)
4. [Frontend Development Commands](#frontend-development-commands)
5. [Database Commands](#database-commands)
6. [Migration Commands](#migration-commands)
7. [Deployment Commands](#deployment-commands)
8. [Troubleshooting Commands](#troubleshooting-commands)

---

## Initial Setup

### 1. Create Project Directory Structure
```bash
# Create main project directory
mkdir howcani-migration
cd howcani-migration

# Create backend and frontend directories
mkdir server
mkdir client
mkdir scripts
mkdir docs

# Initialize git
git init
git add -A
git commit -m "Initial project structure"
```

### 2. Install Bun (if not already installed)
```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (using Homebrew)
brew install oven-sh/bun/bun

# Or download from https://bun.sh/download

# Verify installation
bun --version
```

### 3. Clone Existing HowCanI Repository
```bash
# In your client directory
cd client
git clone https://github.com/janbaer/howcani.git .

# Go back to root
cd ..
```

---

## Claude Code CLI Commands

### Using Claude Code CLI with the Migration Plan

#### Basic Usage
```bash
# Using with the migration plan context
cat MIGRATION_PLAN.md | claude code --task "Implement Phase 1: Bun backend setup"

# Or with file context
claude code --context MIGRATION_PLAN.md --task "Create database schema"

# With multiple files
claude code --context MIGRATION_PLAN.md TASKS.md --task "Phase 1 implementation"
```

#### Phase 1: Backend Setup
```bash
# Start Phase 1
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Implement Phase 1: Set up Bun project, create database schema, implement API endpoints"

# Just database schema
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Create SQLite database schema for questions, answers, users, labels"

# Just API endpoints
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Implement all REST API endpoints for questions, answers, labels as specified in API Endpoints Specification section"

# Authentication endpoints
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Implement JWT authentication endpoints (register, login, logout, refresh)"
```

#### Phase 2: Authentication
```bash
# JWT authentication system
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Implement JWT authentication with email/password, token generation, validation, and refresh logic"

# Password hashing
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Add secure password hashing using bcrypt or argon2"
```

#### Phase 3: Frontend UI Components
```bash
# UI component replacement
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Replace svelte-materialify components with ShadCN Svelte, update AppBar, Button, TextField, Dialog, Card components"

# Store updates for new API
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Update all Svelte stores to call new Bun API instead of GitHub API"

# SvelteKit migration (optional)
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Optionally migrate from Vite to SvelteKit for better server integration"
```

#### Phase 4: Migration
```bash
# GitHub issues export script
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Create migration script to export all GitHub issues and import into SQLite database"

# Data transformation
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Create data transformation logic to map GitHub issues to SQLite questions, transform labels, handle authors"
```

#### Specific File Generation
```bash
# Generate database initialization file
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Create server/src/db.ts with database initialization, schema creation, and SQLite connection logic"

# Generate middleware
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Create server/src/middleware.ts with JWT authentication middleware, CORS, error handling"

# Generate controllers
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Create all controller files: authController.ts, questionController.ts, answerController.ts, labelController.ts"

# Generate routes
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Create all route files: auth.ts, questions.ts, answers.ts, labels.ts with proper endpoint definitions"
```

---

## Bun Development Commands

### Backend Project Setup
```bash
# Create new Bun project
cd server
bun init

# Or with starter template
bun create vite my-app --template svelte
cd my-app

# Install dependencies
bun install

# Add specific packages
bun add hono              # Lightweight web framework
bun add jsonwebtoken      # JWT support
bun add bcryptjs          # Password hashing
bun add dotenv            # Environment variables
bun add cors              # CORS handling

# Add dev dependencies
bun add -d @types/node    # TypeScript types
bun add -d tsx            # TypeScript runner
```

### Running the Backend Server
```bash
# Start development server (watch mode)
bun run --watch src/index.ts

# Start with specific port
bun run src/index.ts --port 3001

# With environment variables
BUN_ENV=development bun run src/index.ts

# Run in production
BUN_ENV=production bun run src/index.ts
```

### Building Backend
```bash
# Build TypeScript
bun run build

# Compile to binary (Bun specific)
bun build --compile --outfile howcani-server ./src/index.ts

# Create Docker image
bun run docker:build
```

### Testing Backend
```bash
# Run tests
bun test

# Run specific test file
bun test server/src/tests/auth.test.ts

# Watch mode for tests
bun test --watch

# With coverage
bun test --coverage
```

### Database Management (Bun)
```bash
# Connect to SQLite database
bun --eval "
  import Database from 'bun:sqlite';
  const db = new Database('data.db');
  const result = db.query('SELECT * FROM questions LIMIT 5').all();
  console.log(result);
"

# Run migration script
bun run scripts/init-db.ts

# Reset database
bun run scripts/reset-db.ts

# Seed with test data
bun run scripts/seed-db.ts
```

---

## Frontend Development Commands

### Setup & Installation
```bash
# From client directory (existing HowCanI repo)
cd client

# Install dependencies
bun install

# Install new UI library (ShadCN Svelte)
bun add -d shadcn-svelte

# Or Skeleton UI
bun add -d @skeletonlabs/skeleton

# Install other needed packages
bun add axios              # HTTP client for API calls
bun add pinia              # Optional: better state management
```

### Running Frontend
```bash
# Start dev server (Vite)
bun run start

# Build for production
bun run build

# Preview production build
bun run serve

# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Generate test coverage
bun run test:coverage
```

### Code Quality
```bash
# Lint code
bun run lint

# Format code with Prettier
bun run format

# Check types (if using TypeScript)
bun run type-check

# Run all checks
bun run check
```

---

## Database Commands

### SQLite Operations
```bash
# Install SQLite CLI (if needed)
# macOS
brew install sqlite3

# Linux
sudo apt-get install sqlite3

# Windows
# Download from https://www.sqlite.org/download.html
```

### Using SQLite CLI
```bash
# Connect to database
sqlite3 data.db

# Inside sqlite3 CLI:

# Show all tables
.tables

# Show schema for table
.schema questions

# Run query
SELECT * FROM questions LIMIT 10;

# Import CSV
.mode csv
.import data.csv table_name

# Export as CSV
.output file.csv
SELECT * FROM questions;
.output stdout

# Exit
.exit
```

### Using Bun for Database
```bash
# Create initial database
bun run scripts/init-db.ts

# Run migrations
bun run scripts/migrations.ts

# Seed test data
bun run scripts/seed.ts

# Backup database
cp data.db data.backup.db

# Restore from backup
cp data.backup.db data.db

# Query from CLI
bun --eval "
  import Database from 'bun:sqlite';
  const db = new Database('data.db');
  const users = db.query('SELECT * FROM users').all();
  console.log(users);
"
```

---

## Migration Commands

### GitHub Issues Export
```bash
# Install GitHub CLI (if needed)
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authenticate with GitHub
gh auth login

# List all issues
gh issue list --repo janbaer/howcani --limit 1000

# Export issues to JSON
gh issue list --repo janbaer/howcani --limit 1000 --json title,body,labels,createdAt,updatedAt,author > issues.json
```

### Run Migration Script
```bash
# Create migration script (using Claude Code CLI)
claude code \\
  --context MIGRATION_PLAN.md \\
  --task "Create bun migration script at server/scripts/migrate-github-issues.ts"

# Execute migration
bun run scripts/migrate-github-issues.ts

# With environment variable for GitHub token
GITHUB_TOKEN=ghp_xxxxx bun run scripts/migrate-github-issues.ts

# Dry run (test without inserting)
DRY_RUN=true bun run scripts/migrate-github-issues.ts

# Verify migration
bun run scripts/verify-migration.ts

# Show statistics
bun run scripts/migration-stats.ts
```

### Verify Data Integrity
```bash
# Count records
sqlite3 data.db "SELECT 'Users' as table_name, COUNT(*) FROM users UNION ALL SELECT 'Questions', COUNT(*) FROM questions UNION ALL SELECT 'Answers', COUNT(*) FROM answers UNION ALL SELECT 'Labels', COUNT(*) FROM labels;"

# Check for orphaned records
sqlite3 data.db "SELECT * FROM
