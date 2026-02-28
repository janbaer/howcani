## MODIFIED Requirements

### Requirement: Page Routing

The application MUST provide client-side routing for different views.

#### Scenario: Browse items list page

**Given** user navigates to `/:username/items`

**When** page loads

**Then** the system should:
- Display list of all user's items
- Show search bar at top (placeholder, non-functional in Phase 1)
- Show "Add Item" floating button (if owner, non-functional in Phase 1)
- Load items via API: GET `/api/:username/items`

#### Scenario: View single item page

**Given** user navigates to `/:username/items/:id`

**When** page loads

**Then** the system should:
- Display full item details
- Render markdown answer
- Show all tags with colors
- Show edit/delete buttons (if owner, non-functional in Phase 1)
- Load item via API: GET `/api/:username/items/:id`

#### Scenario: Login page

**Given** user navigates to `/login`

**When** page loads

**Then** the system should:
- Display login form
- Username and password fields
- "Login" button
- Link to register page
- Redirect to user's items page after successful login

#### Scenario: Dynamic route matching

**Given** router receives a URL path

**When** matching against route definitions

**Then** the router MUST:
- Support parameterized segments (`:username`, `:id`)
- Extract params into a params object
- Match most specific route first
- Fall back to NotFound for unmatched paths
- Preserve query string parameters

### Requirement: Item List Component

The item list MUST display FAQ items with previews and interaction options.

#### Scenario: Display item in list
- **WHEN** rendering an item in the list
- **THEN** the card SHALL show the question as a clickable title, full answer preview, ALL tags without truncation, and timestamps

#### Scenario: Show all tags without truncation
- **WHEN** an item has any number of tags
- **THEN** ALL tags SHALL be displayed on the card with no `+N` overflow indicator
- **AND** tags SHALL wrap to additional lines as needed

#### Scenario: Show timestamps on desktop and tablet
- **WHEN** viewport width is 768px or greater (md breakpoint)
- **THEN** the card SHALL display both `created_at` and `updated_at` timestamps without seconds
- **AND** `updated_at` SHALL only be shown if it differs from `created_at`

#### Scenario: Show timestamp on mobile
- **WHEN** viewport width is less than 768px
- **THEN** the card SHALL display only `created_at` without seconds
- **AND** `updated_at` SHALL NOT be shown on mobile

#### Scenario: Item never edited
- **WHEN** an item's `updated_at` equals its `created_at`
- **THEN** only `created_at` SHALL be shown, even on desktop/tablet
- **AND** no "Updated" timestamp or label SHALL appear

#### Scenario: Truncate long answers
- **WHEN** item has answer longer than 200 characters
- **THEN** the component should show first 200 characters with "..." ellipsis, preserving word boundaries

#### Scenario: Empty state when no items
- **WHEN** user has zero items
- **THEN** the component should show "No items yet" and an "Add your first item" button (if owner)

#### Scenario: Loading state during fetch
- **WHEN** API request is in progress
- **THEN** the component should show a loading indicator or skeleton

#### Scenario: Pagination
- **WHEN** user has more items than page size
- **THEN** the component MUST show current page items, total count, and pagination controls

#### Scenario: Card-wide tap target navigates to detail
- **WHEN** user taps or clicks anywhere on the card body (not on a link or button)
- **THEN** the system SHALL navigate to the item detail page

#### Scenario: Edit button not affected by card tap
- **WHEN** user taps the edit button on a card
- **THEN** the edit modal SHALL open and navigation SHALL NOT occur

#### Scenario: Delete button not affected by card tap
- **WHEN** user taps the delete button on a card
- **THEN** the delete confirmation SHALL appear and navigation SHALL NOT occur

#### Scenario: Question title link still works
- **WHEN** user clicks the question title link
- **THEN** the system SHALL navigate to the item detail page (via the anchor element)

### Requirement: Authentication State

The UI MUST adapt based on authentication status.

#### Scenario: Logged in owner view

**Given** user "john" is authenticated and viewing `/john/items`

**When** page renders

**Then** the component should:
- Show "Add Item" button
- Show edit/delete buttons on each item
- Show username in header
- Show "New Question" button
- Show user icon as filled/solid with tooltip displaying "john"
- User icon logs out when clicked

