## Context

All five MCP read tools require the caller to supply a `username` argument on every invocation. When an MCP client is configured for a single user (the common case for personal knowledge bases or read-only AI agents), the LLM must know and repeat the username on each call. Nobody would naturally phrase a question as "how do I restart nginx, the user is jan" — the username is infrastructure context, not conversational content.

The MCP server is stateless — a new server instance is created per request in `handleMcpRequest()`. The request object is already available there, so request headers are a natural place to carry the default username.

## Goals / Non-Goals

**Goals:**
- Read the `X-Username` request header in `handleMcpRequest()` and pass it to `createMcpServer()` as `defaultUsername`
- Make `username` optional in all five read tool schemas
- Fall back to the header value when `username` is not provided by the caller
- Return a clear error when `username` is omitted and no header is set
- Support a `defaultUsername` option on `createMcpServer()` for programmatic use and testability

**Non-Goals:**
- Changing write tool behaviour (`create_item`, `update_item` use Bearer token auth)
- Supporting per-tool or per-call username injection beyond tool arg and header
- Changing the HTTP API

## Decisions

### X-Username header over env var

An HTTP header is configured on the MCP client side (e.g. Claude Code's `mcpServers` config), not the server side. This means:
- Multiple clients/agents with different usernames can hit the same server
- No server restart needed to change the username
- Testable directly in MCP Inspector via its custom headers panel

**Alternative considered**: `HOWCANI_USERNAME` environment variable. Rejected — it requires access to the server process and restarts to change, and is harder to test interactively.

### Resolution order: arg > header > error

Username is resolved as: explicit tool arg → `X-Username` header → error. No further fallbacks.

The `defaultUsername` option on `createMcpServer()` exists solely to decouple tests from HTTP — `index.ts` populates it from the header; tests pass it directly.

### Always-optional schema

The `username` Zod schema is always `.optional()`. Presence validation is deferred to the handler, which checks the resolved value. This avoids coupling schema construction to runtime state.

### CORS for browser-based clients

The `/mcp` endpoint requires CORS headers so browser-based clients (MCP Inspector, future web integrations) can connect cross-origin. The server handles `OPTIONS` preflight by reflecting back the `Access-Control-Request-Headers` value from the request, and adds `Access-Control-Allow-Origin: *` to all MCP responses.

CORS is enabled for all environments, not just development — the overhead is negligible and it allows MCP Inspector to be used against any environment for debugging.

**Alternative considered**: Enable CORS in development only. Rejected — adds complexity for no real security benefit, since read tools are already public and write tools require a Bearer token regardless.

## Risks / Trade-offs

- [Trade-off] `X-Username` is unauthenticated — any caller can set an arbitrary username. This is acceptable for read-only tools (data is not sensitive), and write tools already require a Bearer token.
- [No risk] Existing callers supplying `username` explicitly are fully backwards compatible.
