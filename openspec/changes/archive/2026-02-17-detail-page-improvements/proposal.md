## Why

The detail page shows timestamps date-only and uses a different edit icon than the listview, creating visual inconsistency. Issue #13 addresses both.

## What Changes

- Show timestamps with date and time on the detail page for desktop/tablet displays (matching the listview); keep date-only on mobile
- Use the same edit icon on the detail page as on the listview item cards

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `frontend-ui`: Detail page timestamp format and edit icon now consistent with listview

## Impact

- Closes Forgejo issue #13
- Only `src/client/pages/ItemDetail.svelte` is affected
- No API changes
