## 1. MCP Tool Implementation

- [x] 1.1 Add `updateItem` function to `src/server/mcp/tools.ts` with JWT auth, item ownership check, partial update, and tag replacement
- [x] 1.2 Register the `update_item` tool in `src/server/mcp/server.ts` with item_id, question, answer, and tags parameters

## 2. Skill Documentation

- [x] 2.1 Update `.claude/skills/howcani/SKILL.md` to instruct the MCP client to offer updating an existing entry when new information is available

## 3. Spec Sync

- [x] 3.1 Merge the delta spec into `openspec/specs/mcp-server/spec.md` (add `update_item` requirement and scenarios)
