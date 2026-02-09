# Implementation Tasks: Item Management UI

## 1. Dependencies & Setup

- [x] 1.1 Add `codemirror` to package.json with version `^5.65.18`
- [x] 1.2 Run `bun install` to install CodeMirror dependencies
- [x] 1.3 Create `MarkdownEditor.svelte` wrapper component for CodeMirror
- [x] 1.4 Configure CodeMirror with GFM mode and theme integration
- [x] 1.5 Test CodeMirror basic functionality (can edit markdown with syntax highlighting)

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
- [x] 4.4 Integrate CodeMirror markdown editor for answer field via MarkdownEditor component
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
- [x] 4.15 Override CodeMirror styles to match application theme (monospace, dark mode)

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

- [x] 6.1 Enable "New Question" button via global modal store
- [x] 6.2 Create global modal store in `create-modal.svelte.ts`
- [x] 6.3 Add state: `let editingItem = $state<Item | null>(null)`
- [x] 6.4 Add state: `let deletingItem = $state<Item | null>(null)`
- [x] 6.5 Wire global modal to open ItemFormModal in create mode
- [x] 6.6 Add edit/delete buttons to item cards (hover-reveal, owner-only)
- [x] 6.7 Wire edit button click to open ItemFormModal in edit mode
- [x] 6.8 Wire delete button click to open ItemDeleteConfirmModal
- [x] 6.9 Add event handlers to stop propagation (prevent card click on icon click)
- [x] 6.10 Implement create via handleSaveItem (calls createItem service)
- [x] 6.11 Implement update via handleSaveItem (calls updateItem service)
- [x] 6.12 Implement delete via handleDeleteItem (calls deleteItem service)
- [x] 6.13 Add error handling (catch errors, show in modal)
- [x] 6.14 Close modals after successful operations
- [x] 6.15 Reload items after create/update/delete operations
- [x] 6.16 Keep floating "Add question" button for mobile users

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

## 8. CodeMirror Theme Styling

- [x] 8.1 Add CodeMirror CSS override in `MarkdownEditor.svelte` component
- [x] 8.2 Override `.CodeMirror` background, foreground, border colors (HSL vars)
- [x] 8.3 Apply JetBrains Mono font to editor
- [x] 8.4 Override `.CodeMirror-gutters` background and border
- [x] 8.5 Test dark mode support (CodeMirror inherits CSS variable changes)
- [x] 8.6 Style `.CodeMirror-cursor`, `.CodeMirror-selected`, and line numbers
- [x] 8.7 Update `.code-preview` to be theme-aware (light/dark mode support)

## 9. Mobile Responsiveness

- [ ] 9.1 Test ItemFormModal on mobile viewport (375px width)
- [ ] 9.2 Ensure Carta editor is usable on touch devices (toolbar, preview toggle)
- [ ] 9.3 Test tag autocomplete dropdown on mobile (tap targets, scrolling)
- [ ] 9.4 Verify "Add Item" button placement on mobile (accessible, not obscured)
- [ ] 9.5 Test edit/delete buttons on item cards on mobile (touch-friendly)
- [ ] 9.6 Ensure modal scrolls properly if content exceeds viewport height

## 10. Testing & Verification

- [x] 10.1 Manual test: Create new item, verify appears in list
- [x] 10.2 Manual test: Edit item question via item list
- [x] 10.3 Manual test: Edit item answer, verify markdown edits work
- [x] 10.4 Manual test: Edit item tags via tag autocomplete
- [x] 10.5 Manual test: Delete item via delete confirmation modal
- [x] 10.6 Manual test: Tag autocomplete shows existing tags
- [x] 10.7 Manual test: Create new tag from autocomplete works
- [x] 10.8 Manual test: CodeMirror editor works with markdown syntax
- [x] 10.9 Manual test: Keyboard shortcuts work (Ctrl+Enter, Esc)
- [x] 10.10 Manual test: Validation errors show (empty question)
- [x] 10.11 Manual test: Error display in modal
- [x] 10.12 Manual test: isOwner controls visibility of edit/delete buttons on cards
- [ ] 10.13 Manual test: Non-owners cannot see management controls (needs multi-user test)
- [ ] 10.14 Test on mobile: Create, edit, delete flows work on touch
- [x] 10.15 Run linter: `bun run lint` (passing)
- [x] 10.16 Verify no console errors (browser console clean)
- [x] 10.17 Test dark mode: All components render correctly in dark mode
- [x] 10.18 Test light mode: Code previews adapt to theme correctly

## 11. Documentation & Cleanup

- [x] 11.1 Code includes inline comments for complex logic
- [x] 11.2 TypeScript types exported correctly from api.ts and items.svelte.ts
- [x] 11.3 All components follow Svelte 5 best practices (runes, $effect, $derived.by)
- [x] 11.4 Removed unused imports and debug code
- [x] 11.5 Update delta spec to reflect CodeMirror implementation instead of Carta
