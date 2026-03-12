## Why

With `X-Username` header support in place, the explicit `username` argument on each MCP read tool is redundant — it duplicates a mechanism already handled at the transport level. Removing it simplifies the tool schemas, reduces noise in LLM prompts, and makes the contract clearer: the header is the single source of user identity for read tools.

## What Changes

- **BREAKING** `username` argument removed from all five read tool schemas: `search_items`, `list_items`, `get_item`, `list_tags`, `get_related_items`
- Username is resolved exclusively from the `X-Username` request header (via `defaultUsername` option on `createMcpServer()`)
- Error returned when neither the argument nor the header is present (unchanged behavior, but now only triggered via header absence)
- `resolveUsername()` helper simplified — no longer needs to merge arg and header, header is the only source
- Tests updated: `username` arg removed from all test calls; coverage for header-resolution path retained

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `mcp-server`: All five read tool schemas change — `username` argument removed entirely

## Impact

- `src/server/mcp/server.ts` — schema and handler changes for all five read tools
- `src/server/mcp/server.spec.ts` — test calls updated (remove `username` arg)
- `openspec/specs/mcp-server/spec.md` — canonical spec updated
- **Breaking** for any caller currently passing `username` explicitly — they must migrate to the `X-Username` header
