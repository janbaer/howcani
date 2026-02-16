## ADDED Requirements

### Requirement: MCP endpoint available on existing server
The system SHALL expose an MCP Streamable HTTP endpoint at `/mcp` on the existing Elysia server. The endpoint SHALL handle POST, GET, and DELETE HTTP methods for MCP protocol communication. The endpoint SHALL use stateless transport (no session persistence between requests).

#### Scenario: MCP client initializes connection
- **WHEN** an MCP client sends an initialize request to `POST /mcp`
- **THEN** the server responds with MCP protocol capabilities including the list of available tools

#### Scenario: MCP client sends tool call
- **WHEN** an MCP client sends a tools/call request to `POST /mcp`
- **THEN** the server executes the requested tool and returns the result in MCP content format

#### Scenario: Non-MCP request to /mcp
- **WHEN** a regular HTTP client sends an invalid request to `/mcp`
- **THEN** the server responds with a 400 status code

### Requirement: search_items tool
The system SHALL provide a `search_items` MCP tool that performs full-text search across a user's knowledge base items. The tool SHALL accept a required `username` parameter, an optional `query` string for FTS search, an optional `tags` parameter (comma-separated tag names for filtering), and an optional `limit` parameter (default 20, max 100). The tool SHALL NOT require authentication.

#### Scenario: Search by query
- **WHEN** an MCP client calls `search_items` with username "jan" and query "docker"
- **THEN** the tool returns items matching "docker" in question or answer fields, ranked by relevance

#### Scenario: Search by tags
- **WHEN** an MCP client calls `search_items` with username "jan" and tags "devops,linux"
- **THEN** the tool returns items tagged with "devops" or "linux"

#### Scenario: Search with query and tags combined
- **WHEN** an MCP client calls `search_items` with username "jan", query "docker", and tags "devops"
- **THEN** the tool returns items matching "docker" that are also tagged "devops"

#### Scenario: Search for nonexistent username
- **WHEN** an MCP client calls `search_items` with a username that does not exist
- **THEN** the tool returns an error indicating the user was not found

### Requirement: list_items tool
The system SHALL provide a `list_items` MCP tool that returns a paginated list of a user's items sorted by creation date (newest first). The tool SHALL accept a required `username` parameter, an optional `limit` (default 20, max 100), and an optional `offset` (default 0). The tool SHALL NOT require authentication.

#### Scenario: List items with defaults
- **WHEN** an MCP client calls `list_items` with username "jan"
- **THEN** the tool returns up to 20 most recent items with their questions, answers, tags, and total count

#### Scenario: List items with pagination
- **WHEN** an MCP client calls `list_items` with username "jan", limit 10, and offset 10
- **THEN** the tool returns items 11-20 and the total count for pagination

### Requirement: get_item tool
The system SHALL provide a `get_item` MCP tool that retrieves a single item by its ID. The tool SHALL accept a required `username` and a required `item_id` parameter. The tool SHALL return the full item including question, answer, tags, and timestamps. The tool SHALL NOT require authentication.

#### Scenario: Get existing item
- **WHEN** an MCP client calls `get_item` with a valid username and item_id
- **THEN** the tool returns the complete item with question, answer, tags array, created_at, and updated_at

#### Scenario: Get nonexistent item
- **WHEN** an MCP client calls `get_item` with an item_id that does not exist for the given username
- **THEN** the tool returns an error indicating the item was not found

### Requirement: list_tags tool
The system SHALL provide a `list_tags` MCP tool that returns all tags for a user with their item counts. The tool SHALL accept a required `username` parameter. Tags SHALL be sorted alphabetically (case-insensitive). The tool SHALL NOT require authentication.

#### Scenario: List tags
- **WHEN** an MCP client calls `list_tags` with username "jan"
- **THEN** the tool returns all tags with name, color, and item_count, sorted alphabetically

#### Scenario: List tags for user with no tags
- **WHEN** an MCP client calls `list_tags` for a user who has no tags
- **THEN** the tool returns an empty array

### Requirement: create_item tool with authentication
The system SHALL provide a `create_item` MCP tool that creates a new knowledge base item. The tool SHALL accept a required `token` parameter (JWT), a required `question` parameter, an optional `answer` parameter, and an optional `tags` parameter (array of tag name strings). The tool SHALL verify the JWT token and create the item under the authenticated user. Tags that do not exist SHALL be created automatically.

#### Scenario: Create item with valid token
- **WHEN** an MCP client calls `create_item` with a valid JWT token, question "How to restart Docker?", answer "Use `docker restart`", and tags ["docker", "devops"]
- **THEN** the tool creates the item and returns the created item with its ID, question, answer, and resolved tags

#### Scenario: Create item with invalid token
- **WHEN** an MCP client calls `create_item` with an expired or invalid JWT token
- **THEN** the tool returns an error indicating authentication failed

#### Scenario: Create item with missing question
- **WHEN** an MCP client calls `create_item` with a valid token but no question
- **THEN** the tool returns a validation error (question is required)

### Requirement: API token endpoint
The system SHALL provide a `POST /api/auth/api-token` endpoint that generates long-lived JWT tokens for MCP and API usage. The endpoint SHALL require `username` and `password` for authentication, and a `days` parameter specifying the token validity period in days (minimum 1, maximum 365). The generated token SHALL use the same JWT secret and verification as regular tokens.

#### Scenario: Generate API token with valid credentials
- **WHEN** a client sends POST /api/auth/api-token with valid username, password, and days=90
- **THEN** the server returns a JWT token that expires in 90 days

#### Scenario: Generate API token with invalid credentials
- **WHEN** a client sends POST /api/auth/api-token with incorrect password
- **THEN** the server returns 401 Unauthorized

#### Scenario: Generate API token with invalid days
- **WHEN** a client sends POST /api/auth/api-token with days=0 or days=500
- **THEN** the server returns 400 Bad Request with a validation error

### Requirement: Tool response format
All MCP tools SHALL return results as text content in JSON format. Successful responses SHALL include the requested data. Error responses SHALL use the MCP `isError: true` flag with a descriptive error message.

#### Scenario: Successful tool response
- **WHEN** any tool completes successfully
- **THEN** the response contains `content` with type "text" and JSON-serialized data

#### Scenario: Error tool response
- **WHEN** any tool encounters an error (user not found, auth failed, validation error)
- **THEN** the response contains `isError: true` and a `content` entry with the error message
