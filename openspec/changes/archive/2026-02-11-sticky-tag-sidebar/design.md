## Context

The TagSidebar component is currently rendered as a regular block element within a flexbox container (`<div class="flex gap-6">`). When users scroll down to view more items in the list, the sidebar scrolls up and out of view along with the page content, forcing users to scroll back to the top to access tag filters.

**Current implementation:**
- TagSidebar is an `<aside class="w-52 shrink-0">` element
- Contains a `<nav class="sidebar-scroll overflow-y-auto max-h-[calc(100vh-8rem)]">` for tag list
- Positioned within ItemList page's flex container
- No sticky or fixed positioning applied

**Layout structure:**
```
<div class="flex gap-6">        <!-- Parent flexbox container -->
  <TagSidebar />                 <!-- Left sidebar (w-52) -->
  <main>                         <!-- Main content area -->
    <items-masonry>              <!-- Item cards -->
    <sentinel>                   <!-- Infinite scroll trigger -->
  </main>
</div>
```

## Goals / Non-Goals

**Goals:**
- Make tag sidebar remain visible during vertical scroll
- Sidebar should stick to its position within the viewport
- Maintain proper spacing and layout with other components
- Preserve existing tag filtering functionality
- Support responsive behavior on mobile devices

**Non-Goals:**
- Changing tag filtering logic or API
- Modifying tag sidebar internal scrolling behavior
- Adding new features beyond sticky positioning
- Redesigning the sidebar UI or tag interaction patterns

## Decisions

### Decision 1: Use CSS `position: sticky` over `position: fixed`

**Choice**: Apply `position: sticky` to the TagSidebar aside element

**Alternatives considered:**
- **position: fixed**: Removes element from document flow, requires manual positioning and width calculations
- **JavaScript scroll listener**: Overly complex, performance issues, unnecessary for this use case

**Rationale:**
- `position: sticky` keeps the element in document flow, no layout shifts
- Automatically handles positioning relative to scroll container
- Browser-native behavior, no JavaScript required
- Works well with flexbox layout (stays within flex container bounds)
- Better performance than scroll listeners
- Simpler implementation with fewer edge cases

**Trade-off**: Limited IE support (but project already requires modern browsers per Svelte 5)

### Decision 2: Set `top` value to account for header height

**Choice**: Use `top: 0` or small offset (e.g., `top: 1rem`) to position sticky sidebar

**Rationale:**
- The header appears to be fixed or doesn't scroll based on the layout
- Need to ensure sidebar doesn't overlap with header when sticky
- Small offset provides visual breathing room from top edge
- Value can be adjusted based on actual header height if needed

### Decision 3: Maintain existing `max-height` calculation

**Choice**: Keep the existing `max-h-[calc(100vh-8rem)]` on the nav element

**Rationale:**
- The sidebar already has proper overflow handling for long tag lists
- The `max-height` calculation accounts for header and padding
- Internal scrolling within the nav element works independently of sticky positioning
- No need to change this working behavior

### Decision 4: Apply sticky to the `<aside>` element, not the `<nav>`

**Choice**: Add `sticky` class to the aside element (line 67 in TagSidebar.svelte)

**Rationale:**
- The aside is the semantic container for the entire sidebar
- Keeps the sticky positioning at the appropriate structural level
- Nav element remains responsible for internal scrolling only
- Cleaner separation of concerns

**Implementation:**
```svelte
<aside class="sticky top-4 w-52 shrink-0">
  <nav class="sidebar-scroll overflow-y-auto max-h-[calc(100vh-8rem)]">
    <!-- tag list -->
  </nav>
</aside>
```

### Decision 5: Mobile responsive behavior

**Choice**: Disable sticky positioning on mobile viewports (< 1024px)

**Alternatives considered:**
- **Keep sticky on mobile**: Would waste vertical space and make content harder to access
- **Different mobile layout**: More complex, requires significant restructuring

**Rationale:**
- Mobile devices have limited vertical space
- Tags are less frequently changed on mobile
- Existing responsive behavior likely hides/collapses sidebar on small screens
- Can use Tailwind's `lg:sticky` to only apply on desktop

**Implementation:**
```svelte
<aside class="lg:sticky lg:top-4 w-52 shrink-0">
```

### Decision 6: No z-index changes needed

**Choice**: Don't add z-index to the sidebar

**Rationale:**
- Sticky elements automatically create a stacking context
- No overlapping components that would require z-index management
- Sidebar is in natural document flow, won't overlap main content
- Simpler implementation without z-index complexity

## Risks / Trade-offs

**[Risk]** Sidebar may overlap footer if page is shorter than viewport
**Mitigation**: The sticky element naturally stops at its container boundary. Since the sidebar is within the same container as the content, it won't stick below the content area. No special handling needed.

**[Risk]** Content might shift when sidebar becomes sticky
**Mitigation**: `position: sticky` doesn't remove the element from document flow, so no layout shift occurs. The space is always reserved.

**[Risk]** Mobile users might have difficulty accessing tags
**Mitigation**: Use `lg:sticky` responsive class to only enable sticky behavior on desktop (>= 1024px). Mobile keeps existing scroll behavior.

**[Risk]** Browser compatibility issues with older browsers
**Mitigation**: `position: sticky` is supported in all modern browsers (95%+ global coverage). Project already requires modern browser features (Svelte 5, IntersectionObserver). Acceptable trade-off.

**[Trade-off]** Sidebar scrolling might be confusing if page content AND sidebar both scroll
**Benefit**: Internal sidebar scrolling is independent and only triggers when tag list exceeds viewport height. Clear visual distinction between sidebar scroll and page scroll. Existing `max-height` calculation handles this well.

**[Trade-off]** Users can no longer "scroll past" the sidebar to focus solely on content
**Benefit**: Tags are frequently used filtering tools - keeping them accessible improves workflow far more than the rare case of wanting to hide them. Users can still collapse browser sidebars or use keyboard shortcuts if needed.

## Migration Plan

**Development:**
1. Add `sticky top-4 lg:sticky lg:top-4` classes to TagSidebar aside element
2. Test on desktop viewport (1920x1080): verify sidebar sticks during scroll
3. Test on tablet viewport (768x1024): verify sidebar sticks or uses fallback
4. Test on mobile viewport (375x667): verify sticky is disabled
5. Test with short content (< viewport height): verify no issues
6. Test with long tag list: verify internal scrolling still works
7. Check for any visual issues or overlaps

**Deployment:**
- No backend changes required
- No breaking changes to functionality
- Pure CSS change, no JavaScript needed
- Can be rolled back by removing the added classes

**Rollback:**
- Remove `sticky` and `top-*` classes from aside element
- Sidebar returns to default scroll behavior

**Testing checklist:**
- [ ] Sidebar remains visible when scrolling down item list
- [ ] Sidebar internal scrolling works for long tag lists
- [ ] No layout shift when sidebar becomes sticky
- [ ] Sticky behavior disabled on mobile (< 1024px)
- [ ] Works with infinite scroll (doesn't interfere with loading)
- [ ] Tag filtering functionality unchanged
- [ ] No console errors or warnings
- [ ] Biome linter passes

## Open Questions

None - implementation approach is straightforward and well-supported.
