## Context

The current item list uses Tailwind CSS classes for a responsive grid layout: `grid grid-cols-1 md:grid-cols-2 gap-4`. This creates a uniform 2-column grid with fixed row heights, creating whitespace when items have varying content lengths.

**Current Technical Stack:**
- **Frontend**: Svelte 5 with runes
- **Styling**: Tailwind CSS (CDN)
- **Layout**: CSS Grid with utility classes
- **Browser targets**: Modern browsers (no IE support)

**Previous Implementation (v1):**
The old version at https://howcani.janbaer.de/ used **CSS Multi-column layout**:
```css
.Questions-container { columns: 25rem; }
.Question-container { break-inside: avoid; }
```
This created a masonry-style layout where items packed vertically into columns, optimizing vertical space.

**Problems with Current Grid:**
- Uniform row heights create whitespace with varying-height items
- Limited to 2 columns even on wide screens (1920px+)
- Card styling is basic with minimal visual hierarchy
- Code previews don't stand out from regular text
- Not utilizing the proven CSS columns approach from v1

**Opportunity:**
Restore the CSS Multi-column masonry layout from v1 while enhancing visual design with better card styling, code preview treatment, and typography refinement.

## Goals / Non-Goals

**Goals:**
- Restore CSS Multi-column masonry layout from v1 for optimal vertical space usage
- Support 3-4 columns on wide screens (vs current 2-column limit)
- Automatic column calculation without media queries (`columns: 25rem`)
- Prevent cards from breaking across columns (`break-inside: avoid`)
- Enhance visual hierarchy with better card styling (shadows, padding, borders)
- Make code previews visually distinct with background and styling
- Improve mobile touch targets and spacing
- Refine typography for better scannability
- Pure CSS solution using proven Multi-column approach

