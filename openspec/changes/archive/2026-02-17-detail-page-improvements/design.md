## Context

`ItemDetail.svelte` currently uses `formatDate()` for both timestamps, which returns date only (no time). The listview uses `formatTimestamp()` which returns date + time without seconds. Both functions are available in `items.svelte.ts`.

The edit button in `ItemDetail.svelte` uses a "pencil with box" SVG path, while `ItemCard.svelte` uses a simpler pencil stroke. The issue asks to use the listview icon on the detail page.

## Goals / Non-Goals

**Goals:**
- Show `formatTimestamp()` on desktop/tablet (`md:` breakpoint), keep `formatDate()` on mobile
- Replace detail page edit icon SVG with the one from `ItemCard.svelte`

**Non-Goals:**
- No responsive label changes (the detail page already has contextual layout)
- No changes to the delete icon

## Decisions

### Responsive timestamp: dual-span approach
Use the same `hidden md:inline` / `md:hidden` Tailwind pattern as the listview. Render two `<span>` elements per timestamp — one for mobile (date only), one for desktop (date + time) — and toggle visibility with CSS.

### Import `formatTimestamp` in ItemDetail.svelte
Add `formatTimestamp` to the existing import from `'../lib/items.svelte'`.

### Edit icon replacement
Copy the SVG path from `ItemCard.svelte`'s edit button directly into `ItemDetail.svelte`'s edit button.
