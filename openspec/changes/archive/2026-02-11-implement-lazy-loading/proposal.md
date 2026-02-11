## Why

The current implementation requires users to manually click "Load more" to see additional items, creating friction in the browsing experience. Automatic lazy loading while scrolling eliminates this manual step and provides a seamless infinite scroll experience commonly expected in modern web applications.

## What Changes

- Replace manual "Load more" button with automatic loading triggered by scroll position
- Add visual loading indicator that appears while fetching more items
- Implement IntersectionObserver-based sentinel element to detect when user approaches bottom of page
- Trigger `loadMore()` function automatically when sentinel element becomes visible
- Prevent duplicate requests while loading is in progress
- Maintain existing pagination logic (offset/limit pattern)
- Make page size responsive to viewport height (mobile loads ~20 items, desktop ~40-50 items)

## Capabilities

### New Capabilities
- `infinite-scroll`: Automatic detection of scroll position and triggering of content loading when user approaches the bottom of the page, using IntersectionObserver API with a sentinel element

### Modified Capabilities
<!-- No existing requirement changes - this is purely additive UX enhancement -->

## Impact

**Affected files:**
- `src/client/pages/ItemList.svelte` - Replace "Load more" button with sentinel element, add IntersectionObserver setup in `$effect`, add loading state indicator

**User Experience:**
- Improved browsing flow - no manual clicking required
- Visual feedback during loading (spinner/indicator at bottom)
- Seamless content discovery as users scroll

**Technical:**
- Uses browser-native IntersectionObserver API (supported in all modern browsers)
- No breaking changes to existing API or data fetching logic
- Maintains current pagination with offset/limit pattern
