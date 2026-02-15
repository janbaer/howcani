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

**Given** item exists with:
- Question: "How do I deploy with Bun?"
- Answer: "Long markdown answer..."
- Tags: ["bun", "deployment"]

**When** rendering in list

**Then** the component should:
- Show question as clickable title (links to detail page)
- Show truncated answer preview (first 200 chars, plain text)
- Show tag badges with colors
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

#### Scenario: Pagination

**Given** user has more items than page size (50)

**When** viewing items list

**Then** the component MUST:
- Show current page items
- Show total count
- Provide "Load more" or pagination controls
- Pass limit/offset to API

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

#### Scenario: Logged in viewing other user

**Given** user "john" authenticated, viewing `/alice/items`

**When** page renders

**Then** the component should:
- Hide edit/delete buttons (not john's items)
- Show items normally (public view)
- Cannot add items to Alice's knowledge base

#### Scenario: Login redirects to items page

**Given** user "john" successfully logs in

**When** authentication completes

**Then** the system MUST:
- Navigate to `/john/items` instead of `/`
- Store username for redirect

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
- Show item list in center (flexible width)
- Show search bar in header area
- Multi-column layout for optimal reading

#### Scenario: Mobile layout

**Given** viewport width < 768px

**When** viewing items list

**Then** the layout should:
- Full-width item list
- Compact search bar
- Stack elements vertically
- Touch-friendly tap targets
