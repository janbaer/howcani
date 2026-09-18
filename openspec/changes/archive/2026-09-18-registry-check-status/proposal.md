## Why

The version check treats every non-zero exit of `docker manifest inspect` as "tag does not exist". A registry outage, an expired token or a network error therefore looks exactly like a new version: the job builds, pushes over the identical tag and pushes `:latest`, which deploys again for no reason (#125).

## What Changes

- The check asks Forgejo's package API and branches on the HTTP status: `200` skips, `404` builds, anything else fails the job.
- The Docker CLI install and `docker login` move behind the check, because `curl` needs neither. A run for an already released version then only checks out and makes one request.

## Capabilities

### New Capabilities

### Modified Capabilities
- `ci-image-build`: a failed check fails the job instead of building

## Impact

`.forgejo/workflows/docker-image.yml`. No secret at all in the check: the package is public and the API answers anonymously. `REGISTRY_TOKEN` is still used for the push.
