## Context

Operator configuration is currently spread across the `app_settings` SQLite singleton (mutable at runtime via `PATCH /api/settings`, read by `appSettingsRepository`), five `EMBEDDING_*` environment variables (read directly via `process.env` in `embedding-providers/factory.ts`, `embedding-dimension.ts`, `embedding-startup.ts`), and hardcoded defaults. HowCanI is a single-user personal app: the user is the operator, so "edit config + redeploy" is the same gesture as "log in and toggle". The design decision (Option B — move the whole `app_settings` table, not just embedding settings, to YAML) was already taken in a brainstorm; this document covers the *how*.

Constraints: Bun 1.3.13 imports YAML natively (`import cfg from './config.yaml'`), so no YAML parser dependency. `zod@4.4.3` is already a dependency. Tests use in-memory SQLite and `mock.module()` per the project's layered testing strategy.

## Goals / Non-Goals

**Goals:**
- One typed, validated source of truth for operator config (`config.yaml`).
- Fail fast at startup on missing or invalid config — no silent defaults masking misconfiguration.
- Keep secrets out of the YAML file; they stay in environment variables.
- Reduce API/UI surface: remove the `PATCH` endpoint and operator toggles.

**Non-Goals:**
- Runtime mutation of config (no hot-reload, no write-back to YAML). Changing config means edit + restart.
- Per-user settings (all config is global/operator-level; this was already true with `app_settings`).
- A config-migration tool from `app_settings` rows to YAML — the previous per-user/runtime values are discarded, same precedent as migration 13.
- Backwards-compatibility shims for the old env vars or `PATCH` endpoint.

## Decisions

### 1. Config location and loading

`configService` lives at `src/server/config/config.service.ts`. It reads the YAML file path from `HOWCANI_CONFIG_PATH` (default `./config.yaml`, container default `/data/config.yaml`), parses it with `Bun.YAML` / native YAML import, validates with a Zod schema, and exposes a frozen typed object via `getConfig()`. Loaded once at module load (singleton), mirroring `appSettingsRepository`/`embeddingService` singleton style.

- **Why a path env var, not a fixed path**: the Docker volume mount maps a host file to a container path; an env var keeps the container path documented and overridable without code change. It is *not* a secret and *not* config-in-env — it is a bootstrap pointer, the same role `DATABASE_URL` already plays.
- **Alternative considered**: fixed `./config.yaml` only. Rejected — the container runs from `/app` but persists state under `/data`; config belongs next to the database on the mounted volume.

### 2. Fail-fast on missing/invalid config

If the file is absent, unreadable, not valid YAML, or fails Zod validation, `configService` throws at module load. `src/server/index.ts` already runs top-level (`runMigrations()` etc. before serving) so an uncaught throw exits non-zero before the server binds. The error message names the missing/invalid field and points at `config.example.yaml`.

- **Why throw at module load, not lazy**: the embedding factory, scheduler, and migration 7 (`vec_items` dimension) all read config during the existing startup sequence. Lazy loading would just move the crash later and risk a half-initialised server.

### 3. Secret handling — secrets stay env-only (no `${VAR}` interpolation)

`config.yaml` never contains secrets. `OPENROUTER_API_KEY` and `HOWCANI_JWT_SECRET` continue to be read from `process.env` exactly where they are today (`embedding-providers/factory.ts`, auth middleware). No `${VAR}` interpolation is implemented.

- **Why**: interpolation adds a parser, an escaping story, and a "is this file safe to commit" ambiguity. Keeping the boundary crisp — *structure in YAML, secrets in env* — is simpler and matches the issue's preferred option. `config.yaml` is safe to commit as an example but the real one is gitignored alongside `.env`.

### 4. Schema shape

```yaml
embedding:
  enabled: false              # explicit on/off switch; false (or section omitted) ⇒ embeddings disabled
  provider: openrouter        # 'openrouter' | 'llamacpp' — REQUIRED when enabled
  model: openai/text-embedding-3-small  # REQUIRED when enabled, no default
  dimension: 1536
  endpoint: null              # required when provider == llamacpp
  allowDimensionReset: false
backup:
  enabled: false
  time: "20:00"               # HH:MM 24h
  retentionDays: 7
duplicate:
  threshold: 80               # 50–100
```

