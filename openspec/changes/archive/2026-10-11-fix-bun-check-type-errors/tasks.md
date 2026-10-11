## 1. Config

- [x] 1.1 Remove `baseUrl` and add `allowImportingTsExtensions` in `tsconfig.json`

## 2. Server

- [x] 2.1 Type the MCP tool args in `src/server/mcp/tools.ts` and fix the `{ item, distance }[]` call site
- [x] 2.2 Fix `item.repository.ts` (number vs string) and any remaining server errors

## 3. Client

- [x] 3.1 Fix the type errors in `item-detail.store.svelte.ts` and `item-list.store.svelte.ts`

## 4. Specs

- [x] 4.1 Fix `result.content` and argument types in `mcp/server.spec.ts`
- [x] 4.2 Make the `fetch` mocks satisfy `typeof fetch` in the llamacpp provider and embedding service specs
- [x] 4.3 Fix the scheduler, item service and user service spec fixtures

## 5. Gate

- [x] 5.1 Add `bun check` to the pre-push hook in `package.json`
- [x] 5.2 Verify `bun check`, `bun run lint`, `bun run build` and `bun test --isolate` all pass
