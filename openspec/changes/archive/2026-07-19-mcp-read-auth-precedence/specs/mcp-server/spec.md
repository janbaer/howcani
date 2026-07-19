## MODIFIED Requirements

### Requirement: MCP endpoint available on existing server
The system SHALL expose an MCP Streamable HTTP endpoint at `/mcp` on the existing Elysia server. The endpoint SHALL handle POST, GET, and DELETE HTTP methods for MCP protocol communication. The endpoint SHALL use stateless transport (no session persistence between requests). The endpoint SHALL NOT emit a wildcard `Access-Control-Allow-Origin: *` header; browser-based cross-origin access to `/mcp` is not supported.

#### Scenario: No wildcard CORS on responses
- **WHEN** any request (including an OPTIONS preflight) is made to `/mcp`
- **THEN** the response SHALL NOT include an `Access-Control-Allow-Origin: *` header

### Requirement: Default username via X-Username header
The MCP server SHALL resolve the username for read tools with the bearer token as the authoritative source. When a bearer token is present, the server SHALL verify it and use the token's username, ignoring any `X-Username` header. When a present token is invalid or expired, the server SHALL return an authentication error and SHALL NOT fall back to `X-Username`. When no token is present, the server SHALL use the `X-Username` header value (public read). When neither a token nor `X-Username` is present, the tool SHALL return an error indicating that a username is required. Read tools SHALL NOT accept a `username` argument.

#### Scenario: MCP client initializes connection
- **WHEN** an MCP client sends an initialize request to `POST /mcp`
- **THEN** the server responds with MCP protocol capabilities including the list of available tools

#### Scenario: MCP client sends tool call
- **WHEN** an MCP client sends a tools/call request to `POST /mcp`
- **THEN** the server executes the requested tool and returns the result in MCP content format

#### Scenario: Non-MCP request to /mcp
- **WHEN** a regular HTTP client sends an invalid request to `/mcp`
- **THEN** the server responds with a 400 status code

#### Scenario: Token is authoritative over X-Username
- **WHEN** a read tool is called with a valid bearer token for user `alice` and an `X-Username: bob` header
- **THEN** the tool SHALL resolve to `alice` and read alice's data, ignoring `X-Username`

#### Scenario: Public read via X-Username when no token
- **WHEN** a read tool is called with an `X-Username` header and no bearer token
- **THEN** the tool SHALL resolve to that username and return results without requiring authentication

#### Scenario: Invalid token is rejected
- **WHEN** a read tool is called with an invalid or expired bearer token, with or without an `X-Username` header
- **THEN** the tool SHALL return an authentication error and SHALL NOT fall back to `X-Username`

#### Scenario: Missing identity
- **WHEN** a read tool is called with neither a bearer token nor an `X-Username` header
- **THEN** the tool SHALL return an error indicating that a username is required

### Requirement: search_items tool
The system SHALL provide a `search_items` MCP tool that performs full-text search across a user's knowledge base items. The tool SHALL resolve the username per the "Default username via X-Username header" requirement. The tool schema SHALL NOT include a `username` argument. The tool SHALL accept an optional `query` string for FTS search, an optional `tags` parameter (comma-separated tag names for filtering), and an optional `limit` parameter (default 20, max 100). The tool SHALL NOT require authentication for a public (`X-Username`) read.

#### Scenario: Search by query
- **WHEN** an MCP client sends `X-Username: jan` and calls `search_items` with query "docker"
- **THEN** the tool returns items matching "docker" in question or answer fields, ranked by relevance

#### Scenario: Search by tags
- **WHEN** an MCP client sends `X-Username: jan` and calls `search_items` with tags "devops,linux"
- **THEN** the tool returns items tagged with "devops" or "linux"

#### Scenario: Search with query and tags combined
- **WHEN** an MCP client sends `X-Username: jan` and calls `search_items` with query "docker" and tags "devops"
- **THEN** the tool returns items matching "docker" that are also tagged "devops"

#### Scenario: Search for nonexistent username
- **WHEN** the `X-Username` header contains a username that does not exist
- **THEN** the tool returns an error indicating the user was not found

#### Scenario: Missing X-Username header
- **WHEN** no `X-Username` header is set and `search_items` is called
- **THEN** the tool returns `isError: true` with a message indicating username is required

### Requirement: list_items tool
The system SHALL provide a `list_items` MCP tool that returns a paginated list of a user's items sorted by creation date (newest first). The tool SHALL resolve the username per the "Default username via X-Username header" requirement. The tool schema SHALL NOT include a `username` argument. The tool SHALL accept an optional `limit` (default 20, max 100) and an optional `offset` (default 0). The tool SHALL NOT require authentication for a public (`X-Username`) read.