Zod schema enforces: `dimension` positive int, `time` matches `^([01]\d|2[0-3]):[0-5]\d$`, `retentionDays` 1–30, `threshold` 50–100. A `superRefine` enforces, when `embedding.enabled` is `true`: `provider` present, `model` present, and `endpoint` present when `provider === 'llamacpp'`. The existing range checks in `settings.service` and `validateBackupTime`/`getEmbeddingDimension` move into the Zod schema — single validation point.

- **Why mirror the old field semantics exactly**: keeps the embedding mismatch/self-check logic, backup cron, and duplicate detection behaviourally identical — only the *source* changes, minimising blast radius.

### 4a. Explicit `embedding.enabled` instead of `provider: null` (scope extension)

Originally the schema reused the old "`EMBEDDING_PROVIDER` unset ⇒ disabled" semantics via `provider: openrouter | llamacpp | null`, with per-provider model defaults (`openai/text-embedding-3-small`, `nomic-embed-text-v1.5`). During review this proved unsafe: after the repo switched its llama.cpp model to `jina-embeddings-v2-base-de`, the stale `nomic-embed-text-v1.5` default would still be selected if `model` was omitted, silently producing a dimension mismatch instead of a clear failure (this actually bit a dev environment).

Decision: replace the implicit toggle with an explicit `embedding.enabled: boolean` (default `false`). When `enabled` is `true`, `provider` and `model` are **mandatory with no defaults** — the schema fails validation at config load otherwise. The model-default constants are deleted.

- **Why**: configuration that controls which embedding model is stored must be declared, not defaulted. A wrong silent default produces a corrupt vector store; a fail-fast at config load is the project's established posture (matches the embedding-mismatch fatal precedent).
- **Trade-off**: `provider`/`model` become `optional()` in the static type, so the factory uses `model!`/`endpoint!` — sound because the schema guarantees them whenever `enabled` is `true`. A discriminated union would express this in the type system but complicates `prefault({})` and the always-present `dimension`/`allowDimensionReset` fields; not worth the churn.
- The disabled path no longer logs a startup warning — `enabled: false` is an explicit operator choice, not a misconfiguration worth warning about.

### 4b. Path-default consistency — `BACKUP_DIR` relative (scope extension, "Option A")

`DATABASE_URL` and `HOWCANI_CONFIG_PATH` default to **relative** paths (`./data/howcani.db`, `./config.yaml`) — dev-first, pinned to absolute `/data/...` by docker-compose. `BACKUP_DIR` defaulted to the **absolute** `/data/backups`, which only "worked" because it baked in the container's filesystem layout, and was a latent bug in dev (enabling backups would try to write to an unwritable filesystem-root `/data/backups`).

Decision: change the `BACKUP_DIR` default to `./data/backups` (relative), consistent with the other two. Mental model is now uniform: *path env vars default relative to CWD; docker-compose pins them to `/data`.*

- **Consequence**: `BACKUP_DIR: /data/backups` in docker-compose is now **required**, not redundant (the relative default would resolve to `/app/data/backups`, outside the volume).
- **Why config stays at project-root `./config.yaml`, not `./data/config.yaml`**: config is operator-authored *input* (hand-edited, like `.env`), conceptually distinct from runtime-generated *state* (db, backups). It lives next to `config.example.yaml`. Accepted minor asymmetry in the dev defaults.

### 4c. docker-compose environment trim (scope extension)

The compose `environment:` block dropped all `${HOWCANI_*}` interpolation variables (`HOWCANI_PORT`, `HOWCANI_DATA_DIR`, `HOWCANI_BACKUP_DIR`, `HOWCANI_UID`, `HOWCANI_GID`, `HOWCANI_TZ`) in favour of hardcoded values, and removed `NODE_ENV`/`PORT` because the Dockerfile already bakes them in (`ENV NODE_ENV=production`, `ENV PORT=3000`).

The block now carries only the four genuinely-required vars: `DATABASE_URL`, `BACKUP_DIR`, `HOWCANI_CONFIG_PATH` (each pins a relative-default path to the `/data` volume), and `TZ` (the backup cron converts local→UTC; container default is UTC).

- **Accepted coupling**: `DATABASE_URL` is only honoured when `NODE_ENV === 'production'` (`database.ts` switch). With `NODE_ENV` no longer in compose, persistence depends on the Dockerfile's baked-in `ENV`. Acceptable — the Dockerfile is the single source of truth for the image; overriding `NODE_ENV` at runtime is an unsupported deployment.

