## MODIFIED Requirements

### Requirement: User Domain Model

The system MUST define a User entity with proper validation and business rules.

#### Scenario: User entity has required fields

**Given** a User entity is created

**When** examining its properties

**Then** the user should have:
- `id`: Unique identifier (TEXT/UUID, auto-generated)
- `username`: String (3-30 chars, URL-safe, case-insensitive unique)
- `email`: String (valid email format, unique)
- `password_hash`: String (bcrypt hashed)
- `created_at`: Timestamp (auto-set on creation)
- `updated_at`: Timestamp (auto-set on creation and updates)

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

#### Scenario: Email MUST be unique

**Given** a user with email "john@example.com" exists

**When** attempting to create another user with email "john@example.com"

**Then** the system should:
- Reject with validation error
- Indicate email already exists
- Prevent duplicate email addresses across all users

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
- Set created_at and updated_at timestamps automatically

#### Scenario: Find user by username

**Given** a user "john" exists in database

**When** UserRepository.findByUsername("john") is called

**Then** the system should:
- Return User entity for "john"
- Handle case-insensitively (finds "John", "JOHN", "john")
- Include all user fields
- Return null if username not found

#### Scenario: Find user by email

**Given** a user with email "john@example.com" exists

**When** UserRepository.findByEmail("john@example.com") is called

**Then** the system should:
- Return User entity for that email
- Include all user fields
- Return null if email not found

#### Scenario: Find user by id

**Given** a user with id exists

**When** UserRepository.findById(id) is called

**Then** the system should:
- Return User entity with that id
- Include all user fields
- Return null if id not found

#### Scenario: Check username existence

**Given** a user "john" exists in database

**When** UserRepository.usernameExists("john") is called

**Then** the system should:
- Return true for existing username
- Return false for non-existing username
- Compare case-insensitively

#### Scenario: Check email existence

**Given** a user with email "john@example.com" exists

**When** UserRepository.emailExists("john@example.com") is called

**Then** the system should:
- Return true for existing email
- Return false for non-existing email

## MODIFIED Database Schema

### Users Table

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username COLLATE NOCASE);
CREATE INDEX idx_users_email ON users(email);
```

**Changes from previous schema:**
- ID type: TEXT (UUID) instead of INTEGER
- Email: Added UNIQUE constraint
- Removed: display_name field
- Added: updated_at field
- Username: Added COLLATE NOCASE for case-insensitive uniqueness
- Added: duplicate_threshold INTEGER NOT NULL DEFAULT 92

### Requirement: Duplicate threshold user setting

The system SHALL store a `duplicate_threshold` setting per user as an integer percentage (0–100) with a default value of 92. The setting SHALL be persisted in the `users` table. The `UserRepository` SHALL expose methods to read and update this setting. The settings page SHALL display the threshold as a percentage input and allow the authenticated user to update it.

#### Scenario: New users get default threshold of 92

- **WHEN** a new user account is created
- **THEN** their `duplicate_threshold` is 92

#### Scenario: User updates duplicate threshold

- **WHEN** an authenticated user submits a new threshold value (e.g. 85) on the settings page
- **THEN** the system stores the value and returns HTTP 200

#### Scenario: Threshold is validated to be between 50 and 100

- **WHEN** an authenticated user submits a threshold outside the range 50–100
- **THEN** the system returns HTTP 400 with a validation error

#### Scenario: Settings page shows current threshold

- **WHEN** an authenticated user visits the settings page
- **THEN** the duplicate threshold input shows the user's currently stored value
