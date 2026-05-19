## 1. configService

- [x] 1.1 Create `src/server/config/config.schema.ts` — Zod schema for `embedding`, `backup`, `duplicate` sections (provider enum/null, dimension positive int, endpoint required when provider==llamacpp, time HH:MM regex, retentionDays 1–30, threshold 50–100)
- [x] 1.2 Create `src/server/config/config.service.ts` — resolve path from `HOWCANI_CONFIG_PATH` (default `./config.yaml`), parse YAML via Bun, validate with Zod, throw a clear error pointing at `config.example.yaml` on missing/invalid; export `getConfig()` returning a frozen typed object; provide a test seam (`__setConfigForTests` / module-level setter) so specs don't need a real file
- [x] 1.3 Write `src/server/config/config.service.spec.ts` — missing file throws, malformed YAML throws, wrong type fails Zod with field name, llamacpp without endpoint fails, valid file parses, provider null disables embeddings

## 2. Migration

- [x] 2.1 Add migration 14 `drop_app_settings` (`DROP TABLE IF EXISTS app_settings;`) to `src/server/db/migrations.ts`
- [x] 2.2 Update `src/server/db/migrations.spec.ts` — assert `app_settings` table absent after migration 14; drop/adjust assertions that expected the `app_settings` singleton row

## 3. Rewire embedding subsystem

- [x] 3.1 `embedding-providers/factory.ts` — read provider/model/endpoint from `getConfig().embedding` instead of `process.env.EMBEDDING_*`; keep `OPENROUTER_API_KEY` from env
- [x] 3.2 `db/embedding-dimension.ts` — return `getConfig().embedding.dimension` (or delete the module and inline `getConfig().embedding.dimension`, updating `migrations.ts` `vecItemsDdl()` and other callers)
- [x] 3.3 `services/embedding-startup.ts` — replace `process.env.EMBEDDING_ALLOW_DIMENSION_RESET` with `getConfig().embedding.allowDimensionReset`; update fatal-error message to name the `config.yaml` field
- [x] 3.4 Update `embedding.service.spec.ts`, `embedding-startup.spec.ts`, `embedding-providers/factory.spec.ts` — replace `process.env.EMBEDDING_*` setup with `configService` test seam

## 4. Rewire backup / duplicate / search call sites

- [x] 4.1 `services/scheduler.service.ts` — `init()` reads `getConfig().backup` and `getConfig().embedding.provider !== null`; backup retention reads `getConfig().backup.retentionDays`
- [x] 4.2 `services/item.service.ts` — `useHybrid` from `getConfig().embedding.provider !== null`; duplicate threshold from `getConfig().duplicate.threshold` (both call sites)
- [x] 4.3 `mcp/tools.ts` — `resolveUser` semanticSearchEnabled from `getConfig().embedding.provider !== null`
- [x] 4.4 `routes/admin.routes.ts` — `semanticEnabled` from `getConfig().embedding.provider !== null`
- [x] 4.5 Update `scheduler.service.spec.ts`, `item.service.spec.ts`, `admin.routes.spec.ts` — mock `configService` instead of `appSettingsRepository`

## 5. Settings API surface

- [x] 5.1 `services/settings.service.ts` — replace with read-only `getSettings()` deriving the existing UI JSON shape (`semanticSearchEnabled`, `duplicateThreshold`, `backupEnabled`, `backupTime`, `backupRetentionDays`) from `getConfig()`; delete `updateSettings()`
- [x] 5.2 `routes/settings.routes.ts` — remove the `PATCH /` route and its body schema; keep read-only `GET /`, backups list/download, restore upload
- [x] 5.3 Update/replace `routes/settings.routes` spec coverage if present — assert PATCH returns 404, GET returns derived config
- [x] 5.4 Delete `repositories/app-settings.repository.ts` and `repositories/app-settings.repository.spec.ts`; remove the now-dead `validateBackupTime` re-export path if it was only used by the old settings service (keep it where the scheduler still needs it)

## 6. Settings UI

- [x] 6.1 `src/client/pages/Settings.svelte` — remove semantic-search toggle, duplicate-threshold input, backup enable/time/retention controls and their handlers/timers; keep `BackupSection` and `DuplicatesSection`; still fetch `GET /api/settings` to obtain `savedThreshold` for the duplicates overview
- [x] 6.2 `src/client/lib/api.ts` — remove `settings.update`; keep `settings.get` (read-only) and backup endpoints; trim the `Settings` interface to what the UI still reads

## 7. Config files & docs

- [x] 7.1 Add `config.example.yaml` at repo root documenting every field with current defaults and inline comments
- [x] 7.2 Add `config.yaml` to `.gitignore`
- [x] 7.3 `.env.example` — remove `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSION`, `EMBEDDING_ENDPOINT`, `EMBEDDING_ALLOW_DIMENSION_RESET`; add a note that operator config now lives in `config.yaml`
- [x] 7.4 `docker-compose.yml` — add `HOWCANI_CONFIG_PATH` env (default `/data/config.yaml`) and a volume mount `${HOWCANI_CONFIG_PATH:-./config.yaml}:/data/config.yaml`
- [x] 7.5 `CLAUDE.md` — update the Environment Variables table (drop embedding env vars, add `HOWCANI_CONFIG_PATH`) and add a short note on the `config.yaml` model; update the Search section if it references env vars

## 8. Verify

- [x] 8.1 `bun run lint` passes (fix all issues)
- [x] 8.2 `bun run build` passes
- [x] 8.3 `bun test` passes (all rewired specs green)
- [x] 8.4 Manually run the issue's "How to Test" scenarios: missing config fails fast; valid config boots; malformed config fails with Zod error; `PATCH /api/settings` → 404; Settings UI has no operator toggles; `app_settings` table gone after migration

## 9. Post-review refinements (scope extension)

Decisions and rationale captured in `design.md` §4a–4c.

- [x] 9.1 Replace implicit `embedding.provider: null` toggle with explicit `embedding.enabled: boolean` (default `false`); make `provider` and `model` mandatory via `superRefine` when enabled; delete the `DEFAULT_OPENROUTER_MODEL`/`DEFAULT_LLAMACPP_MODEL` constants (stale `nomic` default caused a silent dimension mismatch)
- [x] 9.2 Rewire all `embedding.provider !== null` call sites to `embedding.enabled` (factory, item.service, scheduler.service, admin.routes, mcp/tools, settings.service); update affected specs
- [x] 9.3 Make `BACKUP_DIR` default relative (`./data/backups`) for consistency with `DATABASE_URL`/`HOWCANI_CONFIG_PATH`; ran gitnexus impact (LOW risk) before editing `backup.service.ts`
- [x] 9.4 Trim `docker-compose.yml` `environment:` block — drop all `${HOWCANI_*}` interpolation vars and `NODE_ENV`/`PORT` (image-provided); keep `DATABASE_URL`, `BACKUP_DIR`, `HOWCANI_CONFIG_PATH`, `TZ`
- [x] 9.5 Update `.env.example` (drop interpolation-only vars) and `config.example.yaml` (document `enabled`); spec deltas updated for operator-config, vector-embeddings, scheduled-backup, docker-deployment
- [x] 9.6 `bun test` (524 pass, 0 fail) and `bun run lint` green after refinements
