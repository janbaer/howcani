## Why

All MCP read tools require an explicit `username` argument on every call. When the MCP server is configured for a single user (e.g. an AI agent with read-only access), the LLM must know and supply the username each time, which is redundant and error-prone. An `X-Username` HTTP header lets the MCP client supply the default username once at the connection level — transparently, without burdening the LLM.

## What Changes

- The MCP server reads the `X-Username` request header in `handleMcpRequest()` and passes it to `createMcpServer()` as `defaultUsername`
- `username` becomes optional in all five read tool schemas: `search_items`, `list_items`, `get_item`, `list_tags`, `get_related_items`
- When no `username` arg is provided, the value from `X-Username` is used
- When neither is present, the tool returns a descriptive error
- Write tools (`create_item`, `update_item`) are unaffected — they authenticate via Bearer token

## Capabilities

### New Capabilities

- `mcp-default-username`: MCP read tools accept an optional `username` arg; if omitted, the value from the `X-Username` request header is used as the default

### Modified Capabilities

- `mcp-server`: Read tool schemas change — `username` becomes optional

## Impact

- `src/server/mcp/index.ts` — reads `X-Username` header, passes it to `createMcpServer()`, adds CORS headers to all responses and handles OPTIONS preflight
- `src/server/mcp/server.ts` — schema and handler changes for all read tools
- `src/server/mcp/server.spec.ts` — new test file covering both header-present and header-absent cases
- No API routes, database, or client changes
