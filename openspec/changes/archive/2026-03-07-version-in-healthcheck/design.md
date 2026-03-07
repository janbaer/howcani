## Context

The server already bakes the version from `package.json` into the client bundle at build time. The `/health` route in `src/server/index.ts` currently returns `{ status: "ok" }`. This is a minimal, self-contained change.

## Goals / Non-Goals

**Goals:**
- Include `version` in the `/health` response
- Version value matches `package.json` version at the time the server was built

**Non-Goals:**
- Adding other metadata (uptime, db status, etc.) — out of scope

## Decisions

**How to inject the version**: A module-level `const appVersion` tries the build-time `APP_VERSION` macro first (baked in by the production build, consistent with the startup log), then falls back to `Bun.env.npm_package_version` (automatically set by Bun from `package.json` at runtime — available in dev mode). This means both production and dev mode return the real version from `package.json`. Alternative considered: `import pkg from '../../package.json'` — works but couples the file to a relative path unnecessarily.

## Risks / Trade-offs

- `APP_VERSION` is `undefined` in dev mode (no build step) — `Bun.env.npm_package_version` covers this case. The production Docker image does not include `package.json` at runtime, so `Bun.env.npm_package_version` is unavailable there — but `APP_VERSION` is always injected at build time, making the fallback unreachable in production. All supported execution contexts are covered by the two-step chain; no further fallback is needed.
