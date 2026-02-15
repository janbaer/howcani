# Design: Tag Management UI

## Context

The backend already supports tag deletion via `DELETE /api/:username/tags/:id` and returns tag-in-use errors (409 Conflict with `TAG_IN_USE` code). However, there's no `PUT` endpoint for updating tag name/color, so we need to add that first.

Current state:
- `TagSidebar.svelte` displays tags with edit/delete icons on hover (lines 38-46) but has no handlers
- Tags are reactive via `TagWithCount` type from the items service
- Project uses Svelte 5 with runes (`$state`, `$derived`, `$effect`)
- Modal pattern is not yet established (no existing modals in codebase)
- Color scheme uses HSL variables with teal/mint primary color (168° 35% 38%)

Constraints:
- No external UI libraries (Tailwind CSS via CDN only)
- Must follow Svelte 5 best practices (no stores, use runes)
- Service layer pattern: Pages/Components → Services → API client
- Mobile-responsive design required

## Goals / Non-Goals

**Goals:**
- Enable tag editing (name and color) from sidebar with validation
- Enable tag deletion with clear warnings about "in use" status
- Provide color picker with preset palette matching existing tag colors
- Maintain consistency with existing design system (teal/mint theme, card-based modals)
- Optimistic UI updates for instant feedback
- Keyboard navigation support for accessibility

**Non-Goals:**
- Bulk tag operations (merge, rename multiple)
- Tag categories or hierarchies
- Tag permissions beyond owner/non-owner
- Tag usage analytics or insights
- Drag-and-drop tag reordering

## Decisions

### Decision 1: Native Modal Pattern vs Library

**Choice:** Native HTML `<dialog>` element with Svelte 5 components

**Rationale:**
- No external dependencies (aligns with project constraints)
- Browser-native focus trapping and ESC key handling
- Accessible by default (ARIA roles built-in)
- Smaller bundle size than modal libraries
- Svelte 5's reactivity makes state management trivial

**Alternatives Considered:**
- ❌ Third-party modal library (svelte-modals, etc.): Adds dependency, overkill for simple modals
- ❌ Custom overlay with `position: fixed`: More complex, accessibility concerns, reinventing browser features

**Implementation Pattern:**
```svelte
<dialog bind:this={dialogElement}>
  <div class="modal-content">
    <!-- Modal body -->
  </div>
</dialog>

<script>
  let dialogElement: HTMLDialogElement;
  function openModal() { dialogElement?.showModal(); }
  function closeModal() { dialogElement?.close(); }
</script>
```

### Decision 2: Color Picker Implementation

**Choice:** Custom component with preset palette grid + hex input

**Rationale:**
- Matches tag auto-creation color palette (consistency)
- Simple to implement without library
- Prevents invalid colors (validation before submission)
- Mobile-friendly (large touch targets for swatches)

**Alternatives Considered:**
- ❌ Native `<input type="color">`: Poor mobile UX, doesn't restrict to palette
- ❌ Full spectrum color picker library: Overkill, large dependency, accessibility challenges
- ❌ Text input only: Error-prone, no visual preview

**Palette Source:**
Use the same color palette from tag auto-creation logic (needs to be extracted from backend to shared constant or API endpoint).

**Component API:**
```typescript
interface Props {
  value: string; // Current hex color (without #)
  onChange: (color: string) => void;
}
```

### Decision 3: Backend API for Tag Updates

**Choice:** Add `PUT /api/:username/tags/:id` endpoint

**Request:**
```json
{
  "name": "new-tag-name",
  "color": "ff5722"
}
```

**Response:**
```json
{
  "tag": {
    "id": "123",
    "name": "new-tag-name",
    "color": "ff5722",
    "item_count": 5
  }
}
```

