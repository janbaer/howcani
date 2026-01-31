# User Management Specification

## Purpose

The user management system handles the lifecycle and data model of user accounts. Users are the owners of knowledge bases, with each user having their own namespace for items and tags.

## Requirements

### Requirement: User Domain Model

The system MUST define a User entity with proper validation and business rules.

#### Scenario: User entity has required fields

**Given** a User entity is created

**When** examining its properties

**Then** the user should have:
- `id`: Unique identifier (auto-generated)
- `username`: String (3-30 chars, URL-safe)
- `email`: String (valid email format)
- `password_hash`: String (bcrypt hashed)
- `created_at`: Timestamp (auto-set on creation)

#### Scenario: Username MUST be URL-safe

**Given** attempting to create a user

**When** providing username with special characters:
- Invalid: "john@doe", "john.smith", "john doe", "john/smith"
- Valid: "john", "john-doe", "john_smith", "john123"

**Then** the system should:
- Accept valid usernames (alphanumeric, hyphens, underscores)
- Reject invalid usernames with validation error
- Ensure usernames work in URLs like `/john-doe/items`

#### Scenario: Username length is validated

**Given** attempting to create a user

**When** providing username:
- Too short: "ab" (less than 3 chars)
- Valid: "abc" to 30 chars
- Too long: 31+ characters

**Then** the system should:
- Accept usernames between 3-30 characters
- Reject usernames outside this range with validation error

#### Scenario: Username is case-insensitive unique

**Given** a user "John" exists

**When** attempting to create users with names:
- "john" (different case)
- "JOHN" (different case)
- "JoHn" (mixed case)

**Then** the system should:
- Reject all attempts as duplicate usernames
- Store username in original case provided
- Compare usernames case-insensitively for uniqueness

### Requirement: User Repository

The system MUST provide data access for user operations.

#### Scenario: Create user persists to database

**Given** valid user data:
- Username: "john"
- Email: "john@example.com"
- Password hash: (bcrypt hash)

**When** UserRepository.create() is called

**Then** the system should:
- Insert user into database
- Return User entity with generated id
- Set created_at timestamp automatically

#### Scenario: Find user by username

**Given** a user "john" exists in database

**When** UserRepository.findByUsername("john") is called

**Then** the system should:
- Return User entity for "john"
- Include all user fields
- Return null if username not found

#### Scenario: Find user by id

**Given** a user with id 42 exists

**When** UserRepository.findById(42) is called

**Then** the system should:
- Return User entity with id 42
- Include all user fields
- Return null if id not found

#### Scenario: Check username existence

**Given** a user "john" exists in database

**When** UserRepository.exists("john") is called

**Then** the system should:
- Return true for existing username
- Return false for non-existing username
- Compare case-insensitively

### Requirement: User Validation

The system MUST validate user data before persistence.

#### Scenario: Validate email format

**Given** attempting to create user with email

**When** providing:
- Valid: "user@example.com", "user+tag@domain.co.uk"
- Invalid: "notanemail", "@example.com", "user@", "user @example.com"

**Then** the system should:
- Accept valid email formats
- Reject invalid formats with validation error
- Use standard email validation regex

#### Scenario: Validate required fields

**Given** attempting to create user

**When** any required field is missing or empty:
- Username: empty or null
- Email: empty or null
- Password: empty or null

**Then** the system should:
- Reject with validation error
- Indicate which field is missing
- Not persist to database

### Requirement: User Namespace Isolation

Each user's data MUST be isolated in their own namespace.

#### Scenario: Users have separate item namespaces

**Given** two users exist:
- User "john" with items
- User "alice" with items

**When** accessing `/john/items` and `/alice/items`

**Then** the system should:
- Show only John's items at `/john/items`
- Show only Alice's items at `/alice/items`
- Never mix items between users

#### Scenario: Users have separate tag namespaces

**Given** two users exist:
- User "john" with tag "work"
- User "alice" with tag "work"

**When** both users use tag "work"

**Then** the system should:
- Maintain separate "work" tags (different IDs)
- Associate each tag only with its owner's items
- Allow same tag name across different users

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username COLLATE NOCASE);
```

## Domain Layer Structure

```
src/server/domain/user.ts
  - User class/interface
  - Validation logic (pure functions)
  - Business rules
  - No database or framework dependencies

src/server/domain/user.spec.ts
  - Unit tests for User domain
  - Validation tests
  - Business rule tests

src/server/repositories/user.repository.ts
  - UserRepository class
  - CRUD operations
  - Database queries
  - Depends on User domain model

src/server/repositories/user.repository.spec.ts
  - Integration tests with in-memory SQLite
  - Test all repository operations

src/server/services/user.service.ts
  - UserService class
  - Business logic orchestration
  - User lookup operations (without exposing password_hash)

src/server/services/user.service.spec.ts
  - Unit tests with mocked repository
```

## Testing Requirements

- Test-first for domain model, service, and repository
- Layered test isolation:
  - Service tests: Mock repositories using `mock.module()`
  - Repository tests: Use in-memory SQLite for integration tests
- Test all validation scenarios
- Test case-insensitive username uniqueness
- Test namespace isolation at data layer

## Implementation Notes

### Validation Rules

```typescript
// Username validation
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements
const MIN_PASSWORD_LENGTH = 8;
```

### Error Messages

- Username too short: "Username MUST be at least 3 characters"
- Username too long: "Username cannot exceed 30 characters"
- Username invalid chars: "Username can only contain letters, numbers, hyphens, and underscores"
- Username taken: "Username already exists"
- Email invalid: "Invalid email format"
- Field required: "Field {fieldName} is required"