#### Scenario: Anonymous visitor view

**Given** unauthenticated user viewing `/john/items`

**When** page renders

**Then** the component should:
- Hide "Add Item" button
- Hide edit/delete buttons
- Show items and tags normally
- Show user icon as outline-only (not filled)
- User icon navigates to `/login` when clicked

#### Scenario: Logged in viewing other user

**Given** user "john" authenticated, viewing `/alice/items`

**When** page renders

**Then** the component should:
- Hide edit/delete buttons (not john's items)
- Show items normally (public view)
- Cannot add items to Alice's knowledge base
- Show user icon as filled/solid with tooltip displaying "john"
- User icon logs out when clicked

#### Scenario: Login redirects to items page

**Given** user "john" successfully logs in

**When** authentication completes

**Then** the system MUST:
- Navigate to `/john/items` instead of `/`
- Store username for redirect

### Requirement: Markdown Rendering

Item answers MUST render markdown safely. Code blocks in rendered markdown SHALL provide a copy-to-clipboard overlay on hover.

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

#### Scenario: Copy button appears on code block hover

- **WHEN** user hovers over a fenced code block (`<pre>` element) in a rendered markdown answer
- **THEN** a copy button SHALL appear in the top-right corner of the code block

#### Scenario: Copy button copies code to clipboard

- **WHEN** user clicks the copy button on a code block
- **THEN** the system SHALL write the code block's text content to the clipboard using the Clipboard API

#### Scenario: Copy confirmation feedback

- **WHEN** clipboard write succeeds
- **THEN** the copy button icon SHALL change to a checkmark for approximately 2 seconds before reverting

#### Scenario: Copy button hidden when not hovering

- **WHEN** user is not hovering over a code block
- **THEN** the copy button SHALL NOT be visible

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
- Show item list in center (flexible width)
- Show search bar in header area
- CSS Grid with `repeat(auto-fill, minmax(32rem, 1fr))` for responsive columns
- Progressive enhancement to `display: grid-lanes` masonry when browser supports it
- Variable-height cards that size to content (no fixed min-height)
- Fallback to `grid-template-rows: masonry` for Firefox Nightly

#### Scenario: Mobile layout

**Given** viewport width < 768px

**When** viewing items list

**Then** the layout should:
- Full-width item list
- Compact search bar
- Stack elements vertically
- Touch-friendly tap targets
## ADDED Requirements

### Requirement: Tag sidebar sticky positioning
The tag sidebar SHALL remain visible and accessible during vertical page scrolling on desktop viewports, using CSS sticky positioning to maintain its position within the viewport.

#### Scenario: Sidebar remains visible when scrolling down
- **WHEN** user scrolls down the item list on desktop viewport (≥1024px)
- **THEN** tag sidebar remains visible at its fixed position in the viewport

#### Scenario: Sidebar remains visible when scrolling up
- **WHEN** user scrolls up the item list after scrolling down
- **THEN** tag sidebar continues to remain visible and accessible

#### Scenario: Sidebar position updates with scroll
- **WHEN** user scrolls to different positions in the item list
- **THEN** tag sidebar maintains its sticky position relative to viewport top

#### Scenario: Tag filtering works while scrolled
- **WHEN** user is scrolled down in the item list
- **THEN** user can click on tags in the sticky sidebar to filter items without scrolling back to top

### Requirement: Responsive sticky behavior
The tag sidebar sticky positioning SHALL only be active on desktop viewports and SHALL use default scroll behavior on mobile devices to preserve vertical space.

#### Scenario: Sticky enabled on desktop viewport
- **WHEN** viewport width is 1024px or greater
- **THEN** tag sidebar uses sticky positioning and remains visible during scroll

#### Scenario: Sticky disabled on tablet viewport
- **WHEN** viewport width is less than 1024px
- **THEN** tag sidebar uses default scroll behavior (not sticky)

#### Scenario: Sticky disabled on mobile viewport
- **WHEN** viewport width is less than 768px
- **THEN** tag sidebar uses default scroll behavior and scrolls with page content

#### Scenario: Behavior updates on window resize
- **WHEN** user resizes window from desktop to mobile width
- **THEN** sticky behavior is disabled and sidebar returns to default scroll behavior

### Requirement: Sidebar internal scrolling
The tag sidebar internal scrolling SHALL work independently from page scrolling when the tag list exceeds the available viewport height.

#### Scenario: Sidebar scrolls independently for long tag lists
- **WHEN** tag list height exceeds viewport height
- **THEN** sidebar has its own internal scrollbar that scrolls independently from page

#### Scenario: Both scrolling mechanisms work simultaneously
- **WHEN** sidebar is sticky and has internal scroll
- **THEN** user can scroll page content AND scroll sidebar tag list independently

#### Scenario: Sidebar max-height respects viewport bounds
- **WHEN** sidebar is sticky
- **THEN** sidebar maximum height is constrained to viewport height minus header space

### Requirement: No layout shift on sticky activation
The tag sidebar transition to sticky positioning SHALL NOT cause any layout shift or content reflow in the page.

#### Scenario: No horizontal shift when becoming sticky
- **WHEN** sidebar transitions from normal to sticky positioning
- **THEN** sidebar width and horizontal position remain unchanged

#### Scenario: No content jump when becoming sticky
- **WHEN** user scrolls and sidebar becomes sticky
- **THEN** main content area position remains stable without jumping or shifting

#### Scenario: Sidebar maintains flexbox positioning
- **WHEN** sidebar is sticky
- **THEN** sidebar remains within its flex container bounds and respects flex gap spacing

### Requirement: Sticky positioning offset
The tag sidebar SHALL maintain a small top offset from the viewport edge to provide visual breathing room and prevent overlap with browser chrome.

#### Scenario: Sidebar has top offset when sticky
- **WHEN** sidebar is in sticky position
- **THEN** sidebar is positioned with a small offset (e.g., 1rem) from viewport top

#### Scenario: Offset prevents header overlap
- **WHEN** page has a fixed or sticky header
- **THEN** sidebar top offset ensures no overlap with header content

### Requirement: Container boundary respect
The tag sidebar sticky positioning SHALL respect its parent container boundaries and SHALL NOT extend beyond the content area.

#### Scenario: Sidebar stops at container bottom
- **WHEN** user scrolls to bottom of item list
- **THEN** sidebar stops scrolling when reaching its container bottom boundary

#### Scenario: Sidebar stays within flexbox container
- **WHEN** sidebar is sticky
- **THEN** sidebar remains within the flex container and does not overflow outside parent bounds

#### Scenario: Short content behavior
- **WHEN** page content is shorter than viewport height
- **THEN** sidebar remains at its natural position without unnecessary sticky behavior

### Requirement: Accessibility preservation
The tag sidebar sticky positioning SHALL preserve all existing accessibility features including keyboard navigation, screen reader announcements, and focus management.

#### Scenario: Keyboard navigation works with sticky sidebar
- **WHEN** user navigates tags using keyboard (Tab, Enter, Space)
- **THEN** all keyboard interactions work correctly regardless of scroll position

#### Scenario: Focus remains visible
- **WHEN** user focuses on a tag in the sticky sidebar
- **THEN** focus indicator is visible and not obscured by scroll or sticky positioning

#### Scenario: Screen reader announces sidebar correctly
- **WHEN** screen reader user encounters the sticky sidebar
- **THEN** sidebar and its contents are announced correctly with proper semantic HTML

### Requirement: Performance optimization
The tag sidebar sticky positioning SHALL use CSS-only implementation without JavaScript scroll listeners to ensure optimal scrolling performance.

#### Scenario: Smooth scrolling maintained
- **WHEN** user scrolls page with sticky sidebar active
- **THEN** page scrolling remains smooth at 60fps without jank or stutter

#### Scenario: No scroll event listeners
- **WHEN** sticky sidebar is implemented
- **THEN** implementation uses pure CSS position: sticky without JavaScript scroll handlers

#### Scenario: Browser-native sticky behavior
- **WHEN** sidebar uses sticky positioning
- **THEN** browser-native CSS sticky positioning is used for optimal performance

### Requirement: Tag sidebar visibility
The tag sidebar SHALL adapt its visibility based on viewport size and device orientation.

#### Scenario: Tag sidebar visible on desktop
- **WHEN** viewport width is 1024px or greater
- **THEN** the tag sidebar SHALL be visible in the left column

#### Scenario: Tag sidebar visible on tablet landscape
- **WHEN** viewport width is between 768px and 1023px AND device orientation is landscape
- **THEN** the tag sidebar SHALL be visible in the left column

#### Scenario: Tag sidebar hidden on mobile
- **WHEN** viewport width is less than 768px
- **THEN** the tag sidebar SHALL be hidden by default
- **AND** SHALL only be visible when the tag overlay is opened via hamburger button

#### Scenario: Tag sidebar hidden on tablet portrait
- **WHEN** viewport width is between 768px and 1023px AND device orientation is portrait
- **THEN** the tag sidebar SHALL be hidden by default
- **AND** SHALL only be visible when the tag overlay is opened via hamburger button

### Requirement: Footer version display

The footer MUST display the application version number from package.json alongside the application name.

#### Scenario: Version displayed in footer
- **WHEN** any page renders with the footer component
- **THEN** the footer SHALL display the version in format "HowCanI {version} - Copyright {year} by Jan Baer"
- **AND** {version} SHALL match the version field in package.json (e.g., "3.0.10")

#### Scenario: Version updates with package.json
- **WHEN** package.json version is updated and application is rebuilt
- **THEN** the footer SHALL display the new version number
- **AND** no manual changes to Footer.svelte SHALL be required

#### Scenario: Version available at build time
- **WHEN** the client bundle is built
- **THEN** the version string SHALL be embedded as a build-time constant
- **AND** the version SHALL NOT require runtime file system access

### Requirement: Unified user icon authentication control

The user icon SHALL serve as the unified authentication control, replacing separate Login/Logout buttons.

#### Scenario: User icon always visible
- **WHEN** rendering any page (authenticated or not)
- **THEN** the user icon SHALL always be displayed in the rightmost position of the header

#### Scenario: Authenticated user icon behavior
- **WHEN** user is authenticated as "john"
- **THEN** the user icon SHALL:
  - Be rendered as a filled/solid icon
  - Display a tooltip showing "john"
  - Call `logout()` when clicked, which navigates to `/login`

#### Scenario: Unauthenticated user icon behavior
- **WHEN** user is not authenticated
- **THEN** the user icon SHALL:
  - Be rendered as an outline-only icon
  - Navigate to `/login` when clicked
  - Not display a tooltip

#### Scenario: No separate Login/Logout buttons
- **WHEN** rendering the header on any page
- **THEN** there SHALL NOT be separate "Login" or "Logout" buttons
- **AND** the user icon SHALL be the only authentication control

### Requirement: Desktop header button ordering

The desktop header buttons SHALL be ordered for optimal UX flow.

#### Scenario: Button order when authenticated
- **WHEN** user is authenticated
- **THEN** buttons SHALL be ordered left-to-right as:
  1. New Question (primary action)
  2. Dark mode toggle
  3. User icon (authentication control, rightmost)

### Requirement: Detail page timestamp format

The detail page SHALL show timestamps with date and time on desktop and tablet, matching the listview format.

#### Scenario: Timestamps with time on desktop and tablet
- **WHEN** viewport width is 768px or greater (md breakpoint)
- **THEN** the detail page SHALL display `created_at` and `updated_at` with date and time, formatted without seconds
- **AND** `updated_at` SHALL only be shown if it differs from `created_at`

#### Scenario: Timestamps date-only on mobile
- **WHEN** viewport width is less than 768px
- **THEN** the detail page SHALL display `created_at` and `updated_at` with date only (no time)

### Requirement: Consistent edit icon across listview and detail page

The edit icon SHALL be visually identical on both the listview item cards and the detail page.

#### Scenario: Same edit icon on detail page
- **WHEN** an owner views the detail page
- **THEN** the edit button icon SHALL be the same pencil icon used on listview item cards

### Requirement: Version update banner component
The app shell SHALL include a version update banner that appears when a new version is detected.

#### Scenario: Banner is visible when update available
- **WHEN** a version update is available and not yet dismissed
- **THEN** a banner SHALL be displayed in the app layout with a "Refresh" and a "Dismiss" button

#### Scenario: Banner is hidden otherwise
- **WHEN** no version update is detected or the user has dismissed the banner
- **THEN** no banner is shown
