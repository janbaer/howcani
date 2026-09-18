## Context

`docker manifest inspect` reports "absent" and "could not ask" through the same non-zero exit. Both of Forgejo's APIs answer distinguishably, which makes the difference visible.

## Goals / Non-Goals

**Goals:** a failed check stops the release instead of quietly redeploying.

**Non-Goals:** retrying a failed check; concurrency protection for two pushes racing.

## Decisions

- **Forgejo's package API over the registry API.** `GET /api/v1/packages/<owner>/container/<name>/<version>` answers `200` for a released version and `404` for an unknown one, measured against this instance. The registry API at `/v2/.../manifests/<version>` answers the same, but only after fetching a bearer token from `/v2/token` and with four `Accept` types on the request — two round trips and a header line for the same answer. Rejected: matching Docker's error text, which depends on wording upstream is free to change.
- **No credential.** The package is public, so the request answers anonymously. The registry API needs at least an anonymous bearer token even for public packages; the package API does not. If the repository ever becomes private the request turns into `401`, which lands in the error branch and stops the job rather than releasing.
- **Check before login.** Since the check no longer needs the Docker CLI, the install and the `docker login` only run when something is built. A run for an already released version is then a checkout plus one request.
- **`repo`, not `path`.** The step splits `$IMAGE` into host, owner and name. In zsh `path` is tied to `PATH`, and assigning to it breaks the shell; job steps run under bash where it is harmless, but the name is avoided so the snippet survives being pasted into a shell.

## Risks / Trade-offs

- [A registry that answers `500` during an outage now blocks the release] → intended; the run fails loudly and ntfy reports it, instead of deploying an already released version again.
- [The check depends on the package staying public] → a private repository makes it fail loudly on the next release, not silently.
