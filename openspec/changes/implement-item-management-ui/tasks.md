# Implementation Tasks: Item Management UI

## 1. Dependencies & Setup

- [x] 1.1 Add `carta-md` to package.json with version `^4.0.0`
- [x] 1.2 Add `@cartamd/plugin-code` to package.json with version `^4.0.0`
- [x] 1.3 Run `bun install` to install Carta dependencies
- [x] 1.4 Create Carta configuration instance with Marked + DOMPurify integration
- [x] 1.5 Test Carta basic functionality (can render markdown in preview)

## 2. API Client Layer

- [x] 2.1 Add `items.create(username, data)` method to `src/client/lib/api.ts`
- [x] 2.2 Add `items.update(username, id, data)` method to `src/client/lib/api.ts`
- [x] 2.3 Add `items.delete(username, id)` method to `src/client/lib/api.ts`
- [x] 2.4 Add TypeScript types for item create/update request bodies
- [x] 2.5 Ensure all methods return `ApiResponse<T>` format for error handling

## 3. Service Layer

- [x] 3.1 Add `createItem(username, data)` to `src/client/lib/items.svelte.ts`
- [x] 3.2 Add `updateItem(username, id, data)` to `src/client/lib/items.svelte.ts`
- [x] 3.3 Add `deleteItem(username, id)` to `src/client/lib/items.svelte.ts`
- [x] 3.4 Unwrap ApiResponse and throw errors for clean error handling in components
- [x] 3.5 Add TypeScript types for service layer method signatures

## 4. Item Form Modal Component

- [x] 4.1 Create `src/client/components/ItemFormModal.svelte` with native `<dialog>`
- [x] 4.2 Add Props interface: `item: Item | null`, `onSave`, `onClose`, `existingTags`
- [x] 4.3 Add question input field with validation (required, non-empty)
- [x] 4.4 Integrate Carta markdown editor for answer field with configured instance
- [x] 4.5 Add tag input with autocomplete (chip-based, keyboard flow)
- [x] 4.6 Implement tag dropdown with filter (debounced 300ms)
- [x] 4.7 Add "Create new tag" option in dropdown for non-existing tags
- [x] 4.8 Add form validation (question required, answer optional, tags optional)
- [x] 4.9 Add loading state during save (disable inputs, show spinner on button)
- [x] 4.10 Add error display for API errors (show inline, keep modal open)
- [x] 4.11 Handle ESC key to close modal (browser default for `<dialog>`)
- [x] 4.12 Handle Ctrl+Enter to submit form (keyboard shortcut)
- [x] 4.13 Focus question input when modal opens
- [x] 4.14 Style modal to match theme (card-based design, HSL variables)
- [x] 4.15 Override Carta styles to match application theme (monospace, dark mode)

## 5. Delete Confirmation Modal

- [x] 5.1 Create `src/client/components/ItemDeleteConfirmModal.svelte` with `<dialog>`
- [x] 5.2 Add Props interface: `item: Item | null`, `onDelete`, `onClose`
- [x] 5.3 Show item question in confirmation message
- [x] 5.4 Add "Delete" button with danger styling (red)
- [x] 5.5 Add "Cancel" button (focus by default for safety)
- [x] 5.6 Add loading state during delete (disable buttons, spinner on Delete)
- [x] 5.7 Handle ESC key to close modal
- [x] 5.8 Style modal to match theme (consistent with ItemFormModal)

## 6. ItemList Page Integration

- [ ] 6.1 Remove `disabled` attribute from "Add Item" button
- [ ] 6.2 Add state: `let creatingItem = $state<boolean>(false)`
- [ ] 6.3 Add state: `let editingItem = $state<Item | null>(null)`
- [ ] 6.4 Add state: `let deletingItem = $state<Item | null>(null)`
- [ ] 6.5 Wire "Add Item" button click to open ItemFormModal in create mode
- [ ] 6.6 Add edit/delete icons to item cards (hover-reveal, owner-only)
- [ ] 6.7 Wire edit icon click to open ItemFormModal in edit mode
- [ ] 6.8 Wire delete icon click to open ItemDeleteConfirmModal
- [ ] 6.9 Add event handlers to stop propagation (prevent card click on icon click)
- [ ] 6.10 Implement optimistic create (add to itemList immediately)
- [ ] 6.11 Implement optimistic update (update itemList immediately)
- [ ] 6.12 Implement optimistic delete (remove from itemList immediately)
- [ ] 6.13 Add rollback logic on error (refetch items, show error message)
- [ ] 6.14 Add keyboard shortcuts: Enter on card opens edit, Delete opens delete confirm
- [ ] 6.15 Close modals on route change (cleanup in $effect)
- [ ] 6.16 Update button text from "Add your first question" to "Add Item" when items exist

