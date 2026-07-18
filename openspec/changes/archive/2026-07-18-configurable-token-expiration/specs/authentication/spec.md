## MODIFIED Requirements

### Requirement: User Login

The system MUST authenticate existing users and provide JWT tokens for authorized operations.

#### Scenario: Successful login with valid credentials

**Given** a registered user exists:
- Username: "john"
- Password: "secure123"

**When** the user submits correct username and password

**Then** the system should:
- Verify password against stored hash
- Generate new JWT token whose lifetime is the configured `auth.tokenExpiration` (default 7 days)
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
- `exp`: Expiration timestamp, set to the configured `auth.tokenExpiration` from issue time (default 7 days)
