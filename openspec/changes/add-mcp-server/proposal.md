## Why

The HowCanI knowledge base is only accessible through its web UI. Adding an MCP (Model Context Protocol) server endpoint allows any AI client — Claude Desktop, Claude Code, or other MCP-compatible tools — to search, browse, and add to the knowledge base directly from conversations. This turns HowCanI into a personal knowledge layer for AI assistants.

## What Changes

- Add MCP server integrated into the existing Elysia HTTP server using Streamable HTTP transport
- Expose read-only tools for searching items, listing items, getting item details, and listing tags — accessible without authentication by specifying a username
- Expose a `create_item` tool that requires JWT authentication to add new knowledge base entries
- Add `@modelcontextprotocol/sdk` as a dependency
- Add `/mcp` endpoint to the existing server for MCP client connections

## Capabilities

### New Capabilities
- `mcp-server`: MCP server endpoint with Streamable HTTP transport, tool definitions (search_items, list_items, get_item, list_tags, create_item), authentication handling for write operations, and integration with existing repositories

### Modified Capabilities

_(none — existing API routes, database schema, and services remain unchanged)_

## Impact

- **Dependencies**: New package `@modelcontextprotocol/sdk` (includes server + transport modules)
- **Server**: New `/mcp` route on the Elysia server, new `src/server/mcp/` module
- **Database**: No schema changes — reuses existing repositories directly
- **Auth**: Write tools reuse existing JWT verification; read tools bypass auth using username-scoped public access
- **Deployment**: Docker image gains MCP capability on the same port, no additional services needed
