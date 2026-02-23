## ADDED Requirements

### Requirement: get_related_items tool
The system SHALL provide a `get_related_items` MCP tool that returns semantically similar items for a given item using KNN vector search on stored embeddings. The tool SHALL accept a required `username` parameter and a required `item_id` parameter. The tool SHALL return up to 5 items with their `id`, `question`, `answer`, and `tags`, excluding the requested item itself. The tool SHALL NOT require authentication.

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
