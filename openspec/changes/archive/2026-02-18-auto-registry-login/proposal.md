## Why

The build-and-push script requires manual registry login before each deployment, blocking automation. The `$FORGEJO_TOKEN` environment variable is already available in the deployment environment and should be used to authenticate automatically.

## What Changes

- The `scripts/build-docker.sh` script will automatically log in to the Forgejo registry using `$FORGEJO_TOKEN` instead of exiting when not authenticated
- If already authenticated, the login step is skipped
- If `$FORGEJO_TOKEN` is not set and authentication is missing, exit with a clear error

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `docker-deployment`: Registry authentication check changes from fail-and-exit to auto-login using `$FORGEJO_TOKEN`

## Impact

- `scripts/build-docker.sh`: authentication check block replaced with auto-login logic
