## Why

The `/health` endpoint returns only `{ status: "ok" }`, making it impossible to confirm which version is running from outside the container. Adding the version enables operators and monitoring tools to verify deployments without inspecting logs or container metadata.

## What Changes

- The `GET /health` response body gains a `version` field containing the application version string (e.g. `"3.0.60"`)
- The version is baked into the server bundle at build time from `package.json`

## Capabilities

### New Capabilities

- `healthcheck`: The `/health` endpoint returns `{ status: "ok", version: "<semver>" }`

### Modified Capabilities

## Impact

- `src/server/index.ts`: health route response object updated
- Build process: version from `package.json` must be injected at build time (already done for the client footer via `Bun.env.npm_package_version` or a macro)
