# Frontend UI Specification

## Purpose

The frontend provides a Svelte 5-based user interface for browsing, searching, and managing FAQ items. It features inline editing for owners, public viewing for visitors, and a clean, responsive design.

## Requirements

### Requirement: Page Routing

The application MUST provide client-side routing for different views.

#### Scenario: Browse items list page

**Given** user navigates to `/:username/items`

**When** page loads

**Then** the system should:
- Display list of all user's items
- Show tag sidebar on left/right
- Show search bar at top
- Show "Add Item" floating button (if owner)
- Load items via API: GET `/api/:username/items`

#### Scenario: View single item page

**Given** user navigates to `/:username/items/:id`

**When** page loads

**Then** the system should:
- Display full item details
- Render markdown answer
- Show all tags with colors
- Show edit/delete buttons (if owner)
- Load item via API: GET `/api/:username/items/:id`

#### Scenario: Filter by tag page

**Given** user navigates to `/:username/tags/:tagName`

**When** page loads

**Then** the system should:
- Display items filtered by tag
- Highlight active tag in sidebar
- Show "Clear filter" option
- Load via API: GET `/api/:username/items?tags=tagName`

#### Scenario: Login page

**Given** user navigates to `/login`

**When** page loads

**Then** the system should:
- Display login form
- Username and password fields
- "Login" button
- Link to register page (if public registration enabled)
- Redirect to user's items after successful login

### Requirement: Item List Component

The item list MUST display FAQ items with previews and interaction options.

#### Scenario: Display item in list

**Given** item exists with:
- Question: "How do I deploy with Bun?"
- Answer: "Long markdown answer..."
- Tags: ["bun", "deployment"]

**When** rendering in list

**Then** the component should:
- Show question as clickable title
- Show truncated answer preview (first 200 chars)
- Show tag badges with colors
- Show "Read more" link
- Show edit/delete buttons (if owner)

#### Scenario: Truncate long answers

**Given** item has answer longer than 200 characters

**When** rendering in list

