## 1. Update Pagination Logic

- [x] 1.1 Change PAGE_SIZE from constant to $derived reactive value based on viewport height
- [x] 1.2 Implement calculation: `Math.max(10, Math.floor(window.innerHeight / 200) * 6)`
- [x] 1.3 Verify PAGE_SIZE updates correctly on different viewport sizes (mobile, tablet, desktop)
- [x] 1.4 Test PAGE_SIZE recalculates on window resize and orientation change

## 2. Add Sentinel Element

- [x] 2.1 Create sentinel element div in template after the items masonry container
- [x] 2.2 Add conditional rendering: only show sentinel when hasMore is true
- [x] 2.3 Bind sentinel element to a variable using `bind:this={sentinelElement}`
- [x] 2.4 Add accessible loading indicator content inside sentinel element

## 3. Implement IntersectionObserver

- [x] 3.1 Create IntersectionObserver configuration object with rootMargin: "100px" and threshold: 0.1
- [x] 3.2 Implement observer callback that checks loading state and hasMore before calling loadMore()
- [x] 3.3 Set up $effect that creates observer when sentinelElement and hasMore are available
- [x] 3.4 Add observer cleanup in $effect return function (disconnect on unmount)
- [x] 3.5 Ensure observer only activates after initial items are loaded (not during first render)
- [x] 3.6 Test observer recreates correctly when hasMore changes from false to true

## 4. Update Loading Indicator UI

- [x] 4.1 Design loading indicator component/section showing "Loading more items..." text
- [x] 4.2 Add spinner or loading animation to the indicator
- [x] 4.3 Show loading indicator in sentinel element area when loading is true
- [x] 4.4 Hide loading indicator when loading is false
- [x] 4.5 Style loading indicator to match existing design system (font-mono, text colors)

## 5. Remove Manual "Load more" Button

- [x] 5.1 Remove the button element and its click handler from template (lines 433-444)
- [x] 5.2 Verify loadMore() function is still available for observer to call
- [x] 5.3 Remove any button-specific styling that's no longer needed
- [x] 5.4 Ensure hasMore conditional block now contains sentinel instead of button

## 6. Handle Edge Cases

- [x] 6.1 Verify no loading triggered during initial component mount (before first items loaded)
- [x] 6.2 Test behavior when filters are applied (offset resets, observer works with filtered results)
- [x] 6.3 Test behavior when search query changes (offset resets, observer works with search results)
- [x] 6.4 Verify observer doesn't trigger when no more items available (hasMore is false)
- [x] 6.5 Test error handling: loading indicator disappears on error, retry works on next scroll
- [x] 6.6 Verify duplicate request prevention: rapid scrolling only triggers one request at a time

## 7. Testing and Validation

- [x] 7.1 Test on mobile viewport (375px width): verify ~20 items load per page
- [x] 7.2 Test on tablet viewport (768px width): verify ~30 items load per page
- [x] 7.3 Test on desktop viewport (1920px width): verify ~40-50 items load per page
- [x] 7.4 Test smooth scrolling: verify scroll stays smooth at 60fps without jank
- [x] 7.5 Test automatic loading: scroll to near bottom, verify items load automatically
- [x] 7.6 Test scroll position: verify position doesn't jump when new items are added
- [x] 7.7 Test with slow network: verify loading indicator appears and works correctly
- [x] 7.8 Test fast scrolling: verify loading triggers appropriately without skipping pages
- [x] 7.9 Test masonry layout compatibility: verify new items fit into masonry columns correctly
- [x] 7.10 Run Biome linter and fix any issues

## 8. Code Cleanup and Documentation

- [x] 8.1 Add code comments explaining IntersectionObserver setup and configuration choices
- [x] 8.2 Add comment explaining PAGE_SIZE calculation rationale
- [x] 8.3 Remove any unused variables or functions related to old button approach
- [x] 8.4 Verify no console errors or warnings in browser DevTools
- [x] 8.5 Check accessibility: ensure loading indicator is announced to screen readers

## 9. Final Verification

- [x] 9.1 Start dev server and manually test the complete flow
- [x] 9.2 Verify infinite scroll works correctly with empty state (no items)
- [x] 9.3 Verify infinite scroll works with single page of results (no sentinel shown)
- [x] 9.4 Test with real data: scroll through multiple pages of items
- [x] 9.5 Compare behavior with design requirements and spec scenarios
- [x] 9.6 Take screenshots or record video showing infinite scroll in action
