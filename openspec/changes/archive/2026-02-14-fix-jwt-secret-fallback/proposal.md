## Why

The JWT signing secret falls back to a hardcoded string (`'development-secret-change-in-production'`) when the `HOWCANI_JWT_SECRET` environment variable is unset. Since this value is committed to source control, any deployment that forgets to set the variable exposes the entire authentication system — an attacker can forge valid tokens for any user. The `docker-compose.yml` and `.env.example` also omit `HOWCANI_JWT_SECRET`, making this easy to miss in production. Additionally, `docker-compose.yml` does not reference an `.env` file at all, so even if a user creates one from `.env.example`, Docker Compose won't load it unless it happens to be named `.env` in the same directory.

## What Changes

- Remove the hardcoded JWT secret fallback and fail fast on startup when `HOWCANI_JWT_SECRET` is not set
- Add `HOWCANI_JWT_SECRET` to `docker-compose.yml` environment section (required, no default)
- Add `env_file` directive to `docker-compose.yml` so it explicitly loads from `.env`
- Add `HOWCANI_JWT_SECRET` to `.env.example` with documentation

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `authentication`: Add requirement that the application MUST refuse to start without a configured JWT secret

## Impact

- **Code**: `src/server/auth/jwt.ts` — remove fallback, add startup validation
- **Docker**: `docker-compose.yml` — add `HOWCANI_JWT_SECRET` environment variable, add `env_file` directive
- **Config**: `.env.example` — document `HOWCANI_JWT_SECRET` as required
- **Breaking**: Existing deployments without `HOWCANI_JWT_SECRET` set will fail to start (intentional — they were insecure)