**Then** the component should:
- Show first 200 characters
- Add "..." ellipsis
- Preserve word boundaries (don't cut mid-word)
- Don't render markdown in preview (show as plain text)

#### Scenario: Empty state when no items

**Given** user has zero items

**When** viewing items list

**Then** the component should:
- Show empty state message: "No items yet"
- Show "Add your first item" button (if owner)
- Not show empty list

#### Scenario: Loading state during fetch

**Given** items are being loaded

**When** API request is in progress

**Then** the component should:
- Show loading indicator/skeleton
- Disable interactions
- Show skeleton for 3-5 items

### Requirement: Item Modal (Create/Edit)

The modal MUST provide a rich editing experience for items.

#### Scenario: Open create item modal

**Given** owner clicks "Add Item" button

**When** modal opens

**Then** the component should:
- Display modal overlay
- Show empty form with:
  - Question input field
  - Answer textarea with rich editor toolbar
  - Tag input with suggestions
- Focus on question field
- Show "Save" and "Cancel" buttons

#### Scenario: Rich markdown editor toolbar

**Given** item modal is open for editing answer

**When** user interacts with toolbar

**Then** the toolbar should provide:
- Bold button (wraps in `**text**`)
- Italic button (wraps in `*text*`)
- Heading button (adds `## `)
- Code button (wraps in backticks)
- List button (adds `- `)
- Link button (adds `[text](url)`)
- Toggle preview button

#### Scenario: Preview markdown

**Given** user has entered markdown in answer field

**When** clicking "Preview" toggle

**Then** the component should:
- Switch from edit to preview mode
- Render markdown as HTML
- Sanitize HTML to prevent XSS
- Show "Edit" button to return to editing
- Preview uses same rendering as item view

#### Scenario: Tag input with suggestions

**Given** user is typing tag name

**When** entering "bun" in tag field

**Then** the component should:
- Debounce input (300ms)
- Query `/api/:username/tags/suggestions?q=bun`
- Show dropdown with matches: ["bun", "bun-deployment"]
- Allow selecting from suggestions
- Allow entering new tag not in suggestions
- Show color picker for new tags

#### Scenario: Save new item

**Given** user has filled out:
- Question: "How do I..."
- Answer: "Steps..."
- Tags: ["bun", "guide"]

**When** clicking "Save" button

**Then** the component should:
- Validate question is not empty
- POST to `/api/:username/items`
- Show loading state on button
- Close modal on success
- Refresh item list
- Show success message

#### Scenario: Cancel editing

**Given** user has made changes in modal

**When** clicking "Cancel" or pressing Escape

**Then** the component should:
- Close modal
- Discard unsaved changes
- No confirmation needed (or simple browser confirm)

### Requirement: Tag Sidebar

The sidebar MUST provide tag-based navigation and filtering.

#### Scenario: Display tag list with counts

**Given** user "john" has tags:
- "bun" (5 items)
- "typescript" (3 items)
- "deployment" (8 items)

**When** rendering tag sidebar

**Then** the component should:
- List all tags alphabetically
- Show tag name with color badge
- Show item count: "bun (5)"
- Make each tag clickable
- Load via GET `/api/:username/tags`

#### Scenario: Filter by clicking tag

**Given** user clicks tag "bun" in sidebar

**When** tag is clicked

**Then** the component should:
- Update URL to `?tags=bun`
- Highlight "bun" as active filter
- Load filtered items
- Show "Clear filter" button
- Keep sidebar visible

#### Scenario: Multiple tag filters

**Given** user has "bun" tag already filtered

**When** clicking "typescript" tag (with modifier key or checkbox)

**Then** the component should:
- Add to filter: `?tags=bun,typescript`
- Highlight both tags as active
- Show items with both tags (AND operation)
- Allow removing individual filters

#### Scenario: Clear all filters

**Given** user has active tag filters

**When** clicking "Clear filters" button

**Then** the component should:
- Remove `?tags=` from URL
- Show all items again
- Remove active highlighting from tags

### Requirement: Search Bar

The search bar MUST provide quick full-text search.

#### Scenario: Search input with debounce

**Given** user types in search bar

**When** entering "deploy"

**Then** the component should:
- Wait 300ms after last keystroke (debounce)
- Update URL to `?search=deploy`
- Query `/api/:username/items?search=deploy`
- Display results
- Show clear button (X) in search field

#### Scenario: Clear search

**Given** search term "deploy" is active

**When** clicking clear button

**Then** the component should:
- Clear search input
- Remove `?search=` from URL
- Show all items again

#### Scenario: Combine search with tag filter

**Given** tag filter "bun" is active

**When** entering search term "deploy"

**Then** the component should:
- Update URL to `?tags=bun&search=deploy`
- Show items matching both filters
- Keep both filters visible
- Allow clearing independently

### Requirement: Delete Confirmation Modal

The system MUST confirm destructive actions.

#### Scenario: Confirm item deletion

**Given** owner clicks delete button on item

**When** delete modal opens

**Then** the component should:
- Show modal overlay
- Display message: "Delete '[Question]'?"
- Show warning: "This action cannot be undone"
- Show "Delete" button (red/danger color)
- Show "Cancel" button
- Focus on Cancel (safer default)

#### Scenario: Complete deletion

**Given** delete confirmation modal is open

**When** user clicks "Delete" button

**Then** the component should:
- DELETE to `/api/:username/items/:id`
- Show loading state
- Close modal on success
- Remove item from list (no reload needed)
- Show success message: "Item deleted"

### Requirement: Authentication State

The UI MUST adapt based on authentication status.

#### Scenario: Logged in owner view

**Given** user "john" is authenticated and viewing `/john/items`

**When** page renders

**Then** the component should:
- Show "Add Item" button
- Show edit/delete buttons on each item
- Show username in header
- Show logout button

#### Scenario: Anonymous visitor view

**Given** unauthenticated user viewing `/john/items`

**When** page renders

**Then** the component should:
- Hide "Add Item" button
- Hide edit/delete buttons
- Show items and tags normally
- Search and filter work normally

#### Scenario: Logged in viewing other user

**Given** user "john" authenticated, viewing `/alice/items`

**When** page renders

**Then** the component should:
- Hide edit/delete buttons (not john's items)
- Show items normally (public view)
- Cannot add items to Alice's knowledge base

### Requirement: Markdown Rendering

Item answers MUST render markdown safely.

#### Scenario: Render markdown in item view

**Given** item answer contains markdown:
```markdown
## Steps
1. Run `bun build`
2. Deploy to server

**Important:** Check logs
```

**When** viewing item detail

**Then** the component should:
- Render as HTML: headings, lists, bold, code
- Sanitize HTML (prevent XSS)
- Apply syntax highlighting to code blocks
- Make external links open in new tab

#### Scenario: Sanitize potentially dangerous HTML

**Given** item answer contains `<script>alert('xss')</script>`

**When** rendering markdown

**Then** the component should:
- Strip script tags
- Remove event handlers (onclick, etc.)
- Keep safe HTML elements
- Prevent XSS attacks

### Requirement: Responsive Design

The UI MUST work on various screen sizes.

#### Scenario: Desktop layout

**Given** viewport width >= 1024px

**When** viewing items list

**Then** the layout should:
- Show tag sidebar on left (fixed width ~250px)
- Show item list in center (flexible width)
- Show search bar in header
- Multi-column layout for optimal reading

#### Scenario: Mobile layout

**Given** viewport width < 768px

**When** viewing items list

**Then** the layout should:
- Hide tag sidebar (show in menu/drawer)
- Full-width item list
- Compact search bar
- Stack elements vertically
- Touch-friendly tap targets

## Component Structure

```
src/client/components/
  ItemList.svelte
    - List of items with previews
    - Pagination controls
    - Loading/empty states

  ItemDetail.svelte
    - Full item view
    - Markdown rendering
    - Edit/delete buttons

  ItemModal.svelte
    - Create/edit form
    - Rich markdown editor
    - Tag input with suggestions

  DeleteConfirmModal.svelte
    - Confirmation dialog
    - Danger actions

  TagSidebar.svelte
    - Tag list with counts
    - Active filter indicators
    - Clear filters button

  SearchBar.svelte
    - Search input
    - Debounced queries
    - Clear button

  RichMarkdownEditor.svelte
    - Toolbar with formatting buttons
    - Preview toggle
    - Textarea with markdown

  MarkdownRenderer.svelte
    - Render markdown to HTML
    - Sanitize output
    - Syntax highlighting

  Header.svelte
    - Site title
    - User menu
    - Login/logout

  TagBadge.svelte
    - Colored tag display
    - Clickable for filtering
```

## State Management

```typescript
// Root component state
let currentUser = $state<User | null>(null);
let jwt = $state<string | null>(localStorage.getItem('jwt'));

// Item list state
let items = $state<Item[]>([]);
let loading = $state(false);
let filters = $state({ search: '', tags: [] });

// Modal state
let showItemModal = $state(false);
let editingItem = $state<Item | null>(null);
```

## Testing Requirements

- Manual testing for UI components (test-after approach)
- Focus testing on critical flows:
  - Login/authentication
  - Create item
  - Edit item
  - Delete item
  - Search and filter
- No extensive UI unit tests (keep it pragmatic)
- Test on multiple browsers (Chrome, Firefox)
- Test on mobile viewport sizes

## Dependencies

```json
{
  "dependencies": {
    "svelte": "^5.45.6",
    "marked": "^12.0.0",
    "dompurify": "^3.0.0",
    "http-status-codes": "^2.3.0"
  }
}
```

## Implementation Notes

### Markdown Libraries

- **Marked**: Convert markdown to HTML
- **DOMPurify**: Sanitize HTML to prevent XSS
- Apply in MarkdownRenderer component

### Tag Color Display

```typescript
// Tag badge styling
<span
  class="tag-badge"
  style="background-color: #{tag.color}"
>
  {tag.name}
</span>
```

### Debounce Utility

```typescript
function debounce(fn: Function, delay: number) {
  let timeout: number;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
```

### Cross-Reference

- **Related**: [authentication/spec.md] for login/auth UI
- **Related**: [item-management/spec.md] for CRUD operations
- **Related**: [tag-management/spec.md] for tag UI interactions
- **Related**: [search-filtering/spec.md] for search/filter UI
