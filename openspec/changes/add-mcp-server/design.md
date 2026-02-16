## Context

HowCanI is a personal knowledge base built with Elysia (Bun) serving both a Svelte 5 SPA and REST API endpoints. The existing API has full CRUD for items and tags with JWT authentication. The server runs on Bun which uses Web Standard Request/Response APIs.

The MCP TypeScript SDK v2 provides `WebStandardStreamableHTTPServerTransport` specifically for web-standard environments (Bun, Deno, Cloudflare Workers), making it a natural fit for Elysia integration.

## Goals / Non-Goals

**Goals:**
- Expose HowCanI items and tags to any MCP-compatible AI client via Streamable HTTP transport
- Read operations (search, list, get) work without auth using a username parameter
- Write operations (create_item) require JWT token authentication
- Integrate into the existing Elysia server on the same port — no separate process
- Reuse existing repositories directly for database access

**Non-Goals:**
- SSE or stdio transport (only Streamable HTTP)
- MCP resources or prompt templates (tools only)
- Update or delete operations via MCP
- Per-session state or caching in the MCP layer (stateless per request)
- Admin or user management tools

## Decisions

### 1. Transport: `WebStandardStreamableHTTPServerTransport` (stateless)

Use the MCP SDK's web-standard transport with `sessionIdGenerator: undefined` (stateless mode). Each request creates a fresh transport instance, processes the MCP message, and returns. This avoids session management complexity and fits the read-heavy, tool-based usage pattern.

**Alternative considered**: Stateful sessions with session ID tracking. Rejected because MCP tools here are simple request/response — no subscriptions, no long-running operations, no need for session affinity.

### 2. Integration: Raw Elysia route handler

Elysia's `all()` route handler receives the standard `Request` object. Pass this directly to `transport.handleRequest(request)`. This mirrors the Hono integration pattern from the MCP SDK docs.

The MCP endpoint lives at `POST /mcp` and `GET /mcp` (for SSE stream) and `DELETE /mcp` (for session cleanup). Using `all('/mcp', ...)` covers all methods.

**Alternative considered**: Using `@modelcontextprotocol/hono` middleware since Elysia and Hono share similar web-standard patterns. Rejected to avoid an unnecessary Hono dependency — the raw transport API is simple enough.

### 3. Module structure: `src/server/mcp/`

```
src/server/mcp/
  server.ts     — McpServer instance, tool registrations
  tools.ts      — Tool handler implementations
  index.ts      — Elysia plugin that mounts /mcp route
```

`server.ts` creates the `McpServer` and registers all 5 tools with Zod v4 schemas. `tools.ts` contains the handler logic that calls repositories. `index.ts` exports an Elysia plugin that wires the transport to the route.

### 4. Auth: JWT token as tool parameter for write operations

Read tools accept a `username` parameter and query public data. The `create_item` tool accepts an additional `token` parameter (JWT). The handler verifies the token using the existing `verifyToken()` function from `src/server/auth/jwt.ts` and extracts the userId for the repository call.

**Alternative considered**: Auth via HTTP headers on the MCP transport. Rejected because MCP clients send the auth token configuration varies — passing it as a tool parameter is explicit and works with any MCP client without special header configuration.

### 5. Repository access: Direct instantiation

Tools instantiate repositories directly (`new ItemRepository()`, `new TagRepository()`, `new UserRepository()`) rather than going through the session-scoped service layer. The service layer adds session management, caching, and transaction coordination that MCP's simple tool calls don't need.

**Alternative considered**: Reusing the service layer (ItemService, TagService). Rejected because services require `initSession()` and are designed for authenticated web sessions. The repository layer provides the exact query methods needed without session overhead.

### 6. SDK packages

Install `@modelcontextprotocol/server` which includes `McpServer`, `WebStandardStreamableHTTPServerTransport`, and the `zod` peer dependency. The SDK v2 uses `zod/v4` for schema definitions.

## Risks / Trade-offs

**[Elysia body parsing conflict]** → Elysia may pre-parse the request body as JSON before the MCP transport reads it. Mitigation: Configure the `/mcp` route to skip Elysia's body parser, or pass the pre-parsed body to the transport's `handleRequest()` method (similar to the Express pattern in the SDK docs).

**[No rate limiting]** → MCP endpoint has no request throttling. Acceptable for a personal/small-team knowledge base. Can be added later via Elysia middleware if needed.

**[Token in tool parameter]** → JWT token is passed as a string parameter in the MCP tool call, visible in MCP client logs. Acceptable trade-off since this is a personal tool and the token is already handled client-side. Long-lived tokens (up to 365 days) can be generated via the API token endpoint.

**[SDK compatibility with Bun]** → The MCP TypeScript SDK targets Node.js primarily. `WebStandardStreamableHTTPServerTransport` uses web-standard APIs that Bun supports. Risk is low but untested edge cases may exist. Mitigation: Test during implementation.
