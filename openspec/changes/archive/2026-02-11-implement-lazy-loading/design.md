## Context

The ItemList component currently implements pagination with a manual "Load more" button. Users must explicitly click this button to fetch additional items. The component uses:
- Offset-based pagination with `PAGE_SIZE` constant (50 items per page)
- `loadItems(append)` function that either replaces or appends items
- `loadMore()` function that increments offset and calls `loadItems(true)`
- `hasMore` derived state that checks `offset + PAGE_SIZE < total`
- Svelte 5 runes for state management ($state, $derived, $effect)

The goal is to replace the manual button with automatic loading triggered by scroll position, maintaining all existing pagination logic.

## Goals / Non-Goals

**Goals:**
- Replace manual "Load more" button with automatic infinite scroll
- Trigger loading when user scrolls near bottom of content
- Provide visual feedback during loading
- Prevent duplicate simultaneous requests
- Work seamlessly with existing pagination logic
- Use browser-native APIs (no additional dependencies)

**Non-Goals:**
- Changing the pagination strategy (keep offset/limit pattern)
- Modifying the backend API
- Supporting browsers without IntersectionObserver (IE11 and older)
- Virtual scrolling or windowing for performance optimization
- Bi-directional infinite scroll (only loading more at bottom)

## Decisions

### Decision 1: IntersectionObserver API over Scroll Events

**Choice**: Use IntersectionObserver API to detect when sentinel element enters viewport

**Alternatives considered**:
- **Scroll event listeners**: Traditional approach using `window.addEventListener('scroll')` with throttling/debouncing
- **Third-party library**: Libraries like `react-infinite-scroll-component` or similar Svelte alternatives

**Rationale**:
- IntersectionObserver is more performant than scroll events (no need for throttling/debouncing)
- Browser-native API with excellent modern browser support (95%+ global coverage)
- Cleaner code with built-in viewport intersection detection
- Automatically handles cleanup and memory management
- More declarative than imperative scroll calculations

**Trade-off**: No support for IE11, but project already targets modern browsers (Svelte 5 requires modern browser features)

### Decision 2: Sentinel Element Approach

**Choice**: Place an invisible `<div>` element after the last item that triggers loading when visible

**Alternatives considered**:
- **Distance-based calculation**: Calculate distance from bottom on scroll events
- **Last item observation**: Observe the last card directly

**Rationale**:
- Sentinel element is a well-established pattern for infinite scroll
- Cleaner separation of concerns (sentinel exists solely for observation)
- Easier to position and style independently
- Won't interfere with item rendering or masonry layout
- Can show loading indicator in the same location

**Implementation**: Sentinel element replaces the current "Load more" button section when `hasMore` is true

### Decision 3: Observer Configuration

**Choice**:
```javascript
rootMargin: "100px"  // Start loading 100px before sentinel enters viewport
threshold: 0.1       // Trigger when 10% of sentinel is visible
```

**Alternatives considered**:
- **No rootMargin**: Wait until sentinel is fully in viewport (too late, causes scroll stutter)
- **Larger rootMargin (500px+)**: More aggressive prefetching

**Rationale**:
- 100px provides smooth experience - loading starts just before user reaches the end
- Avoids scroll stutter (waiting until bottom is reached)
- Not too aggressive (avoids loading pages user may never see)
- Can be fine-tuned based on user feedback

### Decision 4: Responsive PAGE_SIZE Based on Viewport

**Choice**: Calculate dynamic page size based on viewport height:
```typescript
const PAGE_SIZE = $derived(() => {
  const viewportHeight = window.innerHeight;
  // Estimate: ~200px per card on average, load 2-3 viewports worth
  return Math.max(10, Math.floor(viewportHeight / 200) * 6);
});
```

**Alternatives considered**:
- **Fixed PAGE_SIZE = 50**: Original approach, same for all devices
- **Tier-based (mobile: 20, tablet: 30, desktop: 50)**: Breakpoint-based sizing
- **Smaller fixed size (PAGE_SIZE = 20)**: Conservative approach for all devices

**Rationale**:
- Mobile screens (667px height): ~20 items (3 viewports)
- Tablet screens (1024px height): ~30 items (3 viewports)
- Desktop screens (1080px+ height): ~32-48 items (3 viewports)
- Loading 2-3 viewports worth ensures smooth scrolling without excessive data transfer
- Dynamically adapts to actual viewport (handles orientation changes, browser UI)
- Prevents loading 50 items on mobile where only 3-4 are visible initially