## 7. ItemDetail Page Integration

- [ ] 7.1 Add edit/delete buttons to detail page header (always visible, not hover)
- [ ] 7.2 Add state for edit modal: `let editingItem = $state<Item | null>(null)`
- [ ] 7.3 Add state for delete modal: `let deletingItem = $state<Item | null>(null)`
- [ ] 7.4 Wire edit button click to open ItemFormModal with current item
- [ ] 7.5 Wire delete button click to open ItemDeleteConfirmModal
- [ ] 7.6 Show edit/delete buttons only if isOwner (check authState)
- [ ] 7.7 On successful edit, update item display optimistically
- [ ] 7.8 On successful delete, navigate back to item list (`/{username}/items`)
- [ ] 7.9 Add rollback logic on error (restore original item, show error)

## 8. Carta Theme Styling

- [ ] 8.1 Add Carta CSS override in `src/index.html` or separate stylesheet
- [ ] 8.2 Override `.carta-editor` background, foreground, border colors (HSL vars)
- [ ] 8.3 Apply JetBrains Mono font to editor textarea
- [ ] 8.4 Ensure `.carta-preview` uses existing `.prose` styles
- [ ] 8.5 Test dark mode support (Carta inherits CSS variable changes)
- [ ] 8.6 Adjust toolbar button colors to match theme
- [ ] 8.7 Test editor on mobile viewport (touch-friendly, readable)

## 9. Mobile Responsiveness

- [ ] 9.1 Test ItemFormModal on mobile viewport (375px width)
- [ ] 9.2 Ensure Carta editor is usable on touch devices (toolbar, preview toggle)
- [ ] 9.3 Test tag autocomplete dropdown on mobile (tap targets, scrolling)
- [ ] 9.4 Verify "Add Item" button placement on mobile (accessible, not obscured)
- [ ] 9.5 Test edit/delete buttons on item cards on mobile (touch-friendly)
- [ ] 9.6 Ensure modal scrolls properly if content exceeds viewport height

## 10. Testing & Verification

- [ ] 10.1 Manual test: Create new item, verify appears in list and detail view
- [ ] 10.2 Manual test: Edit item question, verify updates everywhere
- [ ] 10.3 Manual test: Edit item answer, verify markdown renders correctly
- [ ] 10.4 Manual test: Edit item tags, verify tag badges update
- [ ] 10.5 Manual test: Delete item, verify removed from list
- [ ] 10.6 Manual test: Tag autocomplete shows existing tags
- [ ] 10.7 Manual test: Create new tag from autocomplete works
- [ ] 10.8 Manual test: Carta preview matches final rendered view
- [ ] 10.9 Manual test: Keyboard shortcuts work (Ctrl+Enter, Esc, Enter, Delete)
- [ ] 10.10 Manual test: Validation errors show (empty question, etc.)
- [ ] 10.11 Manual test: API errors display correctly (network error, 500, etc.)
- [ ] 10.12 Manual test: Optimistic updates rollback on error
- [ ] 10.13 Manual test: isOwner controls visibility of edit/delete buttons
- [ ] 10.14 Manual test: Non-owners cannot see management controls
- [ ] 10.15 Test on mobile: Create, edit, delete flows work on touch
- [ ] 10.16 Run linter: `bun run lint`
- [ ] 10.17 Verify no console errors (check browser console)
- [ ] 10.18 Test dark mode: All components render correctly in dark mode

## 11. Documentation & Cleanup

- [ ] 11.1 Add code comments for complex validation logic
- [ ] 11.2 Verify TypeScript types are exported correctly
- [ ] 11.3 Check that all components follow Svelte 5 best practices (runes, no stores)
- [ ] 11.4 Remove any unused imports or debug code
- [ ] 11.5 Update main spec with Carta implementation notes (sync delta spec)
