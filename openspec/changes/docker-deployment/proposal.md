## Why

The HowCanI application needs a production deployment solution that packages the application as a containerized service. This enables consistent deployment across environments, simplifies dependency management, and provides a standard way to run the application using Docker. The solution should leverage Bun's single binary compilation for optimal container size and startup performance.

## What Changes

- **Build automation**: Script that builds the Bun binary, bumps package.json version, and creates versioned Docker images
- **Docker image**: Container configuration that runs the Bun compiled binary with configurable runtime parameters
- **Registry integration**: Automated push to private registry at `forgejo.home.janbaer.de/jan` with both version tag and `latest` tag
- **Docker Compose configuration**: Production-ready compose file with:
  - Configurable port exposure
  - Host-mounted data directory for persistence
  - Configurable user/group ID for filesystem permissions
- **Version management**: Automatic semantic versioning in package.json synchronized with image tags

## Capabilities

### New Capabilities
- `docker-deployment`: Complete Docker containerization including build script, Dockerfile, registry publishing, and Docker Compose configuration for running the application with configurable port, data directory, and user permissions

### Modified Capabilities
<!-- No existing capabilities are being modified -->

## Impact

**New Files**:
- `Dockerfile` - Multi-stage build for Bun binary compilation and minimal runtime image
- `docker-compose.yml` - Deployment configuration with environment variables
- `scripts/build-docker.sh` - Automated build and publish script
- `.dockerignore` - Build context optimization

**Modified Files**:
- `package.json` - Version field will be auto-incremented by build script
- `.gitignore` - Add Docker build artifacts

**Infrastructure**:
- Requires access to private registry `forgejo.home.janbaer.de/jan`
- Registry credentials must be configured for publishing
- Docker and Docker Compose required for deployment

**Runtime Dependencies**:
- Base image: Bun runtime (or minimal Linux if using compiled binary)
- Exposed ports: Configurable (default port to be determined)
- Mounted volumes: Data directory for SQLite database and user content
