# Change: Implement Tag Management UI

## Why

Users can view and filter by tags, but cannot manage them. The backend API supports tag deletion (`DELETE /api/:username/tags/:id`), but there's no UI to rename tags, change colors, or delete unused tags. This creates a frustrating experience where users accumulate tags but can't refine their organization system.

## What Changes

- Add tag edit modal/popover for renaming tags and changing colors
- Add tag delete confirmation dialog with "in use" warning
- Add edit/delete buttons to TagSidebar component (currently visible on hover but non-functional)
- Add color picker component for selecting tag colors
- Integrate with existing tag API endpoints (`DELETE /api/:username/tags/:id`)
- Handle error states (tag in use, not found, unauthorized)
- Update tag list optimistically after edits/deletes

## Capabilities

### New Capabilities
<!-- No new capabilities - this is extending existing frontend-ui -->

### Modified Capabilities
- `frontend-ui`: Add tag management requirements (edit name/color, delete with confirmation, color picker)

## Impact

**Affected Components:**
- `src/client/components/TagSidebar.svelte` (add edit/delete handlers)
- `src/client/components/TagEditModal.svelte` (new - edit name/color)
- `src/client/components/TagDeleteConfirmModal.svelte` (new - delete confirmation)
- `src/client/components/ColorPicker.svelte` (new - color selection)
- `src/client/lib/api.ts` (add `tags.update()` and `tags.delete()` methods)
- `src/client/lib/items.svelte.ts` (potentially add tag service methods)

**Backend API:**
- Uses existing `DELETE /api/:username/tags/:id` endpoint
- May need `PUT /api/:username/tags/:id` endpoint for renaming/recoloring (currently not implemented)

**User Workflows:**
- Owner can edit tag name and color from sidebar
- Owner can delete unused tags from sidebar
- System prevents deleting tags that are in use (shows count)
- Tag changes reflect immediately in sidebar and item cards
