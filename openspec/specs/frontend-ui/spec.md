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

### Requirement: Tag Edit Modal

The system MUST provide a modal for editing tag name and color.

#### Scenario: Open tag edit modal from sidebar

**Given** owner is viewing their items page with tags in sidebar

**When** user hovers over tag "bun" and clicks edit icon

**Then** the system should:
- Display modal overlay
- Show current tag name in input field (pre-filled with "bun")
- Show current tag color in color picker
- Show "Save" and "Cancel" buttons
- Focus on tag name input field
- Disable background interactions

#### Scenario: Edit tag name successfully

**Given** tag edit modal is open for tag "bun"

**When** user changes name to "bun-runtime" and clicks "Save"

**Then** the system should:
- Validate name is not empty
- Validate name doesn't conflict with existing tags (case-insensitive)
- PUT to `/api/:username/tags/:id` with `{ name: "bun-runtime", color: "..." }`
- Show loading state on Save button
- Close modal on success
- Update tag name in sidebar immediately
- Update tag name on all item cards using this tag
- Show success message: "Tag renamed"

#### Scenario: Edit tag name fails with duplicate

**Given** user has existing tag "typescript"

**When** user tries to rename tag "bun" to "TypeScript" (case variant)

**Then** the system should:
- Detect case-insensitive conflict
- Show error message: "Tag 'TypeScript' already exists"
- Keep modal open
- Focus on name input
- Highlight error state on input field

#### Scenario: Edit tag name fails with empty value

**Given** tag edit modal is open

**When** user clears the name field and clicks "Save"

**Then** the system should:
- Show validation error: "Tag name cannot be empty"
- Keep modal open
- Prevent API call
- Focus on name input

#### Scenario: Change tag color

**Given** tag edit modal is open for tag "bun" with color "0e8a16"

**When** user selects new color "ff5722" from color picker and clicks "Save"

**Then** the system should:
- PUT to `/api/:username/tags/:id` with `{ name: "bun", color: "ff5722" }`
- Close modal on success
- Update tag color in sidebar immediately
- Update tag badge color on all item cards using this tag
- Show success message: "Tag updated"

#### Scenario: Cancel tag editing

**Given** tag edit modal is open with unsaved changes

**When** user clicks "Cancel" or presses Escape

**Then** the system should:
- Close modal
- Discard unsaved changes
- Not make API call
- No confirmation needed

#### Scenario: Edit tag fails with unauthorized

**Given** user "john" is viewing tag "bun" owned by user "alice"

**When** attempting to edit the tag

**Then** the system should:
- Not show edit button (hide edit UI for non-owners)
- If accessed directly, return 403 Forbidden
- Show error: "Not authorized to modify this tag"

### Requirement: Tag Delete Confirmation Modal

The system MUST confirm tag deletion and prevent deleting tags in use.

#### Scenario: Open delete confirmation for unused tag

**Given** owner has tag "draft" with 0 items

**When** user clicks delete icon on tag "draft" in sidebar

**Then** the system should:
- Display modal overlay
- Show message: "Delete tag 'draft'?"
- Show info: "This tag is not used by any questions."
- Show "Delete" button (red/danger styling)
- Show "Cancel" button
- Focus on Cancel button (safer default)

#### Scenario: Open delete confirmation for tag in use

**Given** owner has tag "bun" used by 5 items

**When** user clicks delete icon on tag "bun"

**Then** the system should:
- Display modal overlay
- Show message: "Delete tag 'bun'?"
- Show warning: "This tag is used by 5 questions. Deleting it will remove it from all questions."
- Show "Delete" button (red/danger styling)
- Show "Cancel" button
- Focus on Cancel button (safer default)

#### Scenario: Confirm deletion of unused tag

**Given** delete confirmation modal is open for tag "draft" (0 items)

**When** user clicks "Delete" button

**Then** the system should:
- DELETE to `/api/:username/tags/:id`
- Show loading state on Delete button
- Close modal on success
- Remove tag from sidebar immediately
- Show success message: "Tag deleted"

#### Scenario: Confirm deletion of tag in use

**Given** delete confirmation modal is open for tag "bun" (5 items)

**When** user clicks "Delete" button

**Then** the system should:
- DELETE to `/api/:username/tags/:id`
- Close modal on success
- Remove tag from sidebar
- Remove tag badges from all affected item cards
- Refresh item list to reflect changes
- Show success message: "Tag 'bun' deleted and removed from 5 questions"

#### Scenario: Delete fails with tag in use (backend prevention)

**Given** backend prevents deleting tags with items

**When** DELETE request returns 409 Conflict with code "TAG_IN_USE"

**Then** the system should:
- Keep modal open
- Show error message: "Cannot delete tag: still in use by N questions"
- Offer action: "View questions with this tag"

#### Scenario: Cancel tag deletion

**Given** delete confirmation modal is open

**When** user clicks "Cancel" or presses Escape

