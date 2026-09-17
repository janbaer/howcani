## 1. Workflow

- [x] 1.1 Create `.forgejo/workflows/docker-image.yml` with triggers, socket mount, docker CLI install and checkout
- [x] 1.2 Add version read, registry login and existing-tag check
- [x] 1.3 Add build, ordered push and `if: always()` cleanup
- [x] 1.4 Add ntfy success and failure notifications

## 2. Fallback and release flow

- [x] 2.1 Add `--no-bump` to `scripts/build-docker.sh`
- [x] 2.2 Remove the `forgejo-release-and-deploy` skill; releasing moves into the global `forgejo-pr-merge`

## 3. Docs

- [x] 3.1 Update `CLAUDE.md` "Release & Deployment"
- [x] 3.2 CHANGELOG entry: written by `update-changelog` during the release, like every other entry

## 4. Verify

- [x] 4.1 YAML lint, `bash -n`, `--no-bump` against a stub podman, and a local dind 29.8.1 run: job container with the socket mounted builds and removes the image
- [x] 4.2 `bun run lint` and `bun test`
