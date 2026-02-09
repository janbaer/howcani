## Why

The item management backend (CRUD endpoints) is fully implemented and tested, but the frontend only supports read-only browsing. Users cannot create, edit, or delete items through the UI, limiting the application to a static FAQ viewer. This change completes the item management feature by adding the missing create/edit/delete UI.

## What Changes

- Add API client methods for item creation, update, and deletion
- Add service layer methods that wrap API calls with error handling
- Create item form modal with Carta markdown editor for create/edit operations
- Create delete confirmation modal for item deletion
- Enable "Add Item" button (currently disabled) to open create modal
- Add edit/delete buttons to item cards and detail page (owner-only, hover-reveal)
- Implement optimistic UI updates with rollback on error
- Add keyboard shortcuts (Enter for edit, Delete/Backspace for delete confirmation)
- Integrate Carta markdown editor with existing Marked + DOMPurify rendering pipeline
- Add tag autocomplete input for selecting/creating tags during item creation/editing

## Capabilities

### New Capabilities

None - item management backend capability already exists with full CRUD spec.

### Modified Capabilities

- `frontend-ui`: Add implementation notes for Carta markdown editor integration, update dependencies to include `carta-md` and `@cartamd/plugin-code`, document how Carta uses existing Marked + DOMPurify rendering pipeline

## Impact

**Frontend code:**
- `src/client/lib/api.ts` - Add `items.create()`, `items.update()`, `items.delete()` methods
- `src/client/lib/items.svelte.ts` - Add service layer methods for create/update/delete
- `src/client/components/ItemFormModal.svelte` - New component (create/edit)
- `src/client/components/ItemDeleteConfirmModal.svelte` - New component
- `src/client/pages/ItemList.svelte` - Enable add button, add edit/delete buttons to cards
- `src/client/pages/ItemDetail.svelte` - Add edit/delete buttons to header
- `src/index.html` - Carta editor styling integration

**Dependencies:**
- Add `carta-md` (~35KB)
- Add `@cartamd/plugin-code` (~15KB)
- Total bundle increase: ~50KB gzipped

**Backend:**
- No changes - all endpoints already exist and tested

**Specs:**
- Update `openspec/specs/frontend-ui/spec.md` implementation notes with Carta configuration
