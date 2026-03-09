## MODIFIED Requirements

### Requirement: Tag sidebar sticky positioning
The tag sidebar SHALL remain permanently visible in a fixed-height sidebar column using an app shell layout. The sidebar SHALL NOT use `position: sticky` — it is always visible because it occupies its own scroll container that fills the viewport height below the header.

#### Scenario: Sidebar remains visible when scrolling item list
- **WHEN** user scrolls down the item list on desktop viewport (≥1024px)
- **THEN** tag sidebar SHALL remain fully visible and SHALL NOT move

#### Scenario: Sidebar remains visible when scrolling up
- **WHEN** user scrolls up the item list after scrolling down
- **THEN** tag sidebar SHALL remain fully visible and SHALL NOT move

#### Scenario: Tag filtering works regardless of item list scroll position
- **WHEN** user is scrolled to any position in the item list
- **THEN** user SHALL be able to click on tags in the sidebar to filter items without scrolling

### Requirement: Responsive sticky behavior
The tag sidebar SHALL only be visible on desktop viewports. On smaller viewports the mobile overlay is used instead. There is NO `position: sticky` involved.

#### Scenario: Sidebar visible on desktop viewport
- **WHEN** viewport width is 1024px or greater
- **THEN** tag sidebar SHALL be visible in the left column as a fixed-height independent scroll container

#### Scenario: Sidebar hidden on tablet and mobile viewports
- **WHEN** viewport width is less than 1024px
- **THEN** tag sidebar SHALL NOT be visible
- **AND** the mobile tag overlay (hamburger menu) SHALL be used instead

### Requirement: Sidebar internal scrolling
The tag sidebar SHALL have its own internal scrollbar that scrolls independently from the item list.

#### Scenario: Sidebar scrolls independently for long tag lists
- **WHEN** tag list height exceeds the available sidebar height
- **THEN** sidebar SHALL have its own internal scrollbar
- **AND** scrolling the sidebar SHALL NOT scroll the item list

#### Scenario: Both scroll regions work simultaneously
- **WHEN** the sidebar has a scrollbar and the item list has a scrollbar
- **THEN** user can scroll either region independently without affecting the other

#### Scenario: Sidebar height fills viewport below header
- **WHEN** app shell layout is active
- **THEN** sidebar height SHALL fill the available viewport height below the header
- **AND** no `max-height` calculation based on header pixel offsets SHALL be required

### Requirement: No layout shift on filter activation
When the "Filtered by" active filter bar appears or disappears, there SHALL be no layout shift or content reflow in the item list.

#### Scenario: No layout jump when tag is selected
- **WHEN** user selects a tag and the "Filtered by" bar appears
- **THEN** item list scroll position SHALL NOT change
- **AND** no visible layout jump SHALL occur

#### Scenario: No layout jump when tag is deselected
- **WHEN** user deselects all tags and the "Filtered by" bar disappears
- **THEN** item list scroll position SHALL NOT change
- **AND** no visible layout jump SHALL occur

#### Scenario: Active filter bar always visible when tag selected
- **WHEN** at least one tag is selected
- **THEN** the "Filtered by" bar SHALL be permanently visible above the item scroll area
- **AND** the bar SHALL NOT scroll away when the user scrolls the item list

### Requirement: Tag chip strip sticky positioning
The tag chip strip and active filter row SHALL be fixed above the item scroll container on all mobile and tablet viewports, using app shell layout. They SHALL NOT use `position: sticky`.

#### Scenario: Tag chips pinned below header on mobile and tablet
- **WHEN** viewport width is less than 1024px
- **AND** the tag list is non-empty
- **THEN** the tag chip strip and active filter row SHALL be rendered above the item scroll container
- **AND** they SHALL remain visible as the user scrolls the item list

#### Scenario: No pixel-offset calculations for chip strip
- **WHEN** the tag chip strip is rendered
- **THEN** no hardcoded pixel values based on header height SHALL be used for positioning

#### Scenario: Active filter bar on desktop above scroll area
- **WHEN** viewport width is 1024px or greater
- **AND** at least one tag is selected
- **THEN** the "Filtered by" bar SHALL appear as a fixed strip between the header and the item scroll container
- **AND** it SHALL NOT use `position: sticky`

### Requirement: App shell layout structure
The ItemList page SHALL use an app shell layout that divides the viewport into fixed-height regions.

#### Scenario: Viewport filled without document scroll
- **WHEN** the ItemList page is rendered
- **THEN** the root layout container SHALL fill exactly the viewport height (100vh)
- **AND** the document (body/html) SHALL NOT have a vertical scrollbar

#### Scenario: Item list has its own scrollbar
- **WHEN** the item list contains more items than fit in the visible area
- **THEN** the item list container SHALL display a vertical scrollbar
- **AND** only the item list region SHALL scroll

#### Scenario: Footer always visible on ItemList page
- **WHEN** the ItemList page is rendered
- **THEN** the footer SHALL be visible at the bottom of the viewport at all times
- **AND** the footer SHALL NOT scroll with the item list
