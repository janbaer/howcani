# MCP Server Setup

The HowCanI MCP server exposes a [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http) endpoint at `/mcp`.

## Endpoint

```
POST/GET/DELETE <base-url>/mcp
```

## Authentication

| Access | Method |
|--------|--------|
| Read tools | No auth required. Set `X-Username` header to identify the user. |
| Write tools (`create_item`, `update_item`) | `Authorization: Bearer <token>` required. Generate a token via `POST /api/auth/api-token`. |

## Configuring the default user

Read tools accept an optional `username` argument. When omitted, the server falls back to the value of the `X-Username` request header. Configure this once in your MCP client so the LLM never needs to supply it explicitly.

## Client Configuration

### Claude Code (`~/.claude/settings.json`)

```json
{
  "mcpServers": {
    "howcani": {
      "type": "http",
      "url": "https://howcani.example.com/mcp",
      "headers": {
        "X-Username": "jan"
      }
    }
  }
}
```

For read+write access, add the `Authorization` header:

```json
{
  "mcpServers": {
    "howcani": {
      "type": "http",
      "url": "https://howcani.example.com/mcp",
      "headers": {
        "X-Username": "jan",
        "Authorization": "Bearer <your-api-token>"
      }
    }
  }
}
```

### AI agent on a server (read-only)

Same config as above, without the `Authorization` header. The `X-Username` header identifies which user's knowledge base to query.

### MCP Inspector (testing)

1. Set **Transport Type** to `Streamable HTTP`
2. Set **URL** to `http://localhost:3000/mcp`
3. Under **Custom Headers**, add `X-Username` → `jan`
4. Click **Connect**

## Generating an API token

```bash
http POST <base-url>/api/auth/api-token \
  username=jan \
  password=<your-password> \
  days:=90
```

The returned token is valid for 90 days and can be used in the `Authorization: Bearer` header for write tools.

## Testing with HTTPie

**Search items:**

```bash
http POST localhost:3000/mcp \
  X-Username:jan \
  Accept:'application/json, text/event-stream' \
  jsonrpc="2.0" \
  id:=1 \
  method="tools/call" \
  params:='{"name":"search_items","arguments":{"query":"docker"}}'
```

**List items:**

```bash
http POST localhost:3000/mcp \
  X-Username:jan \
  Accept:'application/json, text/event-stream' \
  jsonrpc="2.0" \
  id:=1 \
  method="tools/call" \
  params:='{"name":"list_items","arguments":{}}'
```

**List tags:**

```bash
http POST localhost:3000/mcp \
  X-Username:jan \
  Accept:'application/json, text/event-stream' \
  jsonrpc="2.0" \
  id:=1 \
  method="tools/call" \
  params:='{"name":"list_tags","arguments":{}}'
```

**Create item (requires token):**

```bash
http POST localhost:3000/mcp \
  Authorization:'Bearer <token>' \
  Accept:'application/json, text/event-stream' \
  jsonrpc="2.0" \
  id:=1 \
  method="tools/call" \
  params:='{"name":"create_item","arguments":{"question":"How to restart nginx?","answer":"Use sudo systemctl restart nginx","tags":["linux","ops"]}}'
```
