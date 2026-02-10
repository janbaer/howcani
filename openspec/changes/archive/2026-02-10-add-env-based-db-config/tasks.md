# Implementation Tasks

## 1. Update Database Module
- [x] 1.1 Modify `src/server/db/database.ts` to read `NODE_ENV` environment variable
- [x] 1.2 Add logic to select database path based on NODE_ENV:
  - `test` → `./data/howcani.test.db`
  - `production` → Use `DATABASE_URL` env var, fallback to `./data/howcani.db`
  - `development` (or undefined) → `./data/howcani.db`
- [x] 1.3 Ensure parent directories are created for custom paths
- [x] 1.4 Update console log message to show selected database path and environment

## 2. Update Package Scripts
- [x] 2.1 Verify `package.json` test script (Bun automatically sets `NODE_ENV=test`)
- [x] 2.2 Verify `package.json` test:watch script (Bun automatically sets `NODE_ENV=test`)
- [x] 2.3 Verify build and start scripts have correct NODE_ENV values

## 3. Update Environment Documentation
- [x] 3.1 Update `.env.example` with comments explaining environment-based database selection
- [x] 3.2 Document DATABASE_URL behavior for different NODE_ENV values
- [x] 3.3 Add example values for test, development, and production environments

## 4. Testing and Validation
- [x] 4.1 Verify existing tests still pass with test database
- [x] 4.2 Manually verify development database is used when `NODE_ENV=development`
- [x] 4.3 Manually verify test database is used when running `bun test`
- [x] 4.4 Confirm test and development databases are separate files
- [x] 4.5 Optionally: Add a simple test that verifies environment-based database path selection
