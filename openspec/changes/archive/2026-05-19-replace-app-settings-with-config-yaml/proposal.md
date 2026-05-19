## Why

After issue #94 there are three places to look for "how is this server configured": the `app_settings` SQLite singleton (mutable at runtime via `PATCH /api/settings`), five `EMBEDDING_*` environment variables, and hardcoded defaults scattered through the codebase. Every one of these is operator territory in a single-user personal app, so the live-toggle pattern buys complexity (mismatch detection, settings-UI maintenance, a `PATCH` endpoint) without paying for it. A single typed `config.yaml` gives one place to look, one place to validate, one place to document.

## What Changes

- Add a `config.yaml` operator config file with `embedding`, `backup`, and `duplicate` sections, loaded and Zod-validated once at startup by a new `configService`.
- **BREAKING**: Server refuses to start if `config.yaml` is missing or fails schema validation — no silent defaults.
- **BREAKING**: Migration 14 drops the `app_settings` table.
- **BREAKING**: `appSettingsRepository` is deleted; `item.service`, `scheduler.service`, `mcp/tools`, `admin.routes`, `settings.service` read from `configService` instead.
- **BREAKING**: `PATCH /api/settings` is removed. `GET /api/settings` is kept read-only so the UI can display current config.
- **BREAKING**: Embedding env vars (`EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSION`, `EMBEDDING_ENDPOINT`, `EMBEDDING_ALLOW_DIMENSION_RESET`) are removed; their values move into `config.yaml`. Secrets (`OPENROUTER_API_KEY`, `HOWCANI_JWT_SECRET`) stay env-only and are never read from YAML.
- Settings page drops the semantic-search toggle, duplicate-threshold input, and backup-schedule controls; keeps the backup list, restore upload, and duplicates overview.
- `config.example.yaml` added, `.env.example` trimmed, `docker-compose.yml` mounts the config file, `CLAUDE.md` updated.

## Capabilities

### New Capabilities
- `operator-config`: Startup loading and Zod validation of a single `config.yaml` operator configuration file; fail-fast behaviour on missing/invalid config; secret-handling boundary (secrets stay in env, never in YAML).

### Modified Capabilities
- `user-settings`: Settings are no longer stored in `app_settings` or mutated at runtime; `PATCH /api/settings` removed; `GET /api/settings` becomes read-only; Settings UI strips operator toggles.
- `vector-embeddings`: Embedding provider/model/dimension/endpoint/reset configuration source changes from environment variables to `config.yaml`.
- `scheduled-backup`: Backup enable/time/retention source changes from `app_settings` to `config.yaml`; runtime re-apply after `PATCH` removed.
- `duplicate-detection`: Duplicate threshold source changes from `app_settings.duplicate_threshold` to `config.yaml`.
- `docker-deployment`: Docker Compose mounts `config.yaml` into the container at a documented path.

## Impact

- **Code**: `src/server/config/` (new `configService`), `src/server/db/migrations.ts` (migration 14), delete `app-settings.repository.ts`, rewire `item.service.ts`, `scheduler.service.ts`, `settings.service.ts`, `mcp/tools.ts`, `admin.routes.ts`, `embedding-providers/factory.ts`, `embedding-startup.ts`, `embedding-dimension.ts`, `settings.routes.ts`, `src/client/pages/Settings.svelte`, `src/client/lib/api.ts`.
- **APIs**: `PATCH /api/settings` removed (returns 404); `GET /api/settings` read-only.
- **Config/Ops**: new `config.yaml` (required), `config.example.yaml`, trimmed `.env.example`, `docker-compose.yml` volume mount, `CLAUDE.md` env-var table.
- **Tests**: specs mocking `appSettingsRepository` (`scheduler.service.spec`, `item.service.spec`, `admin.routes.spec`) rewired to mock `configService`; `app-settings.repository.spec` deleted; embedding/factory specs that set `EMBEDDING_*` env vars rewired.
- **Dependencies**: no new runtime deps — Bun imports YAML natively, `zod` already present.