#### Scenario: List items with defaults
- **WHEN** an MCP client sends `X-Username: jan` and calls `list_items` with no arguments
- **THEN** the tool returns up to 20 most recent items with their questions, answers, tags, and total count

#### Scenario: List items with pagination
- **WHEN** an MCP client sends `X-Username: jan` and calls `list_items` with limit 10 and offset 10
- **THEN** the tool returns items 11-20 and the total count for pagination

#### Scenario: Missing X-Username header
- **WHEN** no `X-Username` header is set and `list_items` is called
- **THEN** the tool returns `isError: true` with a message indicating username is required

### Requirement: get_item tool
The system SHALL provide a `get_item` MCP tool that retrieves a single item by its ID. The tool SHALL resolve the username per the "Default username via X-Username header" requirement. The tool schema SHALL NOT include a `username` argument. The tool SHALL accept a required `item_id` parameter. The tool SHALL return the full item including question, answer, tags, and timestamps. The tool SHALL NOT require authentication for a public (`X-Username`) read.

#### Scenario: Get existing item
- **WHEN** an MCP client sends `X-Username: jan` and calls `get_item` with a valid item_id
- **THEN** the tool returns the complete item with question, answer, tags array, created_at, and updated_at

#### Scenario: Get nonexistent item
- **WHEN** an MCP client sends `X-Username: jan` and calls `get_item` with an item_id that does not exist
- **THEN** the tool returns an error indicating the item was not found

#### Scenario: Missing X-Username header
- **WHEN** no `X-Username` header is set and `get_item` is called
- **THEN** the tool returns `isError: true` with a message indicating username is required

### Requirement: list_tags tool
The system SHALL provide a `list_tags` MCP tool that returns all tags for a user with their item counts. The tool SHALL resolve the username per the "Default username via X-Username header" requirement. The tool schema SHALL NOT include a `username` argument. Tags SHALL be sorted alphabetically (case-insensitive). The tool SHALL NOT require authentication for a public (`X-Username`) read.

#### Scenario: List tags
- **WHEN** an MCP client sends `X-Username: jan` and calls `list_tags`
- **THEN** the tool returns all tags with name, color, and item_count, sorted alphabetically

#### Scenario: List tags for user with no tags
- **WHEN** the `X-Username` header identifies a user who has no tags
- **THEN** the tool returns an empty array

#### Scenario: Missing X-Username header
- **WHEN** no `X-Username` header is set and `list_tags` is called
- **THEN** the tool returns `isError: true` with a message indicating username is required

### Requirement: get_related_items tool
The system SHALL provide a `get_related_items` MCP tool that returns semantically similar items for a given item using KNN vector search on stored embeddings. The tool SHALL resolve the username per the "Default username via X-Username header" requirement. The tool schema SHALL NOT include a `username` argument. The tool SHALL accept a required `item_id` parameter. The tool SHALL return up to 5 items with their `id`, `question`, `answer`, and `tags`, excluding the requested item itself. The tool SHALL NOT require authentication for a public (`X-Username`) read.

#### Scenario: Returns related items
- **WHEN** an MCP client sends `X-Username: jan` and calls `get_related_items` with an item_id that has a stored embedding
- **THEN** the tool returns up to 5 semantically similar items with id, question, answer, and tags

#### Scenario: Returns empty array when item has no embedding
- **WHEN** an MCP client calls `get_related_items` for an item without a stored embedding
- **THEN** the tool returns `{ items: [] }` with no error

#### Scenario: Returns empty array when sqlite-vec is unavailable
- **WHEN** an MCP client calls `get_related_items` and the sqlite-vec extension is not loaded
- **THEN** the tool returns `{ items: [] }` with no error

#### Scenario: Returns error for non-existent item
- **WHEN** an MCP client sends `X-Username: jan` and calls `get_related_items` with an item_id that does not exist
- **THEN** the tool returns an MCP error response indicating the item was not found

#### Scenario: Returns error for non-existent user
- **WHEN** the `X-Username` header contains a username that does not exist
- **THEN** the tool returns an MCP error response indicating the user was not found

#### Scenario: No authentication required
- **WHEN** an MCP client calls `get_related_items` without an Authorization header
- **THEN** the tool executes successfully (public tool)

#### Scenario: Missing X-Username header
- **WHEN** no `X-Username` header is set and `get_related_items` is called
- **THEN** the tool returns `isError: true` with a message indicating username is required
