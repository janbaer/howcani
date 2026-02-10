# Change: Implement User Management Domain Layer

## Why

The user-management spec exists but lacks the critical domain layer with validation logic and tests. Currently, validation happens (or doesn't happen) at the repository/route level, violating clean architecture principles. This creates risk of invalid data entering the system and makes the codebase harder to maintain and test.

## What Changes

- Create domain layer with User entity and validation functions (pure business logic)
- Add comprehensive tests for domain validation rules
- Add repository integration tests with in-memory SQLite
- Update schema migration to match current implementation (TEXT IDs, unique email)
- Remove display_name field (not needed)
- Implement case-insensitive username uniqueness checking
- Add URL-safe username validation (alphanumeric, hyphens, underscores, 3-30 chars)
- Add email format validation
- Add required field validation

**BREAKING**: Schema migration required to:
- Add COLLATE NOCASE to username column
- Remove display_name column
- Add email unique constraint

## Impact

- Affected specs: user-management
- Affected code:
  - `src/server/db/migrations.ts` - Update users table schema
  - `src/server/repositories/user.repository.ts` - Use domain validation, remove display_name
  - `src/server/domain/user.ts` - NEW: Domain model and validation
  - `src/server/domain/user.spec.ts` - NEW: Domain tests
  - `src/server/db/repositories/user-repository.spec.ts` - NEW: Repository tests
  - `src/server/routes/user.routes.ts` - Use domain validation
