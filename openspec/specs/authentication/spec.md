# Authentication Specification

## Purpose

The authentication system provides JWT-based authentication for the HowCanI application. It allows users to register, login, and maintain authenticated sessions for performing write operations on their knowledge base.

## Requirements

### Requirement: User Registration

The system MUST allow new users to register with username, email, and password.

#### Scenario: Successful registration with valid credentials

**Given** a user provides valid registration data:
- Username: "john" (3-30 chars, alphanumeric with hyphens/underscores)
- Email: "john@example.com"
- Password: "secure123" (minimum 8 characters)

**When** the user submits the registration form

**Then** the system should:
- Create a new user account with hashed password (bcrypt, minimum 10 rounds)
- Generate a JWT token signed with server secret
- Return status `StatusCodes.CREATED`
- Return JSON: `{ user: { id, username, email }, token: "jwt..." }`

#### Scenario: Registration fails with duplicate username

**Given** a user "john" already exists in the system

**When** another user attempts to register with username "john"

**Then** the system should:
- Reject the registration
- Return status `StatusCodes.BAD_REQUEST`
- Return JSON: `{ error: { message: "Username already exists", code: "VALIDATION_ERROR" } }`

#### Scenario: Registration fails with invalid username format

**Given** a user provides username with invalid characters or length:
- Too short: "ab"
- Too long: More than 30 characters
- Invalid chars: "john@doe" or "john.doe"

**When** the user submits the registration

**Then** the system should:
- Reject the registration
- Return status `StatusCodes.BAD_REQUEST`
- Return error indicating invalid username format

#### Scenario: Registration fails with weak password

**Given** a user provides password shorter than 8 characters

**When** the user submits the registration

**Then** the system should:
- Reject the registration
- Return status `StatusCodes.BAD_REQUEST`
- Return error indicating password too short

#### Scenario: Registration fails with invalid email

**Given** a user provides invalid email format: "notanemail"

**When** the user submits the registration

**Then** the system should:
- Reject the registration
- Return status `StatusCodes.BAD_REQUEST`
- Return error indicating invalid email format

### Requirement: User Login

The system MUST authenticate existing users and provide JWT tokens for authorized operations.

#### Scenario: Successful login with valid credentials

**Given** a registered user exists:
- Username: "john"
- Password: "secure123"

**When** the user submits correct username and password

**Then** the system should:
- Verify password against stored hash
- Generate new JWT token with 7-day expiration
- Return status `StatusCodes.OK`
- Return JSON: `{ user: { id, username, email }, token: "jwt..." }`

#### Scenario: Login fails with incorrect password

**Given** a registered user "john" exists

**When** the user submits username "john" with incorrect password

**Then** the system should:
- Reject the login
- Return status `StatusCodes.UNAUTHORIZED`
- Return JSON: `{ error: { message: "Invalid credentials", code: "UNAUTHORIZED" } }`
- Not reveal whether username or password was incorrect

#### Scenario: Login fails with non-existent username

**Given** no user "alice" exists in the system

**When** someone attempts to login with username "alice"

**Then** the system should:
- Reject the login
- Return status `StatusCodes.UNAUTHORIZED`
- Return JSON: `{ error: { message: "Invalid credentials", code: "UNAUTHORIZED" } }`
- Not reveal that username doesn't exist

### Requirement: JWT Token Structure

JWT tokens MUST contain necessary information for authorization and have appropriate expiration.

#### Scenario: Token contains user identification

**Given** a user "john" with id 42 successfully logs in

**When** the system generates a JWT token

**Then** the token payload should include:
- `user_id`: 42
- `username`: "john"
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp (7 days from issue)

### Requirement: Token is signed with server secret

**Given** the server has environment variable `HOWCANI_JWT_SECRET`

**When** the system generates any JWT token

**Then** the token should:
- Be signed using the secret from `HOWCANI_JWT_SECRET`
- Be verifiable using the same secret
- Use the `jose` library for signing and verification

#### Scenario: Application starts with HOWCANI_JWT_SECRET configured

