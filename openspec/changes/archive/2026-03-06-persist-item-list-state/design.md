## Context

The `{#key path}` wrapper in `App.svelte` destroys and recreates page components on every navigation. This is the correct Svelte pattern for page transitions, but it means any ephemeral `$state` in `ItemListStore` (selected tags, scroll position) is reset on navigation.

Selected tags and the active search term need to survive navigation to detail or settings pages and back, and also persist across app reopen.

## Goals / Non-Goals

**Goals:**
- Selected tags survive navigation to a detail or settings page and back
- Search term is restored on app reopen even when accessed via direct URL (no `?search=` param)
- Filter state is scoped per user (multi-user on same browser works correctly)

**Non-Goals:**
- Shareable/bookmarkable filtered URLs for tag state (tags are personal preferences, not shared views)
- Persisting infinite scroll offset
- Persisting sort order

## Decisions

### 1. localStorage with per-user JSON object

Filter state is stored in `localStorage` under `howcani_filter_<username>` as a JSON object `{ tags: string[], search: string }`. This approach:
- Survives navigation (component destroy/recreate cycle)
- Survives browser tab close and app reopen
- Scopes state per user (different users on the same browser get independent state)

Alternative considered: URL query params (`?tags=linux,docker`) — rejected because this caused Svelte 5 reactive dependency loops (`_currentQuery` is `$state`, reading it inside `load()` which runs in `$effect` created an unintended tracked dependency and an infinite update cycle).

### 2. Three private helper methods on ItemListStore

`filterKey(username)`, `readFilter(username)`, and `saveFilter(username, tags, search)` encapsulate all localStorage interaction. This keeps the API surface small and ensures consistent read/write semantics.

### 3. Hybrid approach for search term restoration

Search terms get both localStorage persistence AND URL synchronization, because the search functionality already relies on `?search=` URL params for routing. On app reopen with no URL search param but a stored search term, `load()` defers navigation to `/${username}/items?search=<term>` via `setTimeout(..., 0)`. The `setTimeout` is required to defer the `navigate()` call out of the synchronous `$effect` execution context — calling `navigate()` directly would write `_currentQuery` ($state), which the effect depends on, causing an infinite loop.

### 4. Use local variable for initial fetch, not `this.selectedTags`

In `load()`, after assigning `this.selectedTags = initialTags`, the subsequent `fetchItems` call uses `initialTags` directly (not `this.selectedTags`). With Svelte 5 runes, a `$state` assignment may not synchronously reflect the new value for immediate use in the same function call. Using the local `initialTags` variable avoids this timing issue.

## Risks / Trade-offs

- **Not shareable**: Tag filter state is not encoded in the URL, so filtered views cannot be bookmarked or shared. This is an acceptable trade-off given the feature's goal of personal preference persistence.
- **Stale tags in storage**: If a tag is deleted, it may remain in `localStorage`. On load, `fetchItems` will apply the stale tag filter and return fewer results — same graceful degradation as today.
