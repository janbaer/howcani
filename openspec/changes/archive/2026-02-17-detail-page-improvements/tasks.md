## 1. Responsive timestamps on detail page (closes #13)

- [x] 1.1 Add `formatTimestamp` to the import in `ItemDetail.svelte`
- [x] 1.2 Replace `formatDate` with dual-span responsive display for `created_at` (date-only on mobile, date+time on desktop/tablet)
- [x] 1.3 Replace `formatDate` with dual-span responsive display for `updated_at` (same pattern)

## 2. Consistent edit icon (closes #13)

- [x] 2.1 Replace the edit button SVG path in `ItemDetail.svelte` with the pencil icon from `ItemCard.svelte`

## 3. Verification

- [x] 3.1 Verify timestamps show date+time on desktop/tablet and date-only on mobile
- [x] 3.2 Verify edit icon matches the one on listview cards
