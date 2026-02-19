## ADDED Requirements

### Requirement: Version Bumping Script

The system SHALL provide a Bun TypeScript script at `scripts/bump-version.ts` that manages semantic versioning in package.json.

The script MUST accept a version bump type argument: `patch`, `minor`, or `major`.

The script SHALL parse the current version from package.json, increment it according to semantic versioning rules, write the updated version back to package.json, and create a git tag with the new version prefixed with "v".

#### Scenario: Bump patch version

- **WHEN** the script is run with `bun run scripts/bump-version.ts patch` and current version is "3.0.0"
- **THEN** package.json version SHALL be updated to "3.0.1" and a git tag "v3.0.1" SHALL be created

#### Scenario: Bump minor version

- **WHEN** the script is run with `bun run scripts/bump-version.ts minor` and current version is "3.0.0"
- **THEN** package.json version SHALL be updated to "3.1.0" and a git tag "v3.1.0" SHALL be created

#### Scenario: Bump major version

- **WHEN** the script is run with `bun run scripts/bump-version.ts major` and current version is "3.0.0"
- **THEN** package.json version SHALL be updated to "4.0.0" and a git tag "v4.0.0" SHALL be created

#### Scenario: Invalid bump type

- **WHEN** the script is run with an invalid bump type argument
- **THEN** the script SHALL exit with an error message explaining valid options are patch, minor, or major

#### Scenario: Git tag creation failure

- **WHEN** git tag creation fails (e.g., tag already exists)
- **THEN** the script SHALL exit with an error and package.json SHALL NOT be modified

### Requirement: Multi-stage Docker Build

The system SHALL provide a Dockerfile that creates an optimized container image using a multi-stage build process.

The Dockerfile MUST have a builder stage using the official `oven/bun` image to install dependencies and compile the application binary.

The Dockerfile MUST have a runtime stage using `oven/bun:slim` or `oven/bun:alpine` containing only the compiled binary and necessary runtime files.

The Dockerfile SHALL pin the Bun version to ensure consistency between build and runtime environments.

#### Scenario: Build stage compiles binary

- **WHEN** Docker builds the image
- **THEN** the builder stage SHALL run `bun install` to install dependencies and SHALL run `bun build src/server/index.ts --target=bun --outdir=dist` to create the binary

#### Scenario: Runtime stage is minimal

- **WHEN** Docker builds the image
- **THEN** the runtime stage SHALL contain only the compiled binary from dist/, necessary runtime configuration files, and the Bun runtime, excluding source code and build dependencies

#### Scenario: Consistent Bun version

- **WHEN** the Dockerfile specifies a Bun version (e.g., `FROM oven/bun:1.1.16`)
- **THEN** both builder and runtime stages SHALL use the same pinned Bun version

### Requirement: Docker Image Runtime Behavior

The Docker image SHALL run the compiled Bun application binary when started.

The image MUST expose the application port configured via the PORT environment variable (default: 3000).

The image SHALL expect a writable `/data` directory for SQLite database storage.

The image MUST support running as a non-root user with configurable user and group IDs.

#### Scenario: Application starts on configured port

- **WHEN** container starts with PORT environment variable set to 8080
- **THEN** the application SHALL listen on port 8080

#### Scenario: Database persists in data directory

- **WHEN** container starts with /data mounted as a volume
- **THEN** the SQLite database SHALL be created at /data/howcani.db and persist across container restarts

#### Scenario: Application runs as specified user

- **WHEN** container starts with user "1001:1001"
- **THEN** the application process SHALL run with UID 1001 and GID 1001, and SHALL be able to read/write to the /data directory

#### Scenario: Default port is 3000

- **WHEN** container starts without PORT environment variable
- **THEN** the application SHALL listen on port 3000

### Requirement: Build Automation Script

The system SHALL provide a bash script at `scripts/build-docker.sh` that automates the complete build-to-registry workflow.

The script MUST validate prerequisites before starting: Docker daemon running, Bun installed, and git working tree clean.

The script SHALL accept a version bump type argument (patch, minor, major) and SHALL fail if not provided.

The script MUST execute the following steps in order: bump version, build Bun binary, build Docker image with version tag, tag image as latest, push both tags to registry.

#### Scenario: Successful build and push

- **WHEN** script is run with `./scripts/build-docker.sh patch` and all prerequisites are met
- **THEN** version SHALL be bumped to 3.0.1, binary SHALL be built in dist/, Docker image SHALL be built and tagged as "forgejo.home.janbaer.de/jan/howcani:3.0.1" and "forgejo.home.janbaer.de/jan/howcani:latest", and both tags SHALL be pushed to the registry

