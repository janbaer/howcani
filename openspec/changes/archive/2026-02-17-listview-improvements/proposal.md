## Why

The item list view lacks useful metadata and truncates tags unnecessarily, making it harder for users to understand item context at a glance. Both issues (#11 and #12) address information density improvements to the listview.

## What Changes

- Display both `created_at` and `updated_at` timestamps on item cards on desktop/tablet viewports, formatted without seconds
- Show only `created_at` on mobile viewports (space-constrained), formatted without seconds
- Show all tags on item cards when space allows — stop truncating the tag list

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `frontend-ui`: Item list card now shows both timestamps (responsive) and full tag list without truncation

## Impact

- Closes Forgejo issue #11 (show all labels without truncation)
- Closes Forgejo issue #12 (show both timestamps without seconds, responsive)
- Affects item card component(s) in `src/client/`
- No API changes required — `created_at` and `updated_at` are already returned by the items API
