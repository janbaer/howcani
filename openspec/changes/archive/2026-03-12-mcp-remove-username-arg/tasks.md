## 1. server.ts — remove username from schemas and simplify resolveUsername

- [x] 1.1 Remove `username` from `search_items` schema
- [x] 1.2 Remove `username` from `list_items` schema
- [x] 1.3 Remove `username` from `get_item` schema
- [x] 1.4 Remove `username` from `list_tags` schema
- [x] 1.5 Remove `username` from `get_related_items` schema
- [x] 1.6 Simplify `resolveUsername()` to a zero-arg function returning `defaultUsername ?? null`

## 2. server.spec.ts — update tests

- [x] 2.1 Remove `username` argument from all test tool calls
- [x] 2.2 Verify existing tests still pass (header-resolution path unchanged)

## 3. Canonical spec update

- [x] 3.1 Update `openspec/specs/mcp-server/spec.md` to reflect removed `username` argument from all five read tools