**Non-Goals:**
- CSS Grid-based masonry (complex, doesn't pack vertically as well)
- JavaScript layout libraries (Masonry.js, Isotope) - avoiding dependencies
- Major refactoring of component logic - only template/styling changes
- Fixed breakpoints with media queries - prefer automatic column calculation
- Supporting Internet Explorer 9 or older (IE10+ required for `break-inside`)

## Decisions

### Decision 1: CSS Multi-column Masonry Layout

**Choice:** Use CSS Multi-column layout with `columns: 25rem` (400px) and `break-inside: avoid` on cards

**Rationale:**
- **True masonry**: Items pack vertically into columns, filling available space top-to-bottom
- **No whitespace**: Unlike grid rows, varying-height items don't create gaps
- **Excellent browser support**: CSS columns since IE10+ (2012), `break-inside` since IE10
- **Zero JavaScript**: Pure CSS solution, no dependencies
- **Automatic column calculation**: Browser determines how many 400px columns fit
- **Proven approach**: Same implementation as successful v1 at https://howcani.janbaer.de/
- **No media queries**: Columns adapt automatically to container width

**Implementation:**
```css
.items-container {
  columns: 25rem; /* 400px column width */
  column-gap: 1rem;
}

.item-card {
  break-inside: avoid; /* Keep cards intact across columns */
  margin-bottom: 1rem;
}
```

**Column behavior:**
- 0-399px: 1 column (mobile)
- 400-799px: 1-2 columns (tablet)
- 800-1199px: 2-3 columns (desktop)
- 1200-1599px: 3-4 columns (wide desktop)
- 1600px+: 4+ columns (ultra-wide)

**Alternatives Considered:**
- **CSS Grid with auto-fill**: Doesn't pack vertically, creates row whitespace
- **CSS Grid Lanes**: Safari TP only, too experimental
- **Flexbox columns**: Requires hardcoded column containers, not responsive
- **Masonry.js**: 37KB dependency, JavaScript overhead, layout recalculation
- **CSS Grid `grid-auto-flow: dense`**: Reorders items, breaks semantic order

**Choice:** Use `repeat(auto-fill, minmax(300px, 1fr))` for responsive columns without media queries

**Rationale:**
- **Truly responsive**: Adapts to any container width automatically
- **No media queries**: Container-driven, works in sidebars, modals, etc.
- **Optimal column width**: 300px minimum ensures readability, 1fr allows growth
- **Mobile-first**: Single column on small screens, multiple on large screens

**Breakpoint behavior:**
- 0-299px: 1 column (mobile)
- 300-599px: 1 column (narrow mobile/portrait tablet)
- 600-899px: 2 columns (tablet)
- 900-1199px: 3 columns (desktop)
- 1200px+: 3-4 columns (wide desktop)

### Decision 2: Styling Implementation Approach

**Choice:** Use Tailwind utility classes in the component, add custom CSS only if needed

**Rationale:**
- **Consistency**: Matches existing codebase patterns
- **No build step**: Tailwind CDN works out of the box
- **Maintainability**: Utility classes are self-documenting
- **Performance**: No additional CSS file to load for standard utilities

**When to use `public/style.css`:**
- Only if Tailwind doesn't support needed feature (unlikely for this change)
- For complex selectors or hover states hard to express in utilities

**Alternatives Considered:**
- **Always use external CSS**: Unnecessary for utility-friendly changes
- **CSS-in-JS**: Adds dependency, not needed for static styles
- **Inline styles**: Harder to maintain, no responsive variants

### Decision 3: Visual Hierarchy Enhancements

**Choice:** Enhance card styling with improved shadows, padding, and hover states using Tailwind classes

**Changes:**
- Increase card padding from `p-5` to `p-6` for better breathing room
- Add subtle shadow: `shadow-sm` default, `hover:shadow-md` on hover
- Enhance border: `border-border` with darker hover state
- Code preview: Add `bg-muted` background, `rounded-md` corners, `p-3` padding
- Typography: Increase question font weight, adjust text hierarchy

**Rationale:**
- Uses existing Tailwind utilities (no custom CSS)
- Improves scannability with better visual separation
- Hover feedback indicates interactivity
- Code previews visually distinct from text content

### Decision 4: Mobile Layout Optimization

**Choice:** Keep single-column layout on mobile (<600px), enhance touch targets

**Rationale:**
- **Readability**: Single column optimal for mobile screens
- **Touch targets**: Larger tap areas for edit/delete buttons (44x44px minimum)
- **Performance**: Simpler layout, faster rendering on mobile devices
- **Consistency**: Matches current mobile behavior, no breaking changes

**Enhancements:**
- Increase button touch targets: `p-2` → `p-3` on mobile
- Optimize tag chips: `text-xs` with `px-3 py-1.5` for better tappability
- Adjust card padding: `p-6` → `p-5` on mobile to maximize content area

## Risks / Trade-offs

### Risk: Column Reordering May Confuse Users
**Status:** Multi-column layout fills top-to-bottom per column, not left-to-right

**Mitigation:**
- This is the same behavior as v1 - users are already familiar with it
- Column reading order is natural for masonry layouts (Pinterest, etc.)
- Semantic HTML order preserved (important for accessibility)
- Items sorted by date, so chronological order maintained within columns

**Trade-off:** Reading pattern differs from grid (top-to-bottom vs left-to-right), but this is expected for masonry layouts.

### Risk: Very Wide Screens May Show Too Many Columns
**Status:** 2560px+ screens could show 5-6 columns

**Mitigation:**
- Set `max-width` on container if needed (e.g., `max-w-7xl` = 1280px)
- 400px column width ensures readability even with many columns
- Most users on 1920px or smaller will see 3-4 columns (ideal)
- Can monitor feedback and adjust `column-width` if needed

**Trade-off:** Ultra-wide screens get more columns (could feel cramped), but 400px width ensures readability.

### Risk: break-inside Browser Quirks
**Status:** Some older browsers have minor issues with `break-inside: avoid`

**Mitigation:**
- Well-supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- Fallback is graceful: cards might break across columns (rare, not critical)
- Tested extensively in v1 implementation
- Can add vendor prefixes if issues arise: `-webkit-column-break-inside: avoid`

**Trade-off:** Minor edge cases in old browsers, but negligible impact.

### Risk: Mobile Touch Target Adjustments May Affect Layout
**Status:** Increasing button size to 44×44px might change spacing

**Mitigation:**
- Test on actual mobile devices (iOS Safari, Chrome Android)
- Ensure adequate spacing between interactive elements
- Use `p-3` instead of `p-2` provides sufficient target area
- Absolute positioning of edit/delete buttons minimizes layout impact

**Trade-off:** Slightly larger buttons on mobile, but better usability (worth it).

## Migration Plan

### Deployment Steps

**Single Commit Deployment:**
1. Add CSS to `public/style.css` (or component `<style>` block):
   ```css
   .items-container {
     columns: 25rem; /* 400px column width */
     column-gap: 1rem;
     padding: 10px;
   }

   .item-card {
     break-inside: avoid;
     margin-bottom: 1rem;
   }
   ```

2. Update `ItemList.svelte` template:
   - Replace grid div: `grid grid-cols-1 md:grid-cols-2 gap-4` → `items-container`
   - Add `item-card` class to each card article
   - Update card padding: `p-5` → `p-6`
   - Add enhanced shadows: `shadow-sm hover:shadow-md`
   - Enhance code preview: add `bg-muted rounded-md p-3`
   - Increase mobile button touch targets: `p-1` → `p-3` on mobile

3. Test in multiple browsers:
   - Chrome/Firefox/Edge/Safari: Verify masonry layout with 3-4 columns on desktop
   - Verify items pack vertically (top-to-bottom in each column)
   - Mobile Safari/Chrome: Verify single column, touch targets
   - Tablet: Verify 2-3 column layout

4. Deploy to production

**Implementation Location:**
- **Recommended**: Add to `public/style.css` (global, reusable)
- **Alternative**: Component-scoped `<style>` block in ItemList.svelte

**No Database/API Changes:** Pure frontend CSS/template change, zero backend impact.

**Rollback Strategy:**
- If issues detected, revert single commit
- CSS Multi-column is well-supported (since IE10), minimal risk
- Proven approach from v1, low risk
- CSS-only change means instant rollback (no cache issues)

### Testing Checklist

- [ ] Chrome/Firefox/Edge/Safari: Masonry layout renders correctly
- [ ] Wide screens (1200px+): 3-4 columns visible
- [ ] Desktop (900-1199px): 2-3 columns
- [ ] Tablet (600-899px): 1-2 columns
- [ ] Mobile (<600px): Single column, enhanced touch targets
- [ ] Vertical packing: Items fill top-to-bottom in each column (not left-to-right)
- [ ] No card breaking: `break-inside: avoid` works, cards stay intact
- [ ] Code previews: Background, padding, distinct from text
- [ ] Card styling: Improved shadows, padding, hover effects
- [ ] Accessibility: Tab order follows semantic HTML order
- [ ] Dark mode: Card borders and shadows work in both themes
- [ ] Performance: No CLS, smooth scrolling, fast rendering

### Monitoring

**Metrics to Track:**
- CLS scores (should remain < 0.1)
- User feedback on masonry layout (via support channels)
- Load time impact (expect negligible change)
- Mobile usability feedback (touch targets)
- Column count on various screen sizes

**Success Criteria:**
- No increase in layout-related bug reports
- Positive user feedback on masonry layout (like v1)
- CLS scores remain stable
- Better vertical space utilization (no whitespace gaps)
- 3-4 columns on wide screens (vs current 2)

## Open Questions

_None - design is ready for implementation._
