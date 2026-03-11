## MODIFIED Requirements

### Requirement: search_items tool
The system SHALL provide a `search_items` MCP tool that performs full-text search across a user's knowledge base items. The tool SHALL accept an optional `username` parameter (defaults to the value of the `X-Username` request header), an optional `query` string for FTS search, an optional `tags` parameter (comma-separated tag names for filtering), and an optional `limit` parameter (default 20, max 100). The tool SHALL NOT require authentication.

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

#### Scenario: Search without username when X-Username header is set
- **WHEN** the MCP client sends `X-Username: jan` and calls `search_items` without a `username` argument
- **THEN** the tool uses "jan" and returns results for that user

### Requirement: list_items tool
The system SHALL provide a `list_items` MCP tool that returns a paginated list of a user's items sorted by creation date (newest first). The tool SHALL accept an optional `username` parameter (defaults to the value of the `X-Username` request header), an optional `limit` (default 20, max 100), and an optional `offset` (default 0). The tool SHALL NOT require authentication.

#### Scenario: List items with defaults
- **WHEN** an MCP client calls `list_items` with username "jan"
- **THEN** the tool returns up to 20 most recent items with their questions, answers, tags, and total count

#### Scenario: List items with pagination
- **WHEN** an MCP client calls `list_items` with username "jan", limit 10, and offset 10
- **THEN** the tool returns items 11-20 and the total count for pagination

### Requirement: get_item tool
The system SHALL provide a `get_item` MCP tool that retrieves a single item by its ID. The tool SHALL accept an optional `username` parameter (defaults to the value of the `X-Username` request header) and a required `item_id` parameter. The tool SHALL return the full item including question, answer, tags, and timestamps. The tool SHALL NOT require authentication.

#### Scenario: Get existing item
- **WHEN** an MCP client calls `get_item` with a valid username and item_id
- **THEN** the tool returns the complete item with question, answer, tags array, created_at, and updated_at

#### Scenario: Get nonexistent item
- **WHEN** an MCP client calls `get_item` with an item_id that does not exist for the given username
- **THEN** the tool returns an error indicating the item was not found

### Requirement: list_tags tool
The system SHALL provide a `list_tags` MCP tool that returns all tags for a user with their item counts. The tool SHALL accept an optional `username` parameter (defaults to the value of the `X-Username` request header). Tags SHALL be sorted alphabetically (case-insensitive). The tool SHALL NOT require authentication.

#### Scenario: List tags
- **WHEN** an MCP client calls `list_tags` with username "jan"
- **THEN** the tool returns all tags with name, color, and item_count, sorted alphabetically

#### Scenario: List tags for user with no tags
- **WHEN** an MCP client calls `list_tags` for a user who has no tags
- **THEN** the tool returns an empty array

### Requirement: get_related_items tool
The system SHALL provide a `get_related_items` MCP tool that returns semantically similar items for a given item using KNN vector search on stored embeddings. The tool SHALL accept an optional `username` parameter (defaults to the value of the `X-Username` request header) and a required `item_id` parameter. The tool SHALL return up to 5 items with their `id`, `question`, `answer`, and `tags`, excluding the requested item itself. The tool SHALL NOT require authentication.

#### Scenario: Returns related items
- **WHEN** an MCP client calls `get_related_items` with a valid username and an item_id that has a stored embedding
- **THEN** the tool returns up to 5 semantically similar items with id, question, answer, and tags

#### Scenario: Returns empty array when item has no embedding
- **WHEN** an MCP client calls `get_related_items` for an item without a stored embedding
- **THEN** the tool returns `{ items: [] }` with no error

#### Scenario: Returns empty array when sqlite-vec is unavailable
- **WHEN** an MCP client calls `get_related_items` and the sqlite-vec extension is not loaded
- **THEN** the tool returns `{ items: [] }` with no error

#### Scenario: Returns error for non-existent item
- **WHEN** an MCP client calls `get_related_items` with an item_id that does not exist for the given username
- **THEN** the tool returns an MCP error response indicating the item was not found

#### Scenario: Returns error for non-existent user
- **WHEN** an MCP client calls `get_related_items` with a username that does not exist
- **THEN** the tool returns an MCP error response indicating the user was not found

#### Scenario: No authentication required
- **WHEN** an MCP client calls `get_related_items` without an Authorization header
- **THEN** the tool executes successfully (public tool)
