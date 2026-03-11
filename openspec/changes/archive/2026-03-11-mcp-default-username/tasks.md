## 1. Server — username resolution

- [x] 1.1 Add `defaultUsername` to `McpServerOptions` interface in `server.ts`
- [x] 1.2 Add `resolveUsername()` helper and `missingUsernameError()` helper inside `createMcpServer()`
- [x] 1.3 Read `X-Username` request header in `handleMcpRequest()` in `index.ts` and pass as `defaultUsername` to `createMcpServer()`

## 2. Read tool schema updates

- [x] 2.1 Make `username` optional in `search_items` schema; update description to mention X-Username header fallback
- [x] 2.2 Make `username` optional in `list_items` schema; update description
- [x] 2.3 Make `username` optional in `get_item` schema; update description
- [x] 2.4 Make `username` optional in `list_tags` schema; update description
- [x] 2.5 Make `username` optional in `get_related_items` schema; update description

## 3. Read tool handler updates

- [x] 3.1 Update `search_items` handler to resolve username via helper; return error if unresolved
- [x] 3.2 Update `list_items` handler to resolve username via helper; return error if unresolved
- [x] 3.3 Update `get_item` handler to resolve username via helper; return error if unresolved
- [x] 3.4 Update `list_tags` handler to resolve username via helper; return error if unresolved
- [x] 3.5 Update `get_related_items` handler to resolve username via helper; return error if unresolved

## 4. CORS

- [x] 4.1 Handle OPTIONS preflight in `handleMcpRequest()` — reflect `Access-Control-Request-Headers` back and return 204
- [x] 4.2 Wrap MCP response to add CORS headers (`Access-Control-Allow-Origin: *`, methods, headers)

## 5. Tests

- [x] 5.1 Create `server.spec.ts` with in-memory MCP transport using `InMemoryTransport.createLinkedPair()`
- [x] 5.2 Test: `defaultUsername` option (populated from X-Username header) resolves username when arg is omitted
- [x] 5.3 Test: explicit `username` arg takes precedence over `defaultUsername`/header
- [x] 5.4 Test: error returned when no username and no header set
- [x] 5.5 Test: `search_items` resolves from header-derived defaultUsername
- [x] 5.6 Test: `list_tags` resolves from header-derived defaultUsername