**Trade-off**: Slightly more complex calculation, but better UX across devices

**Implementation consideration**: The 200px estimate accounts for card heights in masonry layout. This can be refined based on actual measurements after implementation.

### Decision 5: Svelte 5 $effect for Lifecycle Management

**Choice**: Use `$effect()` to set up and tear down IntersectionObserver

**Rationale**:
- Svelte 5's recommended approach for side effects
- Automatic cleanup when component unmounts
- Re-runs when dependencies change
- Clean, declarative syntax
- Replaces `onMount`/`onDestroy` pattern from Svelte 4

**Implementation**:
```typescript
$effect(() => {
  if (!sentinelElement || !hasMore) return;

  const observer = new IntersectionObserver(callback, options);
  observer.observe(sentinelElement);

  return () => observer.disconnect();
});
```

### Decision 6: Guard Against Duplicate Requests

**Choice**: Check `loading` state before calling `loadMore()` in observer callback

**Rationale**:
- Prevents race conditions when multiple intersection events fire
- Existing `loadItems()` already sets `loading = true` at start
- Button is disabled when `loading` is true - observer should respect same state
- Simple boolean check, no additional state needed

**Implementation**:
```typescript
const callback = (entries: IntersectionObserverEntry[]) => {
  if (entries[0].isIntersecting && !loading && hasMore) {
    loadMore();
  }
};
```

### Decision 7: Visual Loading Indicator

**Choice**: Show loading spinner/text in the sentinel element area when `loading` is true

**Alternatives considered**:
- **Sticky footer indicator**: Fixed at bottom of viewport
- **Toast notification**: Temporary popup message
- **No indicator**: Silent background loading

**Rationale**:
- In-flow indicator feels most natural (user scrolled to that position)
- Matches existing "Loading..." text pattern from button
- Provides clear feedback without being intrusive
- Easy to style consistently with existing design

**Implementation**: The sentinel div shows different content based on loading state:
- When `loading`: Show "Loading more items..." with spinner
- When not loading: Empty or minimal height (just intersection target)

## Risks / Trade-offs

**[Risk]** User scrolls very fast past sentinel → Loading might not trigger in time
**Mitigation**: 100px rootMargin provides buffer zone. If issue persists, increase rootMargin or use multiple sentinel positions.

**[Risk]** Observer triggers on initial render before items are loaded → Duplicate initial request
**Mitigation**: Only create observer after first load completes. Check `hasMore` in observer setup condition.

**[Risk]** Masonry layout height changes cause observer to trigger unexpectedly → False positives
**Mitigation**: Observer only triggers on intersection events, not layout changes. Sentinel position is stable at bottom of list.

**[Risk]** User on slow connection sees lag between scroll and content appearing
**Mitigation**: This is inherent to network latency. The 100px rootMargin helps by starting fetch early. Could add skeleton loading cards in future enhancement.

**[Risk]** Memory usage increases with infinite scroll (many items in DOM)
**Mitigation**: Acceptable for this use case (technical knowledge base with reasonable item counts). Virtual scrolling can be added later if needed.

**[Trade-off]** Removing manual control (button) → Some users prefer explicit loading
**Benefit**: Modern UX pattern that reduces friction. Users can still control pace by simply not scrolling.

**[Trade-off]** Browser compatibility (no IE11 support)
**Benefit**: Project already targets modern browsers. IntersectionObserver has 95%+ coverage.

## Migration Plan

**Development**:
1. Add sentinel element to template (replacing "Load more" button section)
2. Implement IntersectionObserver setup in `$effect` with proper cleanup
3. Add loading indicator styling
4. Test with various scroll speeds and network conditions
5. Test edge cases (no more items, loading state, error state)

**Deployment**:
- No backend changes required
- No breaking changes to existing functionality
- Forward-compatible (existing pagination still works if JS fails)
- No data migration needed

**Rollback**:
- Simple: Revert to previous commit (button-based approach)
- No state or data to migrate back

**Testing checklist**:
- [ ] Automatic loading triggers when scrolling near bottom
- [ ] No duplicate requests during single scroll gesture
- [ ] Loading indicator appears and disappears correctly
- [ ] Works with filters and search (offset resets properly)
- [ ] Graceful degradation if IntersectionObserver unavailable
- [ ] Works with masonry layout (CSS multi-column)
- [ ] Mobile touch scrolling works correctly
- [ ] Fast scrolling doesn't skip pages
- [ ] Stopping scroll before bottom prevents unnecessary loading

## Open Questions

None - implementation approach is well-defined and straightforward.
