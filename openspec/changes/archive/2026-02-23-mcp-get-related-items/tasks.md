## 1. MCP Tool Implementation

- [x] 1.1 Add `getRelatedItems(args: { username: string; item_id: string })` function to `src/server/mcp/tools.ts` that calls `resolveUser`, validates the item exists, calls `itemRepo.findRelated`, attaches tags, and returns `success({ items })`
- [x] 1.2 Register the `get_related_items` tool in `src/server/mcp/server.ts` with username and item_id parameters and the `getRelatedItems` handler

## 2. Tests

- [x] 2.1 Add MCP tool tests for `getRelatedItems` in an appropriate test file covering: returns related items, returns empty array when no embedding, returns error for unknown item, returns error for unknown user
