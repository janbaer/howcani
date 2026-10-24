> **Status:** Final — 2026-10-24
> **Open:** —
# Client

## Filter state lives in `localStorage`, not the URL

Tags and search are stored under `howcani_filter_<username>` so they survive the `{#key path}` recreate on navigation. URL query params for tags were rejected: they caused a reactive loop (`_currentQuery` is `$state`, read in `load()` inside an `$effect`). The cost is that tag filters cannot be shared or bookmarked. A stored search is restored once per user on the first load, via `setSearchQuery()` deferred with `setTimeout`, because writing the search `$state` inside the effect that reads it loops; after that an empty search counts as deliberately cleared. `load()` uses the local `initialTags` for its first fetch, a `$state` write is not guaranteed to be visible synchronously.

Satisfies: R5, R6 · Origin: #58 · Date: 2026-03-06

## The code copy button is added after sanitization

A `$effect` adds the button to each `<pre>` after `{@html}` has rendered. A custom `marked` renderer would not work: DOMPurify strips the button and its handlers, and allowing them would weaken the sanitizing. Added afterwards, it opens no XSS surface.

Satisfies: R4 · Origin: #18 · Date: 2026-02-18

## The editor is CodeMirror, wrapped by hand

Carta hit Svelte 5 and native `<dialog>` problems and was dropped. External `value` changes go through `view.dispatch`, and the sync effect must not fire `onChange` for them, or it loops. Read-only is toggled through a `Compartment`. Create and edit share `ItemFormModal`: `item === null` opens create mode, an `Item` opens edit mode, `undefined` keeps it closed.

Satisfies: R3 · Origin: implement-item-management-ui, #50 · Date: 2026-02-09, 2026-03-01

## App shell mode is opt-in, the `lg` classes move together

ItemList uses fixed-height regions with independent scroll through `Layout appShell`; new pages that need it must pass `appShell={true}`. The `{#key path}` wrapper in `App.svelte` needs `h-full` or the page collapses. Below `lg` (1024px) the sidebar is replaced by a chip strip and a slide-in overlay. The `lg` classes in ItemList, the overlay and the header must change together. The overlay toggle sits in the header below `md` only, so between 768 and 1023px nothing opens it; accepted, that width is not used.

Satisfies: R15 · Origin: #68, mobile-tag-list · Date: 2026-03-09, 2026-02-14

## Masonry uses multi-column with a grid enhancement

The list is CSS multi-column (`columns: 26rem`, cards `break-inside: avoid`) and switches to grid with `@supports (display: grid-lanes)` or `grid-template-rows: masonry`. Multi-column was rejected in the first design and brought back in #56. Cards must not set `min-height`. The manifest `theme_color` must equal the light-mode `--primary`, and `index.html` has a second `theme-color` pair that `theme.svelte.ts` keeps in sync. `app.webmanifest` has to be in the static file set in `src/server/index.ts`, or it is not served.

Satisfies: R15 · Origin: improve-listview-layout, add-web-manifest, #56 · Date: 2026-02-15, 2026-03-06

## The tag color list exists twice

The color picker's `PRESET_COLORS` must start with the backend's `DEFAULT_COLORS` (`domain/tag.ts`), which picks the color for auto-created tags. Change the backend list and the picker has to follow. Tags are created implicitly, so there is no POST; deleting a tag removes it from all items.

Satisfies: R17 · Origin: implement-tag-management-ui, implement-tag-management · Date: 2026-02-08, 2026-02-10
