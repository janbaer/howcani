## Why

The header toolbar has usability issues: separate Login/Logout buttons create visual clutter, and the mobile header lacks any logout mechanism. The user icon should serve as the unified authentication control across all viewports.

## What Changes

- Replace separate Login/Logout buttons with a unified user icon button
- User icon always visible (rightmost position in desktop/mobile headers)
- When logged in: filled icon, click logs out and navigates to `/login`
- When logged out: outline icon, click navigates to `/login`
- User icon tooltip shows username when authenticated
- Desktop button order: New Question → Dark mode → User icon

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `frontend-ui`: Header toolbar conditional rendering rules for auth buttons and user icon visual states

## Impact

- `src/client/components/Header.svelte` — conditional rendering logic for Login button, user icon tooltip and styling
