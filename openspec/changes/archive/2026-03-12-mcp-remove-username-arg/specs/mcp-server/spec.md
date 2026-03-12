## MODIFIED Requirements

### Requirement: search_items tool
The system SHALL provide a `search_items` MCP tool that performs full-text search across a user's knowledge base items. The tool SHALL resolve the username exclusively from the `X-Username` request header — the tool schema SHALL NOT include a `username` argument. The tool SHALL accept an optional `query` string for FTS search, an optional `tags` parameter (comma-separated tag names for filtering), and an optional `limit` parameter (default 20, max 100). The tool SHALL NOT require authentication. When no `X-Username` header is present, the tool SHALL return an error indicating that a username is required.

#### Scenario: Search by query with X-Username header
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
The system SHALL provide a `list_items` MCP tool that returns a paginated list of a user's items sorted by creation date (newest first). The tool SHALL resolve the username exclusively from the `X-Username` request header — the tool schema SHALL NOT include a `username` argument. The tool SHALL accept an optional `limit` (default 20, max 100) and an optional `offset` (default 0). The tool SHALL NOT require authentication.

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
The system SHALL provide a `get_item` MCP tool that retrieves a single item by its ID. The tool SHALL resolve the username exclusively from the `X-Username` request header — the tool schema SHALL NOT include a `username` argument. The tool SHALL accept a required `item_id` parameter. The tool SHALL return the full item including question, answer, tags, and timestamps. The tool SHALL NOT require authentication.

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
The system SHALL provide a `list_tags` MCP tool that returns all tags for a user with their item counts. The tool SHALL resolve the username exclusively from the `X-Username` request header — the tool schema SHALL NOT include a `username` argument. Tags SHALL be sorted alphabetically (case-insensitive). The tool SHALL NOT require authentication.

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
The system SHALL provide a `get_related_items` MCP tool that returns semantically similar items for a given item using KNN vector search on stored embeddings. The tool SHALL resolve the username exclusively from the `X-Username` request header — the tool schema SHALL NOT include a `username` argument. The tool SHALL accept a required `item_id` parameter. The tool SHALL return up to 5 items with their `id`, `question`, `answer`, and `tags`, excluding the requested item itself. The tool SHALL NOT require authentication.

#### Scenario: Returns related items
- **WHEN** an MCP client sends `X-Username: jan` and calls `get_related_items` with an item_id that has a stored embedding
- **THEN** the tool returns up to 5 semantically similar items with id, question, answer, and tags

#### Scenario: Returns empty array when item has no embedding
- **WHEN** an MCP client calls `get_related_items` for an item without a stored embedding
- **THEN** the tool returns `{ items: [] }` with no error

#### Scenario: Missing X-Username header
- **WHEN** no `X-Username` header is set and `get_related_items` is called
- **THEN** the tool returns `isError: true` with a message indicating username is required
