## Why

The tag list sidebar disappears when users scroll down to view more items, forcing them to scroll back to the top to select or change tag filters. This creates friction in the filtering workflow and interrupts the browsing experience, especially on pages with many items.

## What Changes

- Make the tag sidebar sticky/fixed so it remains visible during vertical scrolling
- Ensure the sidebar stays within viewport bounds and doesn't overlap with header or footer
- Maintain responsive behavior on mobile devices (sidebar may collapse or use different positioning)
- Preserve existing tag filtering functionality while improving accessibility

## Capabilities

### New Capabilities
<!-- No new capabilities - this is a UI enhancement -->

### Modified Capabilities
- `frontend-ui`: Tag sidebar positioning changes from default to sticky/fixed positioning, affecting scroll behavior and viewport interaction. The sidebar will remain visible during scroll instead of scrolling out of view with page content.

## Impact

**Affected files:**
- `src/client/components/TagSidebar.svelte` - Add sticky positioning styles
- `src/client/components/Layout.svelte` - May need layout adjustments for sticky sidebar
- `src/client/pages/ItemList.svelte` - Container adjustments if needed for sticky positioning

**User Experience:**
- Tags remain accessible at all scroll positions
- No need to scroll back to top to change filters
- Improved workflow for browsing and filtering large item lists

**Technical:**
- CSS position: sticky or position: fixed
- May need to handle viewport boundaries and scroll containers
- Consider mobile/responsive behavior (sidebar may need different treatment on small screens)
- No breaking changes to tag filtering logic or API
