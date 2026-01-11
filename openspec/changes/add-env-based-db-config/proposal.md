# Change: Environment-Based Database Configuration

## Why

Currently, the database path is hardcoded to `./data/howcani.db` in `src/server/db/database.ts`. This creates a problem during testing: test runs modify the same database file used for development, leading to data corruption, test pollution, and unreliable test results.

According to project conventions, tests should use SQLite in-memory databases or separate test databases, not the development database. The test runner needs to automatically use a different database when `NODE_ENV=test`.

## What Changes

- Add environment-aware database path selection in `src/server/db/database.ts`
- Use `NODE_ENV` to determine which database file to use:
  - `test` → `./data/howcani.test.db` (or in-memory `:memory:`)
  - `production` → Use `DATABASE_URL` env var (default: `./data/howcani.db`)
  - `development` → `./data/howcani.db` (default)
- Update `package.json` test scripts to set `NODE_ENV=test`
- Update `.env.example` to document the environment-based behavior
- Add test to verify environment-based database selection

## Impact

**Affected specs:**
- No existing spec covers database configuration; this will be documented as implementation notes in project.md or a new database-config capability if deemed necessary

**Affected code:**
- `src/server/db/database.ts` - Add environment detection logic
- `package.json` - Update test scripts to set NODE_ENV=test
- `.env.example` - Document DATABASE_URL and NODE_ENV behavior
- Potentially new test file to verify configuration

**Benefits:**
- Tests no longer corrupt development database
- Parallel test execution becomes safer
- Follows project convention of separate test databases
- Enables CI/CD environments to use different databases

**Risks:**
- Minimal risk; backward compatible (defaults to current behavior)
- Existing databases unaffected
- Tests currently use mocked repositories, but this prepares for future integration tests
