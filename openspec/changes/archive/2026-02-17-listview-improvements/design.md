## Context

`ItemCard.svelte` is the component that renders each item in the listview. Currently:

- **Tags**: Only the first 2 tags are shown, with a `+N` overflow badge for the rest (issue #11)
- **Timestamps**: Only `created_at` is displayed using `formatTimestamp()`, which already omits seconds. The `updated_at` field is not shown at all (issue #12)

`formatTimestamp()` in `items.svelte.ts` already formats dates without seconds (hour + minute only), so no utility changes are needed.

## Goals / Non-Goals

**Goals:**
- Show all tags on item cards without truncation (closes issue #11)
- Show both `created_at` and `updated_at` on desktop/tablet cards (closes issue #12)
- Show only `created_at` on mobile cards

**Non-Goals:**
- No API changes — `updated_at` is already returned by the items endpoint
- No changes to tag badge styling or layout beyond allowing full wrapping
- No changes to the detail page

## Decisions

### Show all tags via flex-wrap
Remove the `slice(0, 2)` limit and the `+N` overflow badge. The tags container already uses `flex-wrap`, so all tags will wrap naturally. No layout work needed.

### Responsive timestamp display using Tailwind
Show a single `created_at` row on mobile (`< md`), and a two-timestamp row on `md+` (tablet/desktop):

- **Mobile**: one clock icon + `created_at` value
- **Tablet/Desktop**: clock icon + `created_at` label/value + separator + pencil-clock icon + `updated_at` label/value

Use Tailwind responsive prefixes (`hidden md:flex`, etc.) to toggle visibility — no JavaScript needed.

Only show `updated_at` if it differs from `created_at` (i.e. the item has actually been edited). If they're equal, show only `created_at` even on desktop.

### Label disambiguation
Use short labels "Created" and "Updated" on desktop so users understand what each timestamp means without relying on icon recognition alone.

## Risks / Trade-offs

- **Many tags per item**: A card with 10+ tags may become tall. Acceptable — the masonry layout handles variable-height cards well.
- **Same created/updated timestamps**: Showing "Updated: same time" is noise. Mitigation: only render `updated_at` when it differs from `created_at`.
