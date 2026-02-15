## Context

The item list uses CSS Grid with `repeat(auto-fill, minmax(32rem, 1fr))` which creates uniform row heights. When items have varying content lengths, shorter cards are stretched to match the tallest card in their row, creating visual whitespace.

**Current Technical Stack:**
- **Frontend**: Svelte 5 with runes
- **Styling**: Tailwind CSS (CDN) + component-scoped `<style>` blocks
- **Layout**: CSS Grid with utility classes
- **Browser targets**: Modern browsers, progressive enhancement for experimental features

## Goals / Non-Goals

**Goals:**
- Native CSS masonry layout using `display: grid-lanes` with progressive enhancement
- Variable-height cards that size to their content
- Graceful fallback to standard CSS Grid for browsers without support
- No JavaScript layout libraries

**Non-Goals:**
- CSS Multi-column (`columns`) approach — fills top-to-bottom instead of left-to-right
- JavaScript masonry libraries (Masonry.js, Isotope)
- Supporting the older `display: masonry` syntax (superseded by `grid-lanes`)

## Decisions

### Decision 1: CSS Grid Lanes with Progressive Enhancement

**Choice:** Use `@supports (display: grid-lanes)` to progressively enhance from standard grid to masonry

**Implementation:**
```css
.items-masonry {
  /* Base fallback: standard grid */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(32rem, 1fr));
  gap: 1rem;
}

/* Chromium 144+: grid-lanes masonry */
@supports (display: grid-lanes) {
  .items-masonry {
    display: grid-lanes;
  }
}

/* Firefox Nightly: grid-based masonry */
@supports (grid-template-rows: masonry) {
  .items-masonry {
    grid-template-rows: masonry;
  }
}
```

**Rationale:**
- `grid-lanes` is the CSSWG-resolved standard (replaces earlier `display: masonry` proposal)
- `grid-template-columns` from the fallback grid rule is inherited by `grid-lanes`
- Firefox's older `grid-template-rows: masonry` syntax handled as separate fallback
- Standard grid fallback works in all browsers — items just have equal row heights

**Alternatives Rejected:**
- `display: masonry` with `masonry-template-tracks` — Chrome 144 doesn't implement this syntax despite flag description mentioning it. The actual implementation uses `grid-lanes`.
- CSS Multi-column (`columns: 25rem`) — fills columns top-to-bottom, breaking the expected left-to-right reading order
- `grid-auto-rows` span trick — complex and fragile

### Decision 2: Remove Fixed Card Heights

**Choice:** Remove `min-height: 15rem` from ItemCard, keep `max-height: 15rem` on `.answer-preview`

**Rationale:**
- Fixed `min-height` forced all cards to the same minimum height, defeating masonry
- `answer-preview` max-height still caps very long answers to prevent single cards from dominating
- Cards naturally size to their content, creating the visual variety masonry needs

## Risks / Trade-offs

### Risk: Limited Browser Support
**Status:** `grid-lanes` requires Chromium 144+ with flag, Safari TP 234+, or Firefox Nightly with flag

**Mitigation:** Standard CSS Grid fallback is invisible to users — they just see equal-height rows. As browsers ship `grid-lanes` by default, users automatically get masonry.

### Risk: Reading Order
**Status:** `grid-lanes` fills items left-to-right across columns (same as standard grid), unlike CSS columns which fill top-to-bottom.

**Mitigation:** This is actually a benefit — reading order matches the natural left-to-right expectation.

## Open Questions

_None — implementation is complete._
