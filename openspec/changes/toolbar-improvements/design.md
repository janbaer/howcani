## Context

The Header component (`src/client/components/Header.svelte`) renders both desktop and mobile headers. It has separate Login/Logout buttons, and the mobile header has no logout mechanism. The user icon currently links to the user's items page on desktop but should serve as the unified auth control.

## Goals / Non-Goals

**Goals:**
- Unified authentication control via user icon (always visible)
- Mobile users can log out by clicking the user icon
- Cleaner UI by removing separate Login/Logout buttons
- Consistent behavior across desktop and mobile

**Non-Goals:**
- Adding a user dropdown/menu
- Adding avatar/profile image support
- Changing the items page link functionality (removed from user icon)

## Decisions

**User icon as unified auth control**: The user icon becomes a button that handles both login and logout. When authenticated, clicking logs out (calls `logout()` which navigates to `/login`). When not authenticated, clicking navigates to `/login`. This provides mobile logout functionality and simplifies the UI.

**Always visible**: The user icon is always shown regardless of the current page, removing the need for `isAuthPage` checks. This maintains consistent UI structure.

**Button ordering (desktop)**: New Question button moved before dark mode toggle, with user icon rightmost. Order: New Question → Dark mode → User icon.

**User icon tooltip**: Shows username when authenticated via HTML `title` attribute. No tooltip when not authenticated.

**User icon visual states**: Filled icon when authenticated, outline icon when not authenticated.

## Risks / Trade-offs

**Minimal risk**: All changes are purely presentational within a single component, using patterns already established in the codebase.
