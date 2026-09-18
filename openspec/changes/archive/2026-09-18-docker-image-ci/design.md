## Context

The runner (jan/ansible-homelab#14) has one label, `docker`, mapped to `node:24-trixie`, and a privileged `docker:dind` sidecar. Job containers are created by dind on per-job bridge networks and have neither a docker CLI nor `DOCKER_HOST`. Pushing `:latest` triggers the deploy webhook.

## Goals / Non-Goals

**Goals:** build and publish on the runner on version bumps; keep a manual fallback.

**Non-Goals:** lint/test CI for pull requests; multi-arch images; recovering a run where `:<version>` was pushed but `:latest` was not.

## Decisions

- **Docker access via dind's socket.** The job mounts `/var/run/docker.sock` through `container.options`, which the runner allows via `valid_volumes`. The mount resolves inside dind, the daemon that creates the job container. Rejected: TCP to the bridge gateway (IP dependent), buildah/kaniko (a different build tool than the fallback), a dind service per job (privileged jobs, cold cache).
- **CLI from Debian.** `apt-get install docker-cli` in the `node:24-trixie` job. `docker:*-cli` is Alpine without Node, so `actions/checkout` would fail; a custom runner image is not worth maintaining for one repo.
- **Registry as source of truth.** `docker manifest inspect :<version>` after login decides whether to build. Idempotent on re-runs and independent of how many commits a push contains.
- **Bun version from the Dockerfile.** No build arg; the `ARG BUN_VERSION` default is already the maintained pin.
- **Push order.** `:<version>` before `:latest`, so the deploy only fires once the versioned tag exists.
- **Cleanup.** `docker rmi` of both tags in an `if: always()` step; builder layers are not pruned.
- **Notification.** `curl` to ntfy without auth, success with normal priority, failure with high priority, both with the run URL.
- **Releasing moves into the merge.** The project-local release skill goes away; `forgejo-pr-merge` bumps the version and writes the changelog on the head branch, and the squash merge onto `main` starts the build. Rejected: keeping a separate release skill, which duplicated the merge steps and left the bump as its own manual call.

## Risks / Trade-offs

- [Socket access from jobs is untested] → the first `workflow_dispatch` run on the existing version checks it without pushing anything.
- [dind storage grows with builder layers] → accepted; prune manually if `df` shows growth.
- [Every dependency PR touching `package.json` starts a run] → exits after the manifest check.
