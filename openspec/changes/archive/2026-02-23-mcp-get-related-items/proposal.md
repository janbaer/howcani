## Why

The web UI now surfaces semantically similar items on the detail page using KNN vector search. MCP clients — including AI assistants — should be able to discover related knowledge in the same way, enabling richer context retrieval workflows.

## What Changes

- Add a `get_related_items` MCP tool that returns up to 5 semantically similar items for a given item ID
- The tool uses the existing `ItemRepository.findRelated()` method (introduced in the related-items-panel feature)
- No authentication required — consistent with other read-only MCP tools

## Capabilities

### New Capabilities

- `mcp-get-related-items`: MCP tool for retrieving semantically similar items via KNN vector search

### Modified Capabilities

- `mcp-server`: Adding the `get_related_items` tool to the existing MCP server spec

## Impact

- `src/server/mcp/tools.ts` — new `getRelatedItems` export function
- `src/server/mcp/server.ts` — register the new tool with schema and handler
- `openspec/specs/mcp-server/spec.md` — new requirement for `get_related_items` tool
