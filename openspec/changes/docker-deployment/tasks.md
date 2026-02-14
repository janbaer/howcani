## 1. Version Management Script

- [x] 1.1 Create `scripts/bump-version.ts` with TypeScript interface for bump types
- [x] 1.2 Implement version parsing from package.json using Bun.file API
- [x] 1.3 Implement semantic version increment logic (patch/minor/major)
- [x] 1.4 Implement package.json write with updated version
- [x] 1.6 Add error handling for invalid bump types and git failures
- [x] 1.7 Test script with all three bump types (patch, minor, major)

## 2. Docker Build Configuration

- [x] 2.1 Create `Dockerfile` with multi-stage build structure
- [x] 2.2 Configure builder stage using pinned `oven/bun` image version
- [x] 2.3 Add builder stage commands: COPY package files, RUN bun install, COPY source, RUN bun build
- [x] 2.4 Configure runtime stage using `oven/bun:slim` or `oven/bun:alpine`
- [x] 2.5 Add runtime stage commands: COPY binary from builder, set working directory
- [x] 2.6 Configure runtime environment: EXPOSE port, set default ENV variables (NODE_ENV=production)
- [x] 2.7 Set CMD to run the compiled binary
- [x] 2.8 Configure non-root USER in runtime stage
- [x] 2.9 Create `.dockerignore` excluding node_modules, .git, data/, dist/, .env, *.db, test files

## 3. Build Automation Script

- [x] 3.1 Create `scripts/build-docker.sh` with bash shebang and error handling (set -e)
- [x] 3.2 Add prerequisite validation: check Docker daemon running
- [x] 3.3 Add prerequisite validation: check Bun installed
- [x] 3.4 Add prerequisite validation: check git working tree is clean
- [x] 3.5 Add argument parsing for version bump type with usage message
- [x] 3.6 Implement version bump step: call bump-version.ts script
- [x] 3.7 Implement version extraction: read version from package.json
- [x] 3.8 Implement Bun build step: run bun build command
- [x] 3.9 Implement Docker build step with version tag (forgejo.home.janbaer.de/jan/howcani:VERSION)
- [x] 3.10 Implement Docker tag step for latest (forgejo.home.janbaer.de/jan/howcani:latest)
- [x] 3.11 Implement registry authentication check
- [x] 3.12 Implement registry push for both tags (version and latest)
- [x] 3.13 Add cleanup step: remove build artifacts in dist/
- [x] 3.14 Add success message with pushed image tags
- [x] 3.15 Make script executable: chmod +x scripts/build-docker.sh

## 4. Docker Compose Configuration

- [x] 4.1 Create `docker-compose.yml` with version specification
- [x] 4.2 Define howcani service using image from Forgejo registry
- [x] 4.3 Configure image tag (default: latest, with comment showing version override)
- [x] 4.4 Configure container_name for the service
- [x] 4.5 Add environment variables: PORT with default ${HOWCANI_PORT:-3000}
- [x] 4.6 Add environment variables: DATABASE_URL=/data/howcani.db, NODE_ENV=production
- [x] 4.7 Configure user with ${HOWCANI_UID:-1000}:${HOWCANI_GID:-1000}
- [x] 4.8 Configure volume mount: ${HOWCANI_DATA_DIR:-./data}:/data
- [x] 4.9 Configure port mapping: ${HOWCANI_PORT:-3000}:${HOWCANI_PORT:-3000}
- [x] 4.10 Add restart policy: unless-stopped
- [x] 4.11 Add health check using curl to test application endpoint
- [x] 4.12 Add comments documenting all configurable environment variables

## 5. Git Configuration

- [x] 5.1 Update `.gitignore` to exclude dist/ directory
- [x] 5.2 Update `.gitignore` to exclude .env files
- [x] 5.3 Update `.gitignore` to exclude *.db files (if not already present)
- [x] 5.4 Verify .gitignore changes with git status after building locally

## 6. Documentation

- [x] 6.1 Create deployment section in README.md covering Docker deployment
- [x] 6.2 Document registry authentication: docker login forgejo.home.janbaer.de
- [x] 6.3 Document build process: ./scripts/build-docker.sh [patch|minor|major]
- [x] 6.4 Document Docker Compose environment variables and defaults
- [x] 6.5 Document initial setup steps: create data directory, set permissions
- [x] 6.6 Document deployment process: docker-compose pull, up -d
- [x] 6.7 Document database migration process if needed
- [x] 6.8 Document rollback strategy: specific version deployment
- [x] 6.9 Document health check access: docker-compose logs, curl endpoint
- [x] 6.10 Add example .env file template with all HOWCANI_* variables

## 7. Testing & Validation

- [ ] 7.1 Test bump-version.ts script for patch increment
- [ ] 7.2 Test bump-version.ts script for minor increment
- [ ] 7.3 Test bump-version.ts script error handling (invalid type)
- [ ] 7.4 Build Docker image locally: docker build -t test-howcani .
- [ ] 7.5 Test Docker image runs: docker run -p 3000:3000 -v ./test-data:/data test-howcani
- [ ] 7.6 Verify application accessible at localhost:3000
- [ ] 7.7 Verify database created in mounted volume
- [ ] 7.8 Test full build-docker.sh script with patch bump (dry-run to local registry first)
- [ ] 7.9 Test Docker Compose with default configuration: docker-compose up -d
- [ ] 7.10 Test Docker Compose with custom port via environment variable
- [ ] 7.11 Test Docker Compose with custom data directory
- [ ] 7.12 Test Docker Compose with custom user/group ID
- [ ] 7.13 Verify health check passes: docker-compose ps
- [ ] 7.14 Test container restart persists data
- [ ] 7.15 Clean up test artifacts and validate .gitignore excludes them

## 8. Production Deployment

- [ ] 8.1 Authenticate to Forgejo registry: docker login forgejo.home.janbaer.de
- [ ] 8.2 Run full build and push: ./scripts/build-docker.sh patch
- [ ] 8.3 Verify images in registry: check forgejo.home.janbaer.de/jan/howcani tags
- [ ] 8.4 Deploy to production environment using docker-compose.yml
- [ ] 8.5 Verify production deployment health and accessibility
- [ ] 8.6 Document current production version for rollback reference
