## ADDED Requirements

### Requirement: Duplicate threshold user setting

The system SHALL store a `duplicate_threshold` setting per user as an integer percentage (0–100) with a default value of 92. The setting SHALL be persisted in the `users` table. The `UserRepository` SHALL expose methods to read and update this setting. The settings page SHALL display the threshold as a percentage input and allow the authenticated user to update it.

#### Scenario: New users get default threshold of 92

- **WHEN** a new user account is created
- **THEN** their `duplicate_threshold` is 92

#### Scenario: User updates duplicate threshold

- **WHEN** an authenticated user submits a new threshold value (e.g. 85) on the settings page
- **THEN** the system stores the value and returns HTTP 200

#### Scenario: Threshold is validated to be between 50 and 100

- **WHEN** an authenticated user submits a threshold outside the range 50–100
- **THEN** the system returns HTTP 400 with a validation error

#### Scenario: Settings page shows current threshold

- **WHEN** an authenticated user visits the settings page
- **THEN** the duplicate threshold input shows the user's currently stored value