### 5. Call-site rewiring

`appSettingsRepository.get()` returned `{ semanticSearchEnabled, duplicateThreshold, backupEnabled, backupTime, backupRetentionDays }`. New mapping:

| Old | New |
|---|---|
| `appSettingsRepository.get().semanticSearchEnabled` | `getConfig().embedding.enabled` |
| `appSettingsRepository.get().duplicateThreshold` | `getConfig().duplicate.threshold` |
| `appSettingsRepository.get().backup{Enabled,Time,RetentionDays}` | `getConfig().backup.{enabled,time,retentionDays}` |
| `process.env.EMBEDDING_PROVIDER` etc. | `getConfig().embedding.*` |
| `process.env.EMBEDDING_DIMENSION` | `getConfig().embedding.dimension` |
| `process.env.EMBEDDING_ALLOW_DIMENSION_RESET === 'true'` | `getConfig().embedding.allowDimensionReset` |

`semanticSearchEnabled` is derived from `embedding.enabled` rather than a separate flag — the single `enabled` boolean is both the operator's on/off switch and the value the UI/MCP read. This collapses the old `semantic_search_enabled` toggle.

`settings.service` keeps a read-only `getSettings()` returning the same JSON shape the UI expects (derived from `getConfig()`), so `GET /api/settings` and the UI's display path need minimal change. `updateSettings()` and the `PATCH` route are deleted.

- **Layer rule**: `configService` is a service-layer module with no repository (it reads a file, not the DB). Services may call other services, so `item.service`/`scheduler.service` calling `configService` is allowed. `mcp/tools` already bypasses the service layer by design — it reads `configService` directly, same as it read `appSettingsRepository`.

### 6. Migration 14

`drop_app_settings`: `DROP TABLE IF EXISTS app_settings;`. Sequential, runs on startup like all migrations. No data preserved (operator must author `config.yaml`; migration 13 set the same precedent of discarding prior values).

## Risks / Trade-offs

- **Existing deployments lose their `app_settings` values on upgrade** → Acceptable and intended (issue says "no silent defaults"). Mitigation: `config.example.yaml` documents every field with the current defaults; the fail-fast error message points operators at it. Single-user app, operator controls the upgrade.
- **Fail-fast means a typo in `config.yaml` takes the server down on restart** → This is the desired behaviour (matches embedding-mismatch fatal precedent). Mitigation: Zod error names the exact bad field and expected type; `config.example.yaml` is the reference.
- **Bun native YAML import is relatively new** → Mitigation: it is stable in 1.3.13 (the pinned runtime); fallback would be `Bun.YAML.parse(await Bun.file(path).text())` if import-assertion form proves flaky in the bundled build. Build step (`bun run build`) will catch resolution issues.
- **Tests that set `EMBEDDING_*` env vars or mock `appSettingsRepository`** → Rewired to inject/mock `configService`. `configService` exposes a test seam (e.g. `__setConfigForTests()` or `mock.module()` on the config module) so specs don't need a real file.
- **`config.yaml` not gitignored could leak a future secret** → No secrets are ever written to it by design; still, add `config.yaml` to `.gitignore` and commit only `config.example.yaml`.

## Migration Plan

1. Ship `configService`, schema, migration 14, rewired call sites.
2. Operator copies `config.example.yaml` → `config.yaml` (host volume), fills values matching their old env vars / settings.
3. `docker-compose.yml` mounts `${HOWCANI_CONFIG_PATH:-./config.yaml}:/data/config.yaml`; `HOWCANI_CONFIG_PATH` defaults to `/data/config.yaml` in the container env.
4. Deploy: migration 14 drops `app_settings`; server reads `config.yaml`. If the file is missing the container fails its healthcheck and `restart: unless-stopped` loops with a clear log message until the operator provides it.
5. Rollback: redeploy the previous image; migration 14 is forward-only but `app_settings` is recreated by migration 13 only on a fresh DB — rollback requires restoring a DB backup if `app_settings` data is needed. Given single-user + fail-fast intent, rollback is "fix `config.yaml`, not revert".

## Open Questions

None — secret handling, schema shape, and config path are decided above.
