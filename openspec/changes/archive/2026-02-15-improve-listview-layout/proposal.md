## Why

The current item list layout uses a CSS Grid that creates uniform row heights, leading to whitespace when items have varying content lengths. The old v1 implementation used CSS Multi-column layout for a masonry-style effect, but CSS now offers native masonry support via `display: grid-lanes` (Chromium 144+) with graceful fallback to standard grid.

## What Changes

- **CSS Grid Lanes masonry layout**: Native masonry using `display: grid-lanes` with `@supports` progressive enhancement
  - Fallback: standard CSS Grid with `repeat(auto-fill, minmax(32rem, 1fr))` for browsers without support
  - Chromium 144+: `display: grid-lanes` for true masonry packing (variable-height cards)
  - Firefox Nightly: `grid-template-rows: masonry` fallback for older Firefox implementation
  - Cards naturally size to their content height — no fixed min/max heights on the container children
  - Automatic column calculation without media queries

- **Card height adjustments**: Removed fixed `min-height` from ItemCard to allow natural content-driven heights
  - `answer-preview` retains `max-height: 15rem` to cap very long answers
  - Cards shrink to fit short content, enabling visual variety in masonry layout

## Capabilities

### Modified Capabilities

- `frontend-ui`: Update the "Item List Component" and "Responsive Design" requirements:
  - CSS Grid with progressive enhancement to `grid-lanes` masonry
  - Variable-height cards based on content length
  - 3-column layout on wide screens with automatic column sizing

## Impact

**Affected Files:**
- `src/client/pages/ItemList.svelte` — masonry container styles
- `src/client/components/itemlist/ItemCard.svelte` — removed fixed min-height

**Browser Compatibility:**
- All browsers: standard CSS Grid fallback (equal-height rows)
- Chromium 144+ with flag: `display: grid-lanes` (true masonry)
- Firefox Nightly with flag: `grid-template-rows: masonry`
- Safari Technology Preview 234+: `display: grid-lanes`

**No Breaking Changes:**
- Graceful degradation — browsers without support see a standard grid
- No database or backend changes
