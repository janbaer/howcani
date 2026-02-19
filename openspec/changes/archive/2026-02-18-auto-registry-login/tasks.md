## 1. Update build-docker.sh

- [x] 1.1 Replace the auth-check block with auto-login logic: if auth file missing or registry not in it, check `$FORGEJO_TOKEN` and run login via stdin; if token unset, exit with error
- [x] 1.2 Verify the script works when already authenticated (fast-path skips login)

## 2. Verification

- [x] 2.1 Close Forgejo issue #14
