## ADDED Requirements

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
