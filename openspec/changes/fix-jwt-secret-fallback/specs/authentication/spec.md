## MODIFIED Requirements

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
