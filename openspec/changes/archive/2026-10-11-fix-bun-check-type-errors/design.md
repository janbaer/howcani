## Context

`bun check` runs the TypeScript compiler over the `include` globs of `tsconfig.json`. Errors by kind: 13x TS5097 (`.ts` import extensions), 11x TS2345 and 9x TS18046 (`unknown` MCP tool args and `result.content`), 7x TS2741 (`fetch` mocks lack `preconnect`), 6x TS2322, 1x TS2769, 1x TS2353.

## Goals / Non-Goals

**Goals:**
- `bun check` exits 0, and stays at 0 through the pre-push hook.
- Errors are fixed by correcting types, not by silencing them.

**Non-Goals:**
- No refactoring beyond what a type fix needs.
- No CI workflow change.

## Decisions

- **`allowImportingTsExtensions: true`** instead of rewriting imports: the whole codebase imports with `.ts`, `noEmit` is already on, and Bun resolves them natively.
- **MCP tool args**: narrow `args` per tool (typed argument shapes validated against the tool's input schema) instead of casting. Where a schema and the call site disagree (`tools.ts:158` passes `{ item, distance }[]` where `{ id }[]` is expected), the call site is checked first because it may be a real bug.
- **`fetch` mocks**: build the mock so it satisfies `typeof fetch` (add `preconnect`) rather than casting to `any`.
- **Spec fixtures** (`User.semantic_search_enabled`, `Item.relevance`, duplicate shapes): align the fixtures with the current types; if a type is the stale side, fix the type.
- **Hook**: `bun check` goes between build and tests in `pre-push`, not into `pre-commit`, to keep commits fast.

## Risks / Trade-offs

- [A type error hides a real bug (e.g. `item.repository.ts:322` number vs string, the two client stores)] → inspect each of these before changing the type, and fix the code if behavior is wrong; the tests must stay green.
- [`bun check` gets slower with the codebase] → currently ~270 ms, negligible.
