## MODIFIED Requirements

### Requirement: Skip existing versions

The workflow SHALL read the version from `package.json` and SHALL ask the registry whether `forgejo.home.janbaer.de/jan/howcani:<version>` exists. It SHALL NOT build or push when the tag exists, and it SHALL fail when the question cannot be answered, rather than treating that as a missing tag.

#### Scenario: Version already published
- **WHEN** the registry answers `200` for the tag of the current version
- **THEN** the workflow SHALL finish successfully without building or pushing

#### Scenario: Version not yet published
- **WHEN** the registry answers `404` for that tag
- **THEN** the workflow SHALL build and push

#### Scenario: Check cannot be answered
- **WHEN** the registry answers with any other status, or is unreachable
- **THEN** the job SHALL fail, SHALL NOT push, and the failure notification SHALL be sent
