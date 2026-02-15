## ADDED Requirements

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
