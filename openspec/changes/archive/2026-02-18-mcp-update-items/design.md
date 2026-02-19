## Context

The MCP server already has a `create_item` tool with JWT authentication via `extractBearerToken` + `verifyToken`. The `ItemRepository` already exposes an `update()` method that accepts optional `question` and `answer` fields. The `TagRepository.setItemTags()` method is already used in `createItem` and replaces all tags atomically.

The update tool must verify the item belongs to the authenticated user before modifying it, using `findByIdAndUserId`.

## Goals / Non-Goals

**Goals:**
- Add `update_item` tool following the exact same auth pattern as `create_item`
- Allow partial updates: any combination of question, answer, and tags may be provided
- Tags, when supplied, replace the existing tag set (same behavior as REST API)
- Update the howcani SKILL.md to guide MCP clients to offer updates

**Non-Goals:**
- No new REST endpoints (update already exists at `PATCH /api/items/:id`)
- No changes to authentication mechanism

## Design

### update_item tool parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `item_id` | string | yes | ID of the item to update |
| `question` | string | no | New question text |
| `answer` | string | no | New answer text |
| `tags` | string[] | no | Full replacement tag list (auto-created if new) |

At least one of `question`, `answer`, or `tags` must be supplied (enforced at runtime, not schema level, to keep the schema simple — same approach as `create_item`).

### Implementation

`updateItem` in `tools.ts`:
1. Extract and verify bearer token (same as `createItem`)
2. Resolve the item with `findByIdAndUserId(item_id, userId)` — returns `null` if not found or not owned
3. Call `itemRepo.update(item_id, { question, answer })`
4. If `tags` provided, resolve/create tags then call `tagRepo.setItemTags(item_id, tagIds)`
5. Return the updated item with tags attached

Register in `server.ts` alongside existing tools, passing `authHeader` from options.

### SKILL.md update

Add a section instructing the MCP client (Claude via howcani skill) to:
- After answering questions, check if a related item already exists
- Offer to update the existing entry (not just create a new one) when new information is available
