## Context

The item management backend is complete with fully tested CRUD endpoints (POST/PUT/DELETE for items). The frontend currently implements only read operations (ItemList, ItemDetail pages). The existing architecture follows a three-layer pattern: Pages/Components → Service Layer (`lib/*.svelte.ts`) → API Client (`lib/api.ts`).

Recent work on tag management UI established patterns for modal-based editing using native `<dialog>` elements, Svelte 5 runes ($state, $derived, $effect), and optimistic updates with error rollback.

**Constraints:**
- Must follow existing service layer pattern (don't call API directly from components)
- Use Svelte 5 runes (no stores)
- Native `<dialog>` for modals (no modal library)
- Developer-focused UX (keyboard shortcuts, minimal chrome)
- Bundle size awareness (~50KB increase acceptable for quality editor)

**Current State:**
- Backend: ✅ Complete (all endpoints exist and tested)
- Frontend: 🟡 Read-only (browsing works, mutations missing)
- Pattern: Tag management UI recently completed, provides reference implementation

## Goals / Non-Goals

**Goals:**
- Enable item creation, editing, and deletion through the UI
- Provide rich markdown editing experience with live preview
- Maintain consistency with existing tag management patterns
- Support keyboard-driven workflows for developer users
- Integrate tag autocomplete for efficient tagging

**Non-Goals:**
- WYSIWYG markdown editor (CodeMirror provides syntax highlighting, not visual formatting)
- Offline editing or draft persistence (items are created/updated immediately)
- Collaborative editing or conflict resolution
- Markdown templates or snippets (can be added later if requested)
- Advanced editor features (autocomplete, linting can be added later if needed)

## Decisions

### 1. Markdown Editor: CodeMirror

**Decision:** Use CodeMirror 5 with GitHub Flavored Markdown mode via a custom Svelte wrapper.

**Rationale:**
- **Proven compatibility:** CodeMirror 5 has excellent Svelte 5 compatibility through custom wrappers
- **Developer UX:** Syntax highlighting for markdown with line numbers provides clear visual structure
- **Lightweight:** ~40KB for core + GFM mode, smaller than initially estimated
- **Mature ecosystem:** Battle-tested editor with extensive documentation and community support
- **Clean integration:** Custom Svelte wrapper gives full control over initialization and reactivity
- **Why not Carta:** Initial choice, but encountered Svelte 5 compatibility issues during implementation. CodeMirror proved more reliable with better integration patterns.
- **Alternatives considered:**
  - Plain textarea (~0KB): Too minimal, no syntax feedback
  - CodeMirror 6 (~100KB): Modern but heavier, unnecessary for our use case
  - Carta (~50KB): Svelte-native but compatibility issues with Svelte 5 + native `<dialog>`

**Implementation:**
```typescript
// Custom Svelte wrapper component
editor = CodeMirror.fromTextArea(editorElement, {
  lineNumbers: true,
  lineWrapping: true,
  mode: {
    name: "gfm",
    highlightFormatting: true,
  },
  readOnly: disabled,
  placeholder: placeholder || "Enter markdown here...",
});

// Sync with Svelte state using $effect
$effect(() => {
  if (editor && editor.getValue() !== value) {
    const cursor = editor.getCursor();
    editor.setValue(value || "");
    editor.setCursor(cursor);
  }
});
```

The custom wrapper handles initialization in `onMount`, cleanup in `onDestroy`, and bidirectional sync with Svelte state using `$effect` runes. Markdown renders using the existing Marked + DOMPurify pipeline in read-only views.

### 2. Single Modal for Create/Edit

**Decision:** Use one `ItemFormModal` component that handles both create and edit modes.

**Rationale:**
- **Shared validation logic:** Both modes validate question (required), answer (optional), tags
- **Simpler maintenance:** One component, one set of styles, one place to fix bugs
- **Modal state pattern:** `item: Item | null` prop (null = create mode, Item = edit mode)
- **Precedent:** Tag management uses `TagEditModal` for editing (no create modal, tags created inline)

**Alternatives considered:**
- Separate `ItemCreateModal` and `ItemEditModal`: More code duplication, harder to keep consistent

### 3. Tag Input: Autocomplete Chips

**Decision:** Implement tag input as chips with autocomplete dropdown.

**Rationale:**
- **Visual feedback:** Users see selected tags as removable chips
- **Keyboard flow:** Type → select from dropdown → Enter adds chip → Backspace removes
- **Existing tags:** Dropdown shows existing tags from user's tag list
- **New tags:** Allow creating new tags inline (dropdown shows "Create 'tagname'" option)
- **Developer UX:** Keyboard-driven, no mouse required

**Implementation:**
- Fetch user's existing tags on modal open
- Debounce input (300ms) to filter tag list
- Show dropdown with matches + "Create new" option
- Enter key adds tag, creates chip
- Backspace on empty input removes last chip
- Click × on chip removes it

### 4. Button Placement: Hover-Reveal

**Decision:** Use hover-reveal pattern for edit/delete buttons on item cards, matching tag sidebar pattern.

**Rationale:**
- **Consistency:** Tag sidebar uses hover-reveal, maintains UI consistency
- **Clean UI:** Cards don't show management clutter when browsing
- **Owner-only:** isOwner prop controls visibility (non-owners never see buttons)
- **Keyboard accessible:** Buttons are in tab order, focused row shows buttons

**Locations:**
- **Item cards:** Hover shows edit/delete icons in top-right corner
- **Item detail page:** Edit/delete buttons always visible in header (not hover-reveal, since detail page is less dense)
- **Floating add button:** Bottom-right corner on desktop, accessible on mobile

### 5. Optimistic Updates with Rollback

**Decision:** Apply optimistic updates immediately, rollback on error.

**Rationale:**
- **Perceived performance:** UI feels instant, no waiting for server
- **Pattern consistency:** Tag management uses optimistic updates
- **Error handling:** On failure, rollback to previous state and show error

**Flow:**
```typescript
// Create: Optimistically add to list
itemList = [...itemList, newItem];
try {
  const created = await createItem(...);
  // Update with server-returned data (has id, timestamps)
  itemList = itemList.map(i => i === newItem ? created : i);
} catch (e) {
  // Rollback: remove from list
  itemList = itemList.filter(i => i !== newItem);
  // Show error
}

// Edit: Optimistically update in place
const original = itemList.find(i => i.id === editingItem.id);
itemList = itemList.map(i => i.id === editingItem.id ? updated : i);
try {
  await updateItem(...);
} catch (e) {
  // Rollback: restore original
  itemList = itemList.map(i => i.id === editingItem.id ? original : i);
}

// Delete: Optimistically remove
const deleted = itemList.find(i => i.id === id);
itemList = itemList.filter(i => i.id !== id);
try {
  await deleteItem(...);
} catch (e) {
  // Rollback: restore
  itemList = [...itemList, deleted];
}
```

### 6. Keyboard Shortcuts

**Decision:** Implement keyboard shortcuts for common actions.

**Rationale:**
- **Developer UX:** Keyboard-first workflow
- **Consistency:** Tag management has Enter/Delete shortcuts
- **Accessibility:** Keyboard navigation required for WCAG compliance

**Shortcuts:**
- **Ctrl+Enter** in modal: Submit form (create/edit)
- **Escape** in modal: Close modal (browser default for `<dialog>`)
- **Enter** on focused item card: Open edit modal
- **Delete/Backspace** on focused item card: Open delete confirmation

## Risks / Trade-offs

### Risk: Bundle Size Impact (~40KB)

**Mitigation:**
- CodeMirror 5 + GFM mode is ~40KB gzipped, acceptable for personal tool
- No other heavy dependencies added
- Can lazy-load CodeMirror if needed (only load when modal opens)

### Risk: CodeMirror Theming Complexity

**Mitigation:**
- CodeMirror provides CSS classes that can be overridden with global styles
- Uses existing HSL CSS variables for dark mode compatibility
- Successfully tested in both light and dark modes

### Risk: Tag Autocomplete UX on Mobile

**Mitigation:**
- Touch-friendly dropdown (44px minimum tap targets)
- Test on mobile viewport during implementation
- Fallback: Simple text input if autocomplete proves problematic

### Risk: Optimistic Update Conflicts

**Trade-off:**
- Optimistic updates can show stale data briefly if server rejects
- Acceptable for single-user FAQ tool (no collaborative editing)
- Error messages make it clear when something failed

### Risk: Markdown Editor Accessibility

**Mitigation:**
- CodeMirror supports full keyboard navigation
- Test with screen readers if needed
- Editor is a standard textarea element (good accessibility baseline)

## Migration Plan

No migration needed - this is additive functionality. Existing read-only browsing continues to work during implementation.

**Deployment:**
1. Add CodeMirror to package.json
2. Create custom MarkdownEditor Svelte wrapper component
3. Implement API client and service layer methods
4. Create modal components (ItemFormModal, ItemDeleteConfirmModal)
5. Wire up UI triggers (buttons, floating add button)
6. Test create/edit/delete flows on desktop and mobile
7. Deploy (no breaking changes)

**Rollback:**
- If issues arise, can quickly revert to disabled "Add Item" button
- Backend endpoints unaffected, read-only browsing still works
- No database migrations or data changes

## Open Questions

None - all design decisions made during exploration phase.