**Validation:**
- Name: Required, 1-50 chars, case-insensitive uniqueness check
- Color: Required, 6-char hex (without #), case-insensitive

**Error Codes:**
- 400 Bad Request: Validation error (empty name, invalid color, duplicate name)
- 401 Unauthorized: Not authenticated
- 403 Forbidden: Not tag owner
- 404 Not Found: Tag doesn't exist

**Rationale:**
- RESTful pattern matches existing item CRUD
- Partial updates supported (can update name or color independently)
- Returns updated item_count to reflect current usage

### Decision 4: State Management for Modals

**Choice:** Component-level state with callback props

**Pattern:**
```typescript
// TagSidebar.svelte
let editingTag = $state<TagWithCount | null>(null);
let deletingTag = $state<TagWithCount | null>(null);

function handleEdit(tag: TagWithCount) {
  editingTag = tag;
}

function handleDelete(tag: TagWithCount) {
  deletingTag = tag;
}

function closeModals() {
  editingTag = null;
  deletingTag = null;
}
```

**Rationale:**
- Simple: No need for global modal manager
- Scoped: Modal state lives close to where it's used
- Svelte 5 runes make reactivity trivial
- Easy to test: Component-level state easier to mock

**Alternatives Considered:**
- ❌ Global modal store: Overcomplicated for 2-3 modals, breaks Svelte 5 patterns
- ❌ URL-based modal state: Unnecessary history pollution, breaks back button expectations

### Decision 5: Optimistic Updates

**Choice:** Update UI immediately, rollback on error

**Pattern:**
```typescript
async function updateTag(id: string, updates: Partial<Tag>) {
  // Optimistic update
  tagList = tagList.map(t => t.id === id ? { ...t, ...updates } : t);

  try {
    const result = await tags.update(id, updates);
    if (result.error) throw result.error;
    // Server response may differ, use it as source of truth
    tagList = tagList.map(t => t.id === id ? result.data : t);
  } catch (error) {
    // Rollback: refetch tags
    await loadTags();
    showError(error.message);
  }
}
```

**Rationale:**
- Instant feedback (feels fast)
- Server remains source of truth (refetch on error)
- Simple rollback strategy

**Risk Mitigation:**
- Always show loading state on buttons to indicate pending operation
- Clear error messages if rollback occurs
- Consider toast notifications for async feedback

### Decision 6: Tag Service Layer

**Choice:** Add tag operations to existing `items.svelte.ts` service

**Rationale:**
- Tags are tightly coupled to items (displayed together, updated together)
- Keeps service layer simple (one file instead of many)
- Easy to coordinate item + tag refetches

**Alternative Considered:**
- ❌ Separate `tags.svelte.ts`: Premature abstraction, tags rarely used independently

**Service API:**
```typescript
export async function updateTag(username: string, id: string, data: { name?: string; color?: string }) {
  const result = await tags.update(username, id, data);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function deleteTag(username: string, id: string) {
  const result = await tags.delete(username, id);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
```

## Risks / Trade-offs

### Risk: Tag Edit Race Conditions
**Scenario:** User opens edit modal, another tab/user modifies the same tag

**Mitigation:**
- Accept last-write-wins (simple, acceptable for single-user home lab)
- Server validates uniqueness on save (prevents duplicate names)
- Future: Add optimistic concurrency control (e.g., `version` field) if needed

### Risk: Color Picker Accessibility
**Scenario:** Color-blind users or keyboard-only users can't select colors

**Mitigation:**
- Provide text input for hex codes (keyboard accessible)
- Large click targets for swatches (44x44px minimum)
- ARIA labels on color swatches with hex values
- Future: Add color name labels if accessibility concerns arise

### Risk: Modal Doesn't Close on Navigation
**Scenario:** User clicks browser back while modal is open, modal stays open on previous page

**Mitigation:**
- Close modals in `$effect` cleanup when route changes
- Listen to router navigation events and close all modals

### Risk: Optimistic Update Flicker
**Scenario:** Fast edit → error → rollback causes visible UI jump

**Mitigation:**
- Show loading state during save (spinner on button)
- Keep modal open on error (don't close until success)
- Only refetch on error, not on success (use server response)

### Trade-off: No Tag Merge Feature
**Impact:** Users with duplicate tags (e.g., "JS" and "JavaScript") can't merge them

**Rationale:**
- Low frequency need in single-user system
- Complex UX (which tag keeps color? which items?)
- Can be added later if requested

**Workaround:** Manually rename one tag to match the other (system deduplicates)

## Migration Plan

**Phase 1: Backend API**
1. Add `PUT /api/:username/tags/:id` endpoint
2. Add update method to `TagService`
3. Add tests for tag update (validation, authorization, uniqueness)

**Phase 2: Frontend Components**
1. Create `ColorPicker.svelte` component
2. Create `TagEditModal.svelte` with form validation
3. Create `TagDeleteConfirmModal.svelte` with usage warning
4. Update `TagSidebar.svelte` to wire edit/delete handlers

**Phase 3: API Integration**
1. Add `tags.update()` and `tags.delete()` to `api.ts`
2. Add service methods to `items.svelte.ts`
3. Implement optimistic updates in TagSidebar

**Phase 4: Polish**
1. Add keyboard navigation support
2. Add loading states and error handling
3. Mobile responsiveness testing
4. Accessibility audit (focus management, ARIA)

**Rollback Strategy:**
- Phase 1-2: No user-facing changes, safe to revert
- Phase 3: Feature flag or comment out handlers
- If critical bug: Remove edit/delete icons from TagSidebar (restores read-only state)

## Open Questions

1. **Color palette source:** Should we fetch available colors from API or hardcode in frontend?
   - **Recommendation:** Hardcode matching palette (simpler, no API call, consistent with auto-creation)

2. **Tag rename with items in use:** Should we show a confirmation if tag has items?
   - **Recommendation:** No confirmation for rename (low risk, easily reversible)

3. **Delete multiple tags at once:** Needed?
   - **Recommendation:** Not in MVP, add if users request it

4. **Tag color preview in modal:** Should we show how tag looks on cards before saving?
   - **Recommendation:** Yes, add live preview in modal (better UX, minimal complexity)
