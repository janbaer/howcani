## MODIFIED Requirements

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

## ADDED Requirements

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