**Then** the system should:
- Close modal
- Not make API call
- Tag remains in sidebar

#### Scenario: Delete tag fails with unauthorized

**Given** user "john" viewing tags owned by user "alice"

**When** attempting to delete a tag

**Then** the system should:
- Not show delete button (hide delete UI for non-owners)
- If accessed directly, return 403 Forbidden
- Show error: "Not authorized to delete this tag"

### Requirement: Color Picker Component

The system MUST provide a color picker for selecting tag colors.

#### Scenario: Display preset color palette

**Given** color picker is open in tag edit modal

**When** component renders

**Then** the system should:
- Show grid of preset colors (recommended: 16-24 colors)
- Use same color palette as tag auto-creation
- Each color shown as clickable swatch
- Currently selected color highlighted with border/checkmark
- Colors displayed as hex values (without # prefix)

#### Scenario: Select preset color

**Given** color picker showing palette

**When** user clicks color swatch "ff5722"

**Then** the system should:
- Highlight selected color
- Update preview of tag with new color
- Store color value for save operation
- Show hex value: "ff5722"

#### Scenario: Enter custom hex color

**Given** color picker has custom color input field

**When** user enters "0e8a16" in hex input

**Then** the system should:
- Validate hex format (6 characters, valid hex digits)
- Accept both uppercase and lowercase (a-f, A-F)
- Update preview with custom color
- Show validation error if invalid format

#### Scenario: Invalid custom hex color

**Given** color picker with custom color input

**When** user enters invalid values:
- "#0e8a16" (includes hash)
- "0e8" (too short)
- "xyz123" (invalid hex)

**Then** the system should:
- Show validation error: "Invalid color. Use 6-digit hex (e.g., ff5722)"
- Prevent selection
- Keep previous valid color selected

#### Scenario: Color picker in create item modal

**Given** user is creating new item with new tag

**When** entering tag name "new-tag" not in suggestions

**Then** the system should:
- Show color picker inline or in popover
- Allow selecting color before saving item
- Default to random color from palette if not specified
- Create tag with selected color when item is saved

### Requirement: Tag Management in Sidebar

The tag sidebar MUST show edit and delete actions for tag owners.

#### Scenario: Show management actions on hover for owner

**Given** user "john" is viewing `/john/items` with tags in sidebar

**When** user hovers over tag "bun"

**Then** the system should:
- Show edit icon (pencil/edit symbol)
- Show delete icon (trash/x symbol)
- Icons appear on right side of tag row
- Icons fade in smoothly (transition)

#### Scenario: Hide management actions for non-owners

**Given** user "john" is viewing `/alice/items`

**When** viewing tag sidebar

**Then** the system should:
- Not show edit icons
- Not show delete icons
- Tags remain clickable for filtering only

#### Scenario: Hide management actions for visitors

**Given** unauthenticated user viewing `/john/items`

**When** viewing tag sidebar

**Then** the system should:
- Not show edit icons
- Not show delete icons
- Tags remain clickable for filtering only

#### Scenario: Keyboard navigation for tag management

**Given** tag sidebar with keyboard focus

**When** user navigates with Tab key

**Then** the system should:
- Allow tabbing through tags
- Edit and delete buttons are keyboard accessible
- Enter key activates edit
- Delete key (or Shift+Delete) triggers delete confirmation
- Escape closes any open modal

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
    - Edit/delete icons for owners
    - Keyboard navigation support

  TagEditModal.svelte
    - Modal for editing tag name and color
    - Form validation
    - Loading states
    - Integrates ColorPicker component

  TagDeleteConfirmModal.svelte
    - Confirmation dialog for tag deletion
    - Shows item count and warning
    - Danger action styling

  ColorPicker.svelte
    - Grid of preset colors
    - Custom hex color input
    - Live preview
    - Validation for hex format

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

## Frontend Architecture

Pages and components access data through a service layer, not the API client directly:

```
Pages/Components  →  Service Layer (lib/*.svelte.ts)  →  API Client (lib/api.ts)
```

- **API Client** (`lib/api.ts`): Low-level HTTP requests, token management, type definitions
- **Auth Service** (`lib/auth.svelte.ts`): App-wide reactive auth state (`$state`), login/register/logout flows
- **Item Service** (`lib/items.svelte.ts`): Item data fetching, response unwrapping, business logic (truncation, formatting)

Service modules unwrap `ApiResponse<T>` so pages receive clean data or thrown errors.

## State Management

```typescript
// Auth state lives in auth.svelte.ts (reactive via $state)
const authState = getAuthState(); // { user, isAuthenticated, isLoading, error }

// Token management lives in api.ts (localStorage persistence)
setAccessToken(token); // persists to localStorage key "howcani_token"
getAccessToken();      // reads current in-memory token

// Page-level state uses Svelte 5 runes
let items = $state<Item[]>([]);
let loading = $state(false);
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
