## MODIFIED Requirements

### Requirement: Registry Publishing

The build script SHALL push Docker images to the private Forgejo registry at `forgejo.home.janbaer.de/jan/howcani`.

The script MUST tag each image with both the semantic version from package.json and the "latest" tag.

The script SHALL authenticate to the registry automatically using the `$FORGEJO_TOKEN` environment variable and username `jan` when no existing authentication is found in the auth file.

If `$FORGEJO_TOKEN` is not set and the registry is not already authenticated, the script MUST exit with a clear error message.

#### Scenario: Push with version and latest tags

- **WHEN** build completes successfully for version 3.0.1
- **THEN** two images SHALL be pushed: "forgejo.home.janbaer.de/jan/howcani:3.0.1" and "forgejo.home.janbaer.de/jan/howcani:latest"

#### Scenario: Auto-login when not authenticated

- **WHEN** user is not authenticated to the Forgejo registry and `$FORGEJO_TOKEN` is set
- **THEN** script SHALL automatically log in using username `jan` and `$FORGEJO_TOKEN` as password via stdin before pushing

#### Scenario: Skip login when already authenticated

- **WHEN** user is already authenticated to the Forgejo registry
- **THEN** script SHALL skip the login step and proceed directly to pushing

#### Scenario: Missing token and not authenticated

- **WHEN** user is not authenticated and `$FORGEJO_TOKEN` is not set
- **THEN** script SHALL exit with an error message explaining that `$FORGEJO_TOKEN` must be set

#### Scenario: Registry push failure

- **WHEN** registry push fails (e.g., network error)
- **THEN** script SHALL exit with error, but local image SHALL remain available for retry
