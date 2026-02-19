## Context

`scripts/build-docker.sh` checks for existing registry auth by looking for the auth file and the registry hostname in it. If not found, it exits with an error and instructs the user to run `podman login` manually. In CI or scripted deployments, `$FORGEJO_TOKEN` is available but the session has no cached auth.

## Goals / Non-Goals

**Goals:**
- Automate registry login using `$FORGEJO_TOKEN` when auth is missing
- Keep the fast-path: skip login when already authenticated

**Non-Goals:**
- Changing the registry URL or credentials format
- Supporting multiple registries or credential stores

## Decisions

### Use `--password-stdin` for credential injection

Passing the token via stdin (`echo "$FORGEJO_TOKEN" | $CONTAINER_CMD login ... --password-stdin`) avoids the token appearing in the process list, which is a security best practice for both Docker and Podman.

Alternative: `--password "$FORGEJO_TOKEN"` would expose the token in `ps` output.

### Keep the existing auth-file check as the fast-path

If the auth file already contains the registry, skip login entirely. This avoids unnecessary network calls and keeps the script fast for developers who are already logged in.

### Error when both auth and token are missing

If the registry is not in the auth file and `$FORGEJO_TOKEN` is unset, exit with a clear error message explaining what is needed.

## Risks / Trade-offs

- [Token exposure in env] → Using `--password-stdin` mitigates process-list exposure; env vars are standard for CI tokens
- [Auth file path differences] → Already handled by the existing `AUTH_FILE` variable which accounts for Podman vs Docker paths
