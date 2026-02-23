## Context

The MCP server exposes the howcani knowledge base to AI clients. It already provides `search_items`, `list_items`, `get_item`, `list_tags`, `create_item`, and `update_item`. All tools in `tools.ts` bypass the service layer and call repositories directly — this is intentional for the MCP layer.

The `ItemRepository.findRelated(itemId, userId, limit)` method was introduced in the related-items-panel feature. It performs KNN vector search on `vec_items` and returns up to `limit` semantically similar items, excluding the source item. When sqlite-vec is unavailable or the item has no embedding, it returns an empty array gracefully.

## Goals / Non-Goals

**Goals:**
- Expose `get_related_items` as a new MCP tool
- Reuse `ItemRepository.findRelated()` — no new repository code needed
- Keep the tool public (no auth required), consistent with other read tools
- Return items with tags, consistent with other MCP item responses

**Non-Goals:**
- Changing the limit (5 is fixed at the repository layer, consistent with the web UI)
- Supporting per-tool limits for related items
- Adding a new REST API endpoint (already done in the related-items-panel feature)

## Decisions

### Reuse `ItemRepository.findRelated()` directly

The MCP layer calls repositories directly, bypassing services. `findRelated` already handles graceful degradation (no embedding, vec unavailable), so no service-layer wrapping is needed. The tool validates user existence via the shared `resolveUser()` helper in `tools.ts`, then validates the item itself before calling `findRelated`.

**Alternative considered**: Calling `itemService.getRelatedItems()` — rejected because the MCP layer's established pattern is direct repository access.

### Item must exist — return error if not found

If the requested item does not exist (or belongs to a different user), the tool returns a MCP error response. This is consistent with `get_item` behavior.

**Alternative considered**: Returning empty array — rejected to give callers a clear signal when they pass an invalid ID.

### Attach tags to results

Each related item in the response includes its `tags` array, consistent with how `get_item`, `list_items`, and `search_items` all return items with tags attached via `attachTags()`.

## Risks / Trade-offs

- **sqlite-vec unavailable** → `findRelated` returns `[]`; tool returns `{ items: [] }`. No special error handling needed.
- **Item has no embedding** → same as above, empty result. Not an error condition.

## Open Questions

None — the implementation path is clear.
