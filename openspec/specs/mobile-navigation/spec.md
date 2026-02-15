## ADDED Requirements

### Requirement: Hamburger button visibility
The system SHALL display a hamburger menu button in the mobile header on devices with viewport width less than 1024px, or on tablets in portrait orientation.

#### Scenario: Hamburger shown on mobile
- **WHEN** viewport width is less than 768px
- **THEN** the mobile header SHALL display a hamburger button in the top-left corner

#### Scenario: Hamburger shown on tablet portrait
- **WHEN** viewport width is between 768px and 1023px AND device orientation is portrait
- **THEN** the mobile header SHALL display a hamburger button in the top-left corner

#### Scenario: Hamburger hidden on tablet landscape
- **WHEN** viewport width is between 768px and 1023px AND device orientation is landscape
- **THEN** the hamburger button SHALL NOT be displayed

#### Scenario: Hamburger hidden on desktop
- **WHEN** viewport width is 1024px or greater
- **THEN** the hamburger button SHALL NOT be displayed

### Requirement: Tag overlay toggle
The system SHALL toggle the tag list overlay visibility when the hamburger button is clicked.

#### Scenario: Opening tag overlay
- **WHEN** the hamburger button is clicked and the tag overlay is closed
- **THEN** the tag overlay SHALL slide in from the left with animation

#### Scenario: Closing tag overlay via hamburger
- **WHEN** the hamburger button is clicked and the tag overlay is open
- **THEN** the tag overlay SHALL slide out to the left with animation

### Requirement: Tag overlay backdrop
The system SHALL display a semi-transparent backdrop behind the tag list overlay when it is open.

#### Scenario: Backdrop closes overlay
- **WHEN** the user clicks on the backdrop area (outside the tag list)
- **THEN** the tag overlay SHALL close with slide-out animation

#### Scenario: Backdrop fades in/out
- **WHEN** the tag overlay opens or closes
- **THEN** the backdrop SHALL fade in (open) or fade out (close) with opacity transition

### Requirement: Tag list responsive visibility
The system SHALL show or hide the tag list sidebar based on viewport size and device orientation.

#### Scenario: Sidebar always visible on desktop
- **WHEN** viewport width is 1024px or greater
- **THEN** the tag list sidebar SHALL be visible in the left column without overlay

#### Scenario: Sidebar visible on tablet landscape
- **WHEN** viewport width is between 768px and 1023px AND device orientation is landscape
- **THEN** the tag list sidebar SHALL be visible in the left column without overlay

#### Scenario: Sidebar hidden by default on mobile
- **WHEN** viewport width is less than 768px
- **THEN** the tag list sidebar SHALL be hidden until the hamburger button opens the overlay

#### Scenario: Sidebar hidden by default on tablet portrait
- **WHEN** viewport width is between 768px and 1023px AND device orientation is portrait
- **THEN** the tag list sidebar SHALL be hidden until the hamburger button opens the overlay

### Requirement: Tag overlay slides from left
The system SHALL animate the tag overlay panel sliding from the left edge of the screen.

#### Scenario: Slide-in animation
- **WHEN** the tag overlay opens
- **THEN** the tag panel SHALL translate from off-screen left (-100%) to on-screen (0) over 300ms

#### Scenario: Slide-out animation
- **WHEN** the tag overlay closes
- **THEN** the tag panel SHALL translate from on-screen (0) to off-screen left (-100%) over 300ms