- **WHEN** the application starts and `HOWCANI_JWT_SECRET` environment variable is set
- **THEN** the system SHALL use that value for JWT signing and verification

#### Scenario: Application refuses to start without HOWCANI_JWT_SECRET

- **WHEN** the application starts and `HOWCANI_JWT_SECRET` environment variable is not set
- **THEN** the system SHALL throw an error and exit immediately
- **AND** the error message SHALL clearly state that `HOWCANI_JWT_SECRET` is required

#### Scenario: Application refuses to start with empty HOWCANI_JWT_SECRET

- **WHEN** the application starts and `HOWCANI_JWT_SECRET` is set to an empty string
- **THEN** the system SHALL throw an error and exit immediately

### Requirement: Protected Endpoint Authorization

Endpoints that modify data MUST verify JWT tokens and check ownership.

#### Scenario: Authorized request with valid token

**Given** a user "john" has valid JWT token

**When** the user makes request to `POST /api/john/items` with token in Authorization header

**Then** the system should:
- Verify JWT signature and expiration
- Extract username from token
- Compare token username with URL username
- Allow the request to proceed if they match

#### Scenario: Unauthorized request without token

**Given** no authentication token is provided

**When** a request is made to `POST /api/john/items`

**Then** the system should:
- Reject the request
- Return status `StatusCodes.UNAUTHORIZED`
- Return JSON: `{ error: { message: "Authentication required", code: "UNAUTHORIZED" } }`

#### Scenario: Unauthorized request with expired token

**Given** a JWT token that expired

**When** a request is made with the expired token

**Then** the system should:
- Reject the request
- Return status `StatusCodes.UNAUTHORIZED`
- Return JSON: `{ error: { message: "Token expired", code: "UNAUTHORIZED" } }`

#### Scenario: Forbidden request with mismatched username

**Given** a user "john" has valid JWT token

**When** the user makes request to `POST /api/alice/items` (different username)

**Then** the system should:
- Reject the request
- Return status `StatusCodes.FORBIDDEN`
- Return JSON: `{ error: { message: "Not authorized to modify this user's content", code: "FORBIDDEN" } }`

### Requirement: Password Security

The system MUST securely hash and verify passwords.

#### Scenario: Password is hashed before storage

**Given** a user registers with password "secure123"

**When** the system stores the user

**Then** the password should:
- Be hashed using bcrypt with minimum 10 rounds
- Never be stored in plain text
- Be stored only as hash in database

#### Scenario: Password verification uses constant-time comparison

**Given** stored password hash for user "john"

**When** verifying login password

**Then** the system should:
- Use bcrypt's compare function
- Prevent timing attacks
- Return boolean result without revealing hash

## Implementation Notes

### API Endpoints

```
POST /api/auth/register
  Request: { username: string, email: string, password: string }
  Response: { user: { id, username, email }, token: string }
  Status: 201 Created | 400 Bad Request

POST /api/auth/login
  Request: { username: string, password: string }
  Response: { user: { id, username, email }, token: string }
  Status: 200 OK | 401 Unauthorized
```

### Dependencies

- `jose` library for JWT operations
- `http-status-codes` for status code constants
- Bcrypt implementation from Bun's built-in crypto

### Environment Variables

```
HOWCANI_JWT_SECRET=<strong-random-secret>
```

### Client-Side Token Management

- JWT token is persisted to `localStorage` under key `howcani_token`
- Token is loaded on app initialization (`api.ts` module load) to maintain sessions across page reloads
- Token is cleared from `localStorage` on logout via `setAccessToken(null)`
- Token is sent as `Bearer` token in the `Authorization` header on every API request
- Token management is centralized in `api.ts`; auth state (user, isAuthenticated) lives in `auth.svelte.ts`

### Testing Requirements

- Test-first: Write tests before implementing auth logic
- Use in-memory SQLite for test database
- Test all scenarios defined above
- Include tests for edge cases (empty strings, SQL injection attempts, etc.)
