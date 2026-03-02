## Why

The settings page is inaccessible from the mobile header bar: the desktop header includes a gear icon link to `/settings` guarded by authentication, but the mobile header omits this link entirely. Mobile users must navigate to settings by other means (e.g., manual URL entry), which is an inconsistent and poor UX.

## What Changes

- Add a settings icon link to the mobile header's right-side action bar, visible only when authenticated, matching the desktop pattern.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `frontend-ui`: The mobile header navigation now includes a settings entry point, extending the authenticated navigation pattern to all viewports.

## Impact

- `src/client/components/layout/Header.svelte`: Add settings `<a href="/settings">` button with gear SVG icon inside the mobile header's right-side flex container, wrapped in `{#if authState.isAuthenticated}`.
