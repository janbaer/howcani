## Why

Releases are built and pushed from the workstation with `scripts/build-docker.sh`, which needs a local Bun, a running container runtime and a registry login. The Forgejo runner from jan/ansible-homelab#14 exists so this can move to CI: pushing a new version to `main` should be enough to release (jan/howcani#121).

## What Changes

- New `.forgejo/workflows/docker-image.yml`: on push to `main` touching `package.json`, or on `workflow_dispatch` for `main`, builds the image and pushes `:<version>` and `:latest` unless `:<version>` already exists, removes the local tags, and reports the result to ntfy. A dispatch on any other ref skips, so a feature branch cannot publish.
- `scripts/build-docker.sh` gets a `--no-bump` mode to build and push the current version by hand when CI is unavailable.
- The project-local `forgejo-release-and-deploy` skill is removed. The global `forgejo-pr-merge` skill now writes the version bump and the changelog entry on the head branch before merging, so the squash merge onto `main` is what starts the image build.
- `CLAUDE.md` describes the new release flow.

## Capabilities

### New Capabilities
- `ci-image-build`: Forgejo Actions workflow that builds and publishes the Docker image from `main`

### Modified Capabilities
- `docker-deployment`: the build script can build the current version without bumping it

## Impact

- New repo secret `REGISTRY_TOKEN` (PAT, scope `write:package`)
- Depends on `container.valid_volumes: [/var/run/docker.sock]` in the runner config (jan/ansible-homelab PR #15)
- Every merge that touches `package.json` starts a run; runs for an existing version exit early
