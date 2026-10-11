## Context

`bun check` (typescript-go) skips `.svelte`. `svelte-check` 4.7.6 covers components but drives the TypeScript 6 compiler API: with TypeScript 7 alone it aborts, and with both 6 and 7 installed plus `--tsgo` it reports the same errors. A trial run: 9 errors in 4 files, 12 warnings (mostly accessibility), about 10 s.

## Goals / Non-Goals

**Goals:**
- Every `.svelte` file is type-checked before a push.
- The 9 existing errors are fixed by correcting types.

**Non-Goals:**
- The 12 warnings; they are printed but do not fail the check.
- Running the check in Docker or CI (the pre-push hook is the gate, as for `bun check`).

## Decisions

- **`typescript@6.0.3` only, no `--tsgo`:** one compiler, no experimental flag, same result. TypeScript 7 stays out because `renovate.json` already disables all major updates; no extra rule needed.
- **Script:** `svelte-check --tsconfig ./tsconfig.json`; it exits non-zero on errors only.
- **Modal props:** `ItemFormModal` and `ItemDeleteConfirmModal` already treat `undefined` as "closed" and `null` as "create"; their `item` prop type becomes `Item | null | undefined` to match. The stores stay as they are.
- **`onTagsChanged`:** `ItemList` returns the store's promise instead of dropping it, so `TagSidebar`'s `await` really waits for tags and items to reload.
- **`Button`:** its rest props are typed as a union of anchor and button attributes, which cannot be spread on either element. An intersection of both attribute sets spreads on either element without casts and keeps `onclick` typed for callers. A discriminated anchor/button union was tried first: it needs casts for the spread and leaves caller handlers untyped.
- **tsconfig `include`:** keep `src/**/*.svelte`. `bun check` ignores it, but `svelte-check` uses it as its project roots: without it, components that no TypeScript file imports are not checked (verified with an unimported component carrying a type error).

## Risks / Trade-offs

- [Pre-push is about 10 s slower] → acceptable next to build and tests; can move to a separate hook later.
- [`svelte-check` runs under Node, not Bun] → Node is present wherever the hook runs; not used in Docker or CI.
