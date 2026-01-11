# Database Configuration Spec Delta

## ADDED Requirements

### Requirement: Environment-Based Database Path Selection

The system MUST select the appropriate database file path based on the NODE_ENV environment variable to prevent test pollution and support multiple deployment environments.

#### Scenario: Test environment uses separate database

**Given** the application is running with `NODE_ENV=test`

**When** the database module is initialized

**Then** the system should:
- Use database path `./data/howcani.test.db` OR in-memory database `:memory:`
- Create the data directory if it doesn't exist
- Log the selected database path
- Enable WAL mode and foreign keys as normal

#### Scenario: Production environment uses DATABASE_URL

**Given** the application is running with `NODE_ENV=production`

**And** environment variable `DATABASE_URL=./custom/path/production.db` is set

**When** the database module is initialized

**Then** the system should:
- Use the path from `DATABASE_URL` environment variable
- Fall back to `./data/howcani.db` if `DATABASE_URL` is not set
- Create parent directories if they don't exist
- Enable WAL mode and foreign keys as normal

#### Scenario: Development environment uses default path

**Given** the application is running with `NODE_ENV=development` or NODE_ENV is not set

**When** the database module is initialized

**Then** the system should:
- Use default path `./data/howcani.db`
- Create the data directory if it doesn't exist
- Enable WAL mode and foreign keys as normal

#### Scenario: Database isolation between environments

**Given** tests are running with `NODE_ENV=test`

**And** development server is running with `NODE_ENV=development`

**When** both environments are active simultaneously

**Then** the system should:
- Use completely separate database files
- Not interfere with each other's data
- Allow parallel execution without conflicts

### Requirement: Test Script Configuration

Test scripts MUST set the appropriate environment variable to ensure test isolation.

#### Scenario: Test command sets NODE_ENV

**Given** a developer runs `bun test` or `npm test`

**When** the test script executes

**Then** the system should:
- Set `NODE_ENV=test` before running tests
- Ensure all test processes inherit this environment variable
- Use the test database for all database operations during tests

#### Scenario: Watch mode preserves test environment

**Given** a developer runs `bun test --watch`

**When** tests run and re-run on file changes

**Then** the system should:
- Maintain `NODE_ENV=test` for all test executions
- Use the test database consistently across all runs
- Not switch to development database

### Requirement: Environment Variable Documentation

The system MUST document database configuration through .env.example with clear explanations.

#### Scenario: Example file documents all database options

**Given** a new developer clones the repository

**When** they open `.env.example`

**Then** they should see:
- `DATABASE_URL` with explanation of environment-based behavior
- Comment explaining test environment uses separate database
- Comment explaining NODE_ENV values (development, test, production)
- Default value example for each environment
