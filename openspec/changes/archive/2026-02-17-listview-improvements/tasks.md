## 1. Show all tags (closes #11)

- [x] 1.1 Remove `slice(0, 2)` limit from the tag list in `ItemCard.svelte`
- [x] 1.2 Remove the `+N` overflow badge (`{#if item.tags.length > 2}` block)

## 2. Responsive timestamps (closes #12)

- [x] 2.1 Add `updated_at` display to `ItemCard.svelte` for desktop/tablet (`md:` breakpoint)
- [x] 2.2 Hide `updated_at` on mobile (visible only at `md` and above)
- [x] 2.3 Only render `updated_at` when it differs from `created_at`
- [x] 2.4 Add short labels ("Created" / "Updated") next to timestamps on desktop for clarity

## 3. Verification

- [x] 3.1 Verify all tags display without truncation on items with many tags
- [x] 3.2 Verify both timestamps shown on desktop/tablet when item has been edited
- [x] 3.3 Verify only `created_at` shown when item has never been edited
- [x] 3.4 Verify only `created_at` shown on mobile viewport regardless of edit status
