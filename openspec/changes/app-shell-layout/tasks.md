## 1. Layout Component

- [x] 1.1 Add `appShell?: boolean` prop to `Layout.svelte`
- [x] 1.2 When `appShell=true`: change root div to `flex h-screen flex-col overflow-hidden`
- [x] 1.3 When `appShell=true`: change `<main>` to `flex-1 overflow-hidden flex flex-col` with no padding wrapper
- [x] 1.4 Footer kept as a fixed-height flex sibling (outside scroll area) — original plan said exclude, revised to always show at bottom

## 2. App Entry Point

- [x] 2.1 Pass `appShell={Component === ItemList}` to `<Layout>` in `App.svelte`
- [x] 2.2 Add `h-full` class to the `{#key path}` transition wrapper `<div>` in `App.svelte`

## 3. Tag Sidebar

- [x] 3.1 Remove `lg:sticky lg:top-4` from `<aside>` in `TagSidebar.svelte`
- [x] 3.2 Remove `max-h-[calc(100vh-8rem)]` from `<nav>` in `TagSidebar.svelte`
- [x] 3.3 Add `h-full` to `<nav>` so it fills the sidebar container height

## 4. ItemList Page Restructure

- [x] 4.1 Wrap all content in `<div class="flex flex-col h-full">` as the root element
- [x] 4.2 Convert mobile tag chip strip (shown when `store.tags.length > 0`, hidden on `lg+`) from `sticky` to a `flex-shrink-0 px-4` bar — note: `px-4` is required so `MobileTagChips`'s `-mx-4` negative-margin bleed still works; strip contains both `MobileTagChips` (all tags, always shown) and `ActiveFilters` (self-hides when no tags selected)
- [x] 4.3 Create the two-column body: `<div class="flex flex-1 overflow-hidden">`
- [x] 4.4 Make tag sidebar wrapper `hidden lg:block` with `overflow-y-auto border-r border-border py-4` (no sticky)
- [x] 4.5 Create right column as `flex flex-1 flex-col overflow-hidden min-w-0`
- [x] 4.6 Move desktop active filter strip (shown when `store.selectedTags.length > 0`, visible on `lg+` only, contains only `ActiveFilters`) inside right column as a `flex-shrink-0 px-4 py-2` bar — remove `sticky`, `top`, and `padding-top` inline styles
- [x] 4.7 Wrap item content (loading/error/empty/grid/sentinel) in `<div class="flex-1 overflow-y-auto px-4 py-4">`
- [x] 4.8 Remove `content-flex` CSS class and its `@media (min-width: 1024px)` rule
- [x] 4.9 Remove `mobile-tag-strip` CSS class and its `@media` rules

## 5. Verification

- [x] 5.1 Run `bun run dev` and verify desktop: sidebar scrolls independently from items
- [x] 5.2 Verify selecting/deselecting a tag causes no layout jump
- [x] 5.3 Verify "Filtered by" bar stays visible while scrolling items
- [x] 5.4 Verify mobile: tag chips strip is fixed below header
- [x] 5.5 Verify document (body) has no vertical scrollbar on ItemList page
- [x] 5.6 Run `bun test` — all tests must pass
- [x] 5.7 Run `bun run lint` — must pass
