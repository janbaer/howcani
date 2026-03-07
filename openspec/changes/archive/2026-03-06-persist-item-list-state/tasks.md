## 1. Router

- [x] 1.1 Add `updateQuery(changes: Record<string, string | undefined>)` to `src/client/lib/router.svelte.ts` — merges changes into current query, removes undefined keys, calls `history.replaceState`, updates `_currentQuery`, notifies listeners

## 2. Store

- [x] 2.1 In `ItemListStore.load()`, read `getCurrentQuery().tags` and initialize `this.selectedTags` from it (split on comma, filter empty strings) instead of hard-resetting to `[]`
- [x] 2.2 In `ItemListStore.toggleTag()`, call `updateQuery({ tags: this.selectedTags.join(',') || undefined })` after updating `this.selectedTags`

## 3. Verify

- [x] 3.1 Run `bun run lint` and fix any issues
- [x] 3.2 Run `bun test` and confirm no regressions
- [x] 3.3 Manual smoke test: apply search + tag filter, navigate to detail, back — verify state restored
