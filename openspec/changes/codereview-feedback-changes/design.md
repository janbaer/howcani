## Context

The `scripts/build-docker.sh` script has a "Step 3: Build Bun binary" that runs `bun run build` on the host. The Dockerfile already runs `bun run build` in the builder stage. Since `dist/` is in `.dockerignore`, the host-built artifacts never reach the Docker build context.

## Goals / Non-Goals

**Goals:**
- Remove the redundant host-side build step
- Remove the now-unnecessary `dist/` cleanup step

**Non-Goals:**
- Changing the Docker build process itself
- Modifying the Dockerfile

## Decisions

Remove step 3 (host build) and step 7 (dist cleanup) from `build-docker.sh`. Renumber remaining steps for clarity.
