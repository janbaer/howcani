## MODIFIED Requirements

### Requirement: Build Automation Script

The system SHALL provide a bash script at `scripts/build-docker.sh` that automates the complete build-to-registry workflow. It is the manual fallback when the CI workflow is unavailable.

The script MUST validate prerequisites before starting: container runtime running and Bun installed.

The script SHALL accept a version bump type argument (patch, minor, major), defaulting to patch, or `--no-bump` to build the version currently in `package.json`.

The script MUST execute the following steps in order: bump version (skipped with `--no-bump`), build Docker image with version tag, tag image as latest, push both tags to registry.

#### Scenario: Successful build and push

- **WHEN** script is run with `./scripts/build-docker.sh patch` and all prerequisites are met
- **THEN** version SHALL be bumped to 3.0.1, Docker image SHALL be built and tagged as "forgejo.home.janbaer.de/jan/howcani:3.0.1" and "forgejo.home.janbaer.de/jan/howcani:latest", and both tags SHALL be pushed to the registry

#### Scenario: Build without bump

- **WHEN** script is run with `./scripts/build-docker.sh --no-bump` and `package.json` contains version 3.0.1
- **THEN** `package.json` SHALL remain unchanged and the image SHALL be built and pushed as "forgejo.home.janbaer.de/jan/howcani:3.0.1" and ":latest"

#### Scenario: Missing prerequisites

- **WHEN** Docker daemon is not running
- **THEN** script SHALL exit with error message before making any changes

#### Scenario: Invalid argument

- **WHEN** script is run with an argument other than patch, minor, major or `--no-bump`
- **THEN** script SHALL exit with usage instructions showing the valid options

#### Scenario: Docker build failure

- **WHEN** Docker build fails during image creation
- **THEN** script SHALL exit with error and SHALL NOT attempt to push to registry
