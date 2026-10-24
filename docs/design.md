> **Status:** Final — 2026-10-24
> **Open:** —

# Design

Project-wide decisions the code does not show. Each entry names the requirements from `docs/requirements.md` it satisfies. Decisions that concern a single area live in their own document:

- `docs/services/search.md`: full-text and hybrid search
- `docs/services/embeddings.md`: embedding config, model switch, backfill
- `docs/services/similarity.md`: related items and duplicates
- `docs/services/backup.md`: scheduled backup, download, restore
- `docs/services/mcp.md`: MCP identity and tools
- `docs/services/auth.md`: login token lifetime
- `docs/services/release.md`: CI image build, version injection, update detection
- `docs/services/tooling.md`: git hooks, type checks, dev script, Tailwind
- `docs/services/client.md`: frontend mechanics that break silently

## JWT secret has no fallback

`jwt.ts` used to fall back to a hardcoded string, so anyone could forge tokens on a deployment that forgot the variable. The fallback is gone and the process throws at module load; a warning-only variant was rejected because it is easy to miss. `docker-compose.yml` must keep `env_file: .env`: Compose reads `.env` only for substitution inside the YAML, not into the container.

Satisfies: R1, R12 · Origin: fix-jwt-secret-fallback · Date: 2026-02-14

## Embeddings never block or fail a request

Embedding on create or update only logs on failure; the item is saved either way. Related items, duplicates and the duplicates overview return an empty list with 200 when sqlite-vec is unavailable or an item has no embedding yet, and a new item has none for up to one backfill interval. Restore writes with direct SQL, bypassing `ItemService`, and does not embed: that keeps a bulk import fast and free of side effects, and the cron backfill picks the items up.

Satisfies: R8, R9, R10, R14 · Origin: #32, #43, semantic-search, backup-restore-upload · Date: 2026-02-23

## Container pins must stay

`DATABASE_URL` and `BACKUP_DIR` default to paths relative to the working directory, which would land in `/app/data` outside the volume, so `docker-compose.yml` pins both to `/data`. `HOWCANI_CONFIG_PATH` is pinned too; its default would resolve to `/app/config.yaml`, and the server refuses to start without the file. `DATABASE_URL` is only honoured with `NODE_ENV=production`, which the Dockerfile sets. `TZ` is required as well: the backup time is server-local and the container defaults to UTC. The compose healthcheck calls `/api/health`, so that route must stay. The runtime image has to be `oven/bun`, because `bun build` output is not standalone.

Satisfies: R16, R13 · Origin: docker-deployment, #97, #86 · Date: 2026-05-19

## Last write wins, item edits are optimistic

Single-user home lab, so item mutations update the list first and roll back on error; tag edits wait for the server. Neither has conflict handling: two tabs editing the same item or tag overwrite each other. An optimistic-concurrency `version` field is deferred, not rejected.

Satisfies: R3 · Origin: #7 · Date: 2026-02-08