#### Scenario: Missing prerequisites

- **WHEN** Docker daemon is not running
- **THEN** script SHALL exit with error message before making any changes

#### Scenario: Dirty git working tree

- **WHEN** there are uncommitted changes in the git working tree
- **THEN** script SHALL exit with error message requiring a clean working tree before proceeding

#### Scenario: No version bump type provided

- **WHEN** script is run without a bump type argument
- **THEN** script SHALL exit with usage instructions showing valid options: patch, minor, major

#### Scenario: Docker build failure

- **WHEN** Docker build fails during image creation
- **THEN** script SHALL exit with error and SHALL NOT attempt to push to registry

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

### Requirement: Docker Compose Configuration

The system SHALL provide a `docker-compose.yml` file for production deployment with configurable runtime parameters.

The compose file MUST define a service that uses the HowCanI Docker image from the Forgejo registry.

The compose file SHALL support configuration via environment variables with sensible defaults: HOWCANI_PORT (default: 3000), HOWCANI_DATA_DIR (default: ./data), HOWCANI_UID (default: 1000), HOWCANI_GID (default: 1000).

The compose file MUST mount the data directory from host to /data in container for database persistence.

The compose file SHALL configure the container to run as the specified user and group ID.

#### Scenario: Default configuration

- **WHEN** docker-compose.yml is run without custom environment variables
- **THEN** service SHALL run on port 3000, mount ./data to /data, run as user 1000:1000, and use the latest image tag

#### Scenario: Custom port configuration

- **WHEN** HOWCANI_PORT environment variable is set to 8080
- **THEN** service SHALL expose and use port 8080 for both host and container

#### Scenario: Custom data directory

- **WHEN** HOWCANI_DATA_DIR environment variable is set to /var/lib/howcani/data
- **THEN** service SHALL mount /var/lib/howcani/data from host to /data in container

#### Scenario: Custom user and group

- **WHEN** HOWCANI_UID=1001 and HOWCANI_GID=1001
- **THEN** container SHALL run as user 1001:1001

#### Scenario: Specific version deployment

- **WHEN** docker-compose.yml image tag is set to a specific version (e.g., 3.0.1)
- **THEN** service SHALL use that specific version instead of latest

### Requirement: Build Context Optimization

The system SHALL provide a `.dockerignore` file that excludes unnecessary files from the Docker build context.

The .dockerignore file MUST exclude: node_modules, .git, test files, development configuration files, and build artifacts.

#### Scenario: Excluded files not in build context

- **WHEN** Docker builds the image
- **THEN** files matching .dockerignore patterns SHALL NOT be sent to Docker daemon, reducing build context size and build time

#### Scenario: Node modules excluded

- **WHEN** node_modules directory exists locally
- **THEN** it SHALL be excluded from build context and dependencies SHALL be installed fresh during build

### Requirement: Environment Configuration

The Docker image MUST support configuration via environment variables: PORT (application port), DATABASE_URL (database file path), NODE_ENV (environment mode).

The Docker Compose configuration SHALL set NODE_ENV to "production" by default.

The Docker Compose configuration MAY allow users to override environment variables via a .env file.

#### Scenario: Production environment by default

- **WHEN** container starts via docker-compose
- **THEN** NODE_ENV SHALL be set to "production"

#### Scenario: Custom database path

- **WHEN** DATABASE_URL environment variable is set to /data/custom.db
- **THEN** application SHALL use /data/custom.db for the SQLite database

#### Scenario: Environment override via .env file

- **WHEN** a .env file exists in the same directory as docker-compose.yml with HOWCANI_PORT=9000
- **THEN** service SHALL use port 9000 instead of the default 3000

### Requirement: Git Artifact Exclusion

The repository SHALL exclude Docker build artifacts from version control via .gitignore.

The .gitignore file MUST exclude: dist/ directory (build output), .env files (local configuration), and *.db files (local databases).

#### Scenario: Build artifacts not committed

- **WHEN** bun build creates files in dist/ directory
- **THEN** git status SHALL NOT show dist/ as untracked or modified

#### Scenario: Local environment not committed

- **WHEN** user creates a .env file for local Docker Compose configuration
- **THEN** git status SHALL NOT show .env as untracked

#### Scenario: Local database not committed

- **WHEN** application creates data/howcani.db
- **THEN** git status SHALL NOT show .db files as untracked
