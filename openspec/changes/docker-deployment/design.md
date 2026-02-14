## Context

The HowCanI application is currently a TypeScript/Bun application with a build script that compiles to a Bun binary (`bun build --target=bun`). The application:
- Runs an Elysia web server on port 3000 (configurable via `PORT` env var)
- Uses SQLite database stored in `./data/howcani.db` (configurable via `DATABASE_URL` env var)
- Has version `3.0.0` in package.json
- Requires Bun runtime to execute the compiled binary

Current deployment is manual. We need an automated containerized deployment that can be pushed to a private Forgejo registry at `forgejo.home.janbaer.de/jan`.

## Goals / Non-Goals

**Goals:**
- Automated build script that bumps version, builds binary, creates Docker image, and pushes to registry
- Multi-stage Docker build optimized for size (build stage + minimal runtime stage)
- Docker Compose configuration for production deployment with configurable port, data volume, and user/group ID
- Version synchronization between package.json and Docker image tags
- Support for both versioned tags and `latest` tag in registry

**Non-Goals:**
- Kubernetes/Helm deployment (Docker Compose only for now)
- Multi-architecture builds (x86_64/linux only initially)
- CI/CD integration (manual script execution for now)
- Health checks or monitoring configuration (can be added later)
- Database migration automation during container startup (manual for now)

## Decisions

### 1. Multi-stage Docker Build

**Decision**: Use two-stage build with Bun builder image and minimal runtime image.

**Rationale**:
- **Stage 1 (Builder)**: Use official `oven/bun` image to run `bun install` and `bun build`
- **Stage 2 (Runtime)**: Use `oven/bun:slim` or `oven/bun:alpine` with only the compiled binary
- Minimizes final image size by excluding build dependencies and source code
- The Bun binary still requires Bun runtime to execute (not a true standalone binary)

**Alternatives Considered**:
- Single-stage build: Simpler but results in larger images with unnecessary build tools
- Distroless base image: Would require truly standalone binary, but Bun's `--target=bun` still needs Bun runtime

### 2. Version Management Strategy

**Decision**: Use a Bun script (`scripts/bump-version.ts`) to bump package.json, then extract version for Docker tagging.

**Rationale**:
- Stays within Bun ecosystem - no need for npm
- Simple TypeScript script reads package.json, bumps version following semver rules, writes back
- Keeps version as single source of truth in package.json
- Supports semantic versioning workflow (patch for bugfixes, minor for features, major for breaking)

**Script responsibilities**:
1. Parse current version from package.json
2. Increment according to bump type (patch: 1.0.0→1.0.1, minor: 1.0.0→1.1.0, major: 1.0.0→2.0.0)
3. Write updated package.json

**Note**: Git tagging removed during development. Can be added back later for production releases.

**Alternatives Considered**:
- `npm version`: Works but introduces npm dependency when we're fully on Bun
- Manual version specification: Error-prone, less structured
- `jq` for JSON manipulation: Works but less readable than TypeScript for semver logic

### 3. Build Script Architecture

**Decision**: Single Bash script `scripts/build-docker.sh` that orchestrates full build→push workflow.

**Script flow**:
1. Validate prerequisites (Docker, Bun, git clean working tree)
2. Accept version bump type as argument (patch/minor/major)
3. Bump version with `bun run scripts/bump-version.ts <type>`
4. Read new version from package.json
5. Run `bun build` to create binary in `dist/`
6. Build Docker image with version tag
7. Tag image as `latest`
8. Push both tags to registry
9. Clean up build artifacts

**Rationale**:
- Single command for entire release process reduces errors
- Validates preconditions before making changes
- Atomic operation: either completes fully or fails early

**Alternatives Considered**:
- Makefile: Less portable, more complex syntax
- Separate scripts per step: More chance for partial completion and inconsistent state

### 4. Docker Compose Configuration

**Decision**: Single `docker-compose.yml` with environment variables for all runtime configuration.

**Configuration approach**:
```yaml
environment:
  PORT: ${HOWCANI_PORT:-3000}
  DATABASE_URL: /data/howcani.db
  NODE_ENV: production
user: "${HOWCANI_UID:-1000}:${HOWCANI_GID:-1000}"
volumes:
  - ${HOWCANI_DATA_DIR:-./data}:/data
ports:
  - "${HOWCANI_PORT:-3000}:${HOWCANI_PORT:-3000}"
```

