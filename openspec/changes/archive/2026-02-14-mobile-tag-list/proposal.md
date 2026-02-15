## Why

The tag list sidebar is currently hidden on mobile devices, making tag-based navigation unavailable on phones. Mobile users need access to tags for filtering their knowledge base.

## What Changes

- Add hamburger button in the top-left corner of mobile header to toggle tag list visibility
- Implement floating/overlay tag list panel for mobile devices (slides in from left)
- Add responsive behavior for tablets:
  - Portrait mode: Show hamburger button, hide tag list by default (same as mobile)
  - Landscape mode: Always show tag list sidebar (same as desktop)
- Add click-outside-to-close behavior for mobile tag overlay
- Update Header component with hamburger button and responsive logic
- Update tag list visibility logic based on viewport size and orientation

## Capabilities

### New Capabilities
- `mobile-navigation`: Hamburger menu and responsive tag list navigation for mobile and tablet devices

### Modified Capabilities
- `frontend-ui`: Tag list visibility now responsive to device size and orientation

## Impact

- `src/client/components/Header.svelte` — add hamburger button for mobile/tablet portrait
- `src/client/pages/ItemList.svelte` — add overlay tag list panel with responsive visibility
- CSS/styling — floating panel styles, hamburger icon, responsive breakpoints for tablet orientation
