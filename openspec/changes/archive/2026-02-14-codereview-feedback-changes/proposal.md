## Why

Code review feedback identified a redundant build step in `scripts/build-docker.sh`. The script runs `bun run build` on the host (step 3), but the Docker build performs its own `bun run build` inside the container. Since `dist/` is in `.dockerignore`, the host-built artifacts are never used, adding unnecessary time to the build process.

## What Changes

- Remove the redundant host-side `bun run build` step from `scripts/build-docker.sh`
- Remove the corresponding `dist/` cleanup step at the end of the script (nothing to clean up)
- Add a `bun test` step to the Dockerfile before the build step to catch regressions early

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

_(none — implementation-only change, no spec-level behavior changes)_

## Impact

- **Scripts**: `scripts/build-docker.sh` — faster Docker build workflow by skipping unnecessary host build
- **Docker**: `Dockerfile` — tests run during image build, failing tests block image creation
