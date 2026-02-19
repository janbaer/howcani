## ADDED Requirements

### Requirement: update_item tool with authentication
The system SHALL provide an `update_item` MCP tool that updates an existing knowledge base item. The tool SHALL accept a required `item_id` parameter, an optional `question` parameter, an optional `answer` parameter, and an optional `tags` parameter (array of tag name strings). The tool SHALL verify the JWT token from the Authorization header, confirm the item belongs to the authenticated user, and apply the partial update. When `tags` is provided, the existing tag set SHALL be fully replaced. Tags that do not exist SHALL be created automatically.

#### Scenario: Update item question and answer
- **WHEN** an MCP client calls `update_item` with a valid JWT token, a valid `item_id`, and new `question` and `answer` values
- **THEN** the tool updates the item and returns the updated item with its ID, question, answer, and resolved tags

#### Scenario: Update item tags only
- **WHEN** an MCP client calls `update_item` with a valid JWT token, a valid `item_id`, and a new `tags` array
- **THEN** the tool replaces the item's tags with the new set (creating any new tags) and returns the updated item

#### Scenario: Update item with invalid token
- **WHEN** an MCP client calls `update_item` with an expired or invalid JWT token
- **THEN** the tool returns an error indicating authentication failed

#### Scenario: Update item not owned by user
- **WHEN** an MCP client calls `update_item` with a valid token but an `item_id` that belongs to a different user
- **THEN** the tool returns an error indicating the item was not found
