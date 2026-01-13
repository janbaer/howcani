# Implementation Tasks

## 1. Domain Layer Implementation

- [x] 1.1 Create `src/server/domain/user.ts` with User interface
- [x] 1.2 Implement username validation function (URL-safe, 3-30 chars)
- [x] 1.3 Implement email validation function (standard email format)
- [x] 1.4 Implement required fields validation
- [x] 1.5 Create validation result types (success/error with messages)

## 2. Domain Layer Tests

- [x] 2.1 Create `src/server/domain/user.spec.ts` test file
- [x] 2.2 Test username validation - valid cases (alphanumeric, hyphens, underscores)
- [x] 2.3 Test username validation - invalid cases (special chars, spaces, dots)
- [x] 2.4 Test username length - too short (< 3 chars)
- [x] 2.5 Test username length - too long (> 30 chars)
- [x] 2.6 Test username length - valid range (3-30 chars)
- [x] 2.7 Test email validation - valid formats
- [x] 2.8 Test email validation - invalid formats
- [x] 2.9 Test required fields validation
- [x] 2.10 Run domain tests: `bun test src/server/domain/user.spec.ts`

## 3. Database Migration

- [x] 3.1 Add migration in `src/server/db/migrations.ts` to:
  - Add COLLATE NOCASE to username column
  - Add UNIQUE constraint to email column
  - Remove display_name column
  - Add updated_at column with DEFAULT CURRENT_TIMESTAMP
- [x] 3.2 Test migration with fresh database
- [x] 3.3 Verify schema matches spec with `.schema users` command

## 4. Repository Updates

- [x] 4.1 Update UserRepository to remove display_name from create/update
- [x] 4.2 Update CreateUserDTO - remove displayName field
- [x] 4.3 Update UpdateUserDTO - remove displayName field
- [x] 4.4 Update User interface - remove display_name, ensure updated_at exists
- [x] 4.5 Ensure findByUsername uses case-insensitive comparison
- [x] 4.6 Ensure usernameExists uses case-insensitive comparison
- [x] 4.7 Add findByEmail method (if not exists)
- [x] 4.8 Add emailExists method

## 5. Repository Integration Tests

- [x] 5.1 Create `src/server/db/repositories/user-repository.spec.ts`
- [x] 5.2 Set up in-memory SQLite database for tests
- [x] 5.3 Test create user - persists to database
- [x] 5.4 Test create user - returns entity with generated id
- [x] 5.5 Test create user - sets created_at and updated_at timestamps
- [x] 5.6 Test findByUsername - returns correct user
- [x] 5.7 Test findByUsername - handles case-insensitively
- [x] 5.8 Test findByUsername - returns null for non-existent user
- [x] 5.9 Test findByEmail - returns correct user
- [x] 5.10 Test findByEmail - returns null for non-existent email
- [x] 5.11 Test findById - returns correct user
- [x] 5.12 Test findById - returns null for non-existent id
- [x] 5.13 Test usernameExists - returns true for existing username
- [x] 5.14 Test usernameExists - case-insensitive check
- [x] 5.15 Test usernameExists - returns false for non-existent username
- [x] 5.16 Test emailExists - returns true for existing email
- [x] 5.17 Test emailExists - returns false for non-existent email
- [x] 5.18 Test username uniqueness constraint - rejects duplicate usernames
- [x] 5.19 Test email uniqueness constraint - rejects duplicate emails
- [x] 5.20 Run repository tests: `bun test src/server/db/repositories/user-repository.spec.ts`

## 6. Route Layer Updates

- [x] 6.1 Update user routes to use domain validation before repository calls
- [x] 6.2 Return proper validation errors with http-status-codes
- [x] 6.3 Remove display_name from request/response DTOs
- [x] 6.4 Test routes manually or with route tests

## 7. Validation & Cleanup

- [x] 7.1 Run all tests: `bun test`
- [x] 7.2 Fix any test failures
- [x] 7.3 Run linter: `bun lint`
- [x] 7.4 Fix all lint errors
- [x] 7.5 Verify database schema matches spec
- [x] 7.6 Ensure no references to display_name remain in codebase

## 8. Documentation

- [x] 8.1 Update any API documentation with validation rules
- [x] 8.2 Document error messages for validation failures
