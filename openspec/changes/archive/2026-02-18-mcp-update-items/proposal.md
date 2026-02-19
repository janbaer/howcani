## Why

The builtin MCP server supports creating items but has no way to update them. MCP clients (like Claude via the howcani skill) accumulate new information in conversations and should be able to offer to update an existing entry rather than always creating a duplicate.

## What Changes

- Add `update_item` MCP tool that updates an existing item's question, answer, and/or tags
- Update the `howcani` skill (SKILL.md) to instruct the MCP client to offer an update when new information arrives for an existing entry

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `mcp-server`: Add `update_item` tool requirement alongside the existing `create_item` tool

## Impact

- `src/server/mcp/tools.ts` — new `updateItem` function
- `src/server/mcp/server.ts` — register the new `update_item` tool
- `.claude/skills/howcani/SKILL.md` — document the update workflow for MCP clients
- `openspec/specs/mcp-server/spec.md` — new requirement + scenarios for `update_item`
