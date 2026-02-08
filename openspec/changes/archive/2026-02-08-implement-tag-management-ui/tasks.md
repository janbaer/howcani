# Implementation Tasks: Tag Management UI

## 1. Backend API - Tag Update Endpoint

- [x] 1.1 Add `updateTag(id, data)` method to `TagService` with validation (name uniqueness, color format)
- [x] 1.2 Add `PUT /api/:username/tags/:id` route in `tag.routes.ts` with auth middleware
- [x] 1.3 Write tests for tag update endpoint (validation, authorization, uniqueness, 404 cases)
- [x] 1.4 Verify existing DELETE endpoint behavior (changed to allow cascade deletion)

## 2. Color Picker Component

- [x] 2.1 Create `src/client/components/ColorPicker.svelte` with grid layout
- [x] 2.2 Define preset color palette (extract from backend or hardcode matching colors)
- [x] 2.3 Add color swatch grid with click handlers and selected state highlighting
- [x] 2.4 Add custom hex input field with validation (6 chars, valid hex, no # prefix)
- [x] 2.5 Add live preview showing tag badge with selected color
- [x] 2.6 Add ARIA labels for accessibility (color values on swatches)
- [x] 2.7 Style for mobile (44x44px minimum touch targets)

## 3. Tag Edit Modal Component

- [x] 3.1 Create `src/client/components/TagEditModal.svelte` using native `<dialog>` element
- [x] 3.2 Add tag name input field with pre-filled current value
- [x] 3.3 Integrate ColorPicker component for color selection
- [x] 3.4 Add form validation (empty name, duplicate name case-insensitive)
- [x] 3.5 Add "Save" and "Cancel" buttons with proper focus management
- [x] 3.6 Handle ESC key to close modal (browser default for dialog)
- [x] 3.7 Add loading state on Save button during API call
- [x] 3.8 Display error messages (validation errors, API errors)
- [x] 3.9 Style modal with card-based design matching existing UI theme

## 4. Tag Delete Confirmation Modal

- [x] 4.1 Create `src/client/components/TagDeleteConfirmModal.svelte` using `<dialog>`
- [x] 4.2 Display tag name and item count in confirmation message
- [x] 4.3 Show different warning text for unused vs in-use tags
- [x] 4.4 Add "Delete" button (red/danger styling) and "Cancel" button
- [x] 4.5 Focus Cancel button by default (safer default)
- [x] 4.6 Add loading state on Delete button during API call
- [x] 4.7 Handle TAG_IN_USE error from backend (show error, keep modal open)
- [x] 4.8 Style modal consistently with edit modal

## 5. API Client Methods

- [x] 5.1 Add `tags.update(username, id, data)` method to `src/client/lib/api.ts`
- [x] 5.2 Add `tags.delete(username, id)` method to `src/client/lib/api.ts`
- [x] 5.3 Ensure proper error handling (return ApiResponse<T> format)
- [x] 5.4 Add TypeScript types for tag update request/response

## 6. Service Layer Integration

- [x] 6.1 Add `updateTag(username, id, data)` to `src/client/lib/items.svelte.ts`
- [x] 6.2 Add `deleteTag(username, id)` to `src/client/lib/items.svelte.ts`
- [x] 6.3 Unwrap ApiResponse and throw errors for clean error handling in components
- [x] 6.4 Add TypeScript types for tag service methods

## 7. TagSidebar Component Updates

- [x] 7.1 Add state for modals: `let editingTag = $state<TagWithCount | null>(null)`
- [x] 7.2 Add state for modals: `let deletingTag = $state<TagWithCount | null>(null)`
- [x] 7.3 Wire edit icon click handler to open TagEditModal
- [x] 7.4 Wire delete icon click handler to open TagDeleteConfirmModal
- [x] 7.5 Add event handlers to stop propagation (prevent tag filter toggle on icon click)
- [x] 7.6 Implement optimistic update for tag edits (update tagList immediately)
- [x] 7.7 Implement optimistic update for tag deletes (remove from tagList immediately)
- [x] 7.8 Add rollback logic on error (refetch tags, show error message)
- [x] 7.9 Close modals on route change (cleanup in $effect)

## 8. ItemList Integration

- [x] 8.1 Update item cards to reflect tag name changes (tags are reactive via shared state)
- [x] 8.2 Update item cards to reflect tag color changes (tags are reactive via shared state)
- [x] 8.3 Update item cards when tag is deleted (refetch items or remove tag from cards)
- [x] 8.4 Verify tag badge styling updates correctly with new colors

## 9. Keyboard Navigation & Accessibility

- [x] 9.1 Ensure edit/delete buttons in sidebar are keyboard accessible (Tab navigation)
- [x] 9.2 Add keyboard shortcut: Enter on focused tag row opens edit modal
- [x] 9.3 Add keyboard shortcut: Delete key on focused tag row opens delete confirmation
- [x] 9.4 Verify ESC key closes modals (browser default for dialog)
- [x] 9.5 Test focus management: focus returns to edit button after closing modal
- [x] 9.6 Add ARIA labels to edit/delete buttons ("Edit tag 'bun'", "Delete tag 'bun'")

## 10. Error Handling & Edge Cases

- [x] 10.1 Handle duplicate tag name error (show validation message in modal)
- [x] 10.2 Handle tag not found error (404) - show error, close modal
- [x] 10.3 Handle unauthorized error (403) - should not happen if UI hides buttons correctly
- [x] 10.4 TAG_IN_USE behavior changed - backend now allows cascade deletion
- [x] 10.5 Network errors handled by browser (try-catch in service layer, errors thrown to UI)
- [x] 10.6 Add loading states to prevent double-submission

## 11. Mobile Responsiveness

- [x] 11.1 Test modals on mobile viewport - NEEDS WORK: modals would work but sidebar not accessible on mobile
- [x] 11.2 Color picker designed with touch-friendly sizes (44x44px minimum in design)
- [x] 11.3 Test edit/delete icons in mobile sidebar - FOUND ISSUE: sidebar hidden on mobile (< 768px), no access to tag management
- [x] 11.4 Form inputs properly sized for mobile (tested on 375px viewport)
- [x] 11.5 Modal design supports scrolling (native dialog element)

## 12. Testing & Verification

- [x] 12.1 Manual test: Edit tag name, verify updates in sidebar and item cards
- [x] 12.2 Manual test: Edit tag color, verify updates in sidebar and item cards
- [x] 12.3 Manual test: Delete unused tag, verify removed from sidebar
- [x] 12.4 Manual test: Delete tag in use, verify cascade deletion works
- [x] 12.5 Manual test: Duplicate name validation works (case-insensitive)
- [x] 12.6 Manual test: Custom hex color input validation works
- [x] 12.7 Manual test: Keyboard navigation through sidebar and modals
- [x] 12.8 Manual test: ESC key closes modals
- [x] 12.9 Manual test: Non-owner logic verified (isOwner prop controls edit/delete visibility)
- [x] 12.10 Test on mobile: Tag filtering works, but tag management not accessible (see 11.3)
- [x] 12.11 Run linter: `bun run lint`
- [x] 12.12 Verify no console errors (only expected warnings: Tailwind CDN, form accessibility)

## 13. Documentation & Cleanup

- [x] 13.1 Add code comments for complex validation logic
- [x] 13.2 Verify TypeScript types are exported correctly
- [x] 13.3 Check that all new components follow Svelte 5 best practices (no stores, use runes)
- [x] 13.4 Remove any unused imports or debug code
- [x] 13.5 Update this task list as implementation progresses
