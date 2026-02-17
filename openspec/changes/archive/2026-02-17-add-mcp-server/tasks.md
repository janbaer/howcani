## 1. Setup

- [x] 1.1 Install `@modelcontextprotocol/server` package with Bun
- [x] 1.2 Create module directory `src/server/mcp/`

## 2. MCP Server and Tools

- [x] 2.1 Create `src/server/mcp/server.ts` — instantiate McpServer, register all 5 tools with Zod v4 input schemas (search_items, list_items, get_item, list_tags, create_item)
- [x] 2.2 Create `src/server/mcp/tools.ts` — implement tool handlers using repositories (UserRepository, ItemRepository, TagRepository) with JSON text responses and isError flag for errors

## 3. API Token Endpoint

- [x] 3.1 Add `POST /api/auth/api-token` route in auth routes — accepts username, password, and days (1-365), verifies credentials, returns a long-lived JWT token with configurable expiry
- [x] 3.2 Add `createApiToken` function to jwt.ts that accepts a custom expiration in days

## 4. Elysia Integration

- [x] 4.1 Create `src/server/mcp/index.ts` — Elysia plugin that mounts `/mcp` route using WebStandardStreamableHTTPServerTransport in stateless mode, passing raw Request to transport.handleRequest()
- [x] 4.2 Register MCP plugin in `src/server/index.ts`

## 5. Verification

- [x] 5.1 Test MCP endpoint with a local MCP client or curl — verify initialize handshake, tool listing, and tool execution for all 5 tools
- [x] 5.2 Test create_item with valid and invalid JWT tokens
- [x] 5.3 Test API token endpoint — generate a long-lived token and use it with create_item