**Rationale**:
- All runtime config via environment variables with sensible defaults
- Explicit user/group ID configuration for file permission control
- Volume mount keeps database outside container for persistence
- Port mapping makes both host and container ports configurable

**Alternatives Considered**:
- Multiple compose files for different environments: Overkill for this use case
- Hardcoded values: Not flexible enough for different deployments
- `.env` file required: Less flexible, decided to make it optional with defaults

### 5. Registry Authentication

**Decision**: Require manual `docker login forgejo.home.janbaer.de` before running build script.

**Rationale**:
- Credentials should not be in scripts or version control
- Login persists in Docker daemon, works for multiple pushes
- Build script validates authentication by checking `docker info` or attempting push

**Alternatives Considered**:
- Credentials in environment variables: Still requires secure storage
- Docker credential helpers: Additional dependency, more complex setup

### 6. Data Directory Structure

**Decision**: Mount single `/data` directory containing all persistent state (database, uploads, etc.).

**Rationale**:
- Single volume simplifies backup and restore operations
- Database already configured to use `./data/` directory
- Future expansion (user uploads, logs) can use same volume
- Clear separation between ephemeral container and persistent data

**Alternatives Considered**:
- Separate volumes for database and uploads: More complex, no clear benefit currently
- Database in named Docker volume: Less transparent, harder to backup

## Risks / Trade-offs

### [Risk] Bun version mismatch between build and runtime
**Mitigation**: Pin Bun version in Dockerfile (e.g., `FROM oven/bun:1.1.16`). Document required version in README. Consider adding version check to build script.

### [Risk] Registry unavailable during build
**Mitigation**: Build script validates registry connectivity before building. Provide clear error messages. Image remains local if push fails (can retry push separately).

### [Risk] Database migration not automated
**Trade-off**: Manual migration gives more control but requires operational overhead. For now, document migration process. Can automate in entrypoint script later if needed.

### [Risk] File permission issues with mounted volume
**Mitigation**: Require explicit UID/GID configuration in Docker Compose. Document that data directory on host should be owned by specified user. Provide helper script to fix permissions if needed.

### [Risk] Port conflicts on host
**Mitigation**: Make port fully configurable in Docker Compose. Default to 3000 but allow override. Document how to check for and resolve port conflicts.

### [Risk] Version bump without corresponding code changes
**Trade-off**: Build script doesn't validate that changes exist. Developers must exercise judgment about when to bump versions. Consider adding `git diff --exit-code` check in future.

## Migration Plan

### Initial Setup (One-time)
1. Authenticate to registry: `docker login forgejo.home.janbaer.de`
2. Create data directory on host: `mkdir -p /path/to/data && chown $UID:$GID /path/to/data`
3. Copy `docker-compose.yml` to deployment location
4. Create `.env` file with custom values (optional):
   ```
   HOWCANI_PORT=8080
   HOWCANI_DATA_DIR=/var/lib/howcani/data
   HOWCANI_UID=1001
   HOWCANI_GID=1001
   ```

### Deployment Process
1. Run build script: `./scripts/build-docker.sh [patch|minor|major]`
   - This bumps version, builds image, pushes to registry
2. On deployment host: `docker-compose pull`
3. Run migrations (if needed): `docker-compose run --rm app bun run db:migrate`
4. Start service: `docker-compose up -d`
5. Verify: `docker-compose logs -f` and check `http://localhost:3000`

### Rollback Strategy
1. Identify last known good version tag
2. Update `docker-compose.yml` image tag to specific version
3. Run `docker-compose pull && docker-compose up -d`
4. If database migration was involved, restore database backup before starting

No breaking changes to existing deployment since this is net-new functionality.

## Open Questions

1. **Database backup strategy**: Should we include backup/restore scripts or document manual process?
   - Recommendation: Document manual backup for now (`cp data/howcani.db data/howcani.db.backup`)

2. **Health check configuration**: Should we add Docker health checks to compose file?
   - Recommendation: Add simple HTTP health check (`curl -f http://localhost:3000/ || exit 1`)

3. **Log management**: Where should application logs be written?
   - Recommendation: Write to stdout (Docker captures), document log access via `docker-compose logs`

4. **Resource limits**: Should we set memory/CPU limits in Docker Compose?
   - Recommendation: Start without limits, add if needed based on monitoring

5. **Multi-architecture support**: Will this run on ARM (e.g., Raspberry Pi)?
   - Recommendation: Start with x86_64 only, add ARM builds if needed (requires `--platform` flag)
