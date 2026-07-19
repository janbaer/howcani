# HowCanI 3

A personal FAQ and knowledge base built with a Bun/Elysia backend, SQLite storage, and a Svelte 5 frontend. Runs locally, accessible over WireGuard VPN, and offers full‑text search, tag filtering, and optional vector‑based semantic search.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/janbaer/howcani)

## Development

```bash
bun install
bun run dev
```

Tests and linting:

```bash
bun test
bun run lint
```

## Configuration

Set these environment variables before running:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HOWCANI_JWT_SECRET` | Yes | — | Signs authentication tokens. Generate with `openssl rand -base64 32` |
| `OPENROUTER_API_KEY` | For semantic search | — | API key for [OpenRouter](https://openrouter.ai). Enables vector embedding generation and semantic search. Without it, search falls back to FTS5 only |
| `EMBEDDING_MODEL` | No | `openai/text-embedding-3-small` | Embedding model to use via OpenRouter |
| `DATABASE_URL` | No | `./data/howcani.db` | Path to the SQLite database file |
| `PORT` | No | `3000` | HTTP port the server listens on |

Copy `.env.example` to `.env` and fill in your values.

## Semantic Search

When `OPENROUTER_API_KEY` is set, the application:

- Generates vector embeddings for new and updated items via the OpenRouter embeddings API
- Backfills embeddings for existing items every 5 minutes (in batches of 20)
- Uses hybrid search — combining FTS5 full-text results and vector KNN results via Reciprocal Rank Fusion (RRF)

Users can toggle semantic search per-account in Settings.

## Docker Deployment

### Building and publishing

```bash
# Bump patch version, build image, push to registry
./scripts/build-docker.sh

# Or specify bump type
./scripts/build-docker.sh minor
./scripts/build-docker.sh major
```

Images go to `forgejo.home.janbaer.de/jan/howcani:VERSION` and `:latest`.

### Cleaning up old images

```bash
# Delete all local and remote images older than the current package.json version
./scripts/cleanup-docker.sh

# Or specify a version explicitly
./scripts/cleanup-docker.sh 3.0.49

# Preview what would be deleted without making changes
./scripts/cleanup-docker.sh --dry-run

# Only clean up local images (no registry access needed)
./scripts/cleanup-docker.sh --local-only

# Only clean up remote registry tags (requires FORGEJO_TOKEN)
./scripts/cleanup-docker.sh --remote-only
```

Set `FORGEJO_TOKEN` to enable remote cleanup. Local cleanup works without it.

### Running with Docker Compose

1. Authenticate to the registry: `docker login forgejo.home.janbaer.de`
2. Copy `.env.example` to `.env` and set your values:

```bash
HOWCANI_PORT=3000
HOWCANI_DATA_DIR=./data
HOWCANI_UID=1000
HOWCANI_GID=1000
HOWCANI_JWT_SECRET=<generated-secret>
OPENROUTER_API_KEY=<your-key>    # optional, enables semantic search
```

3. Start:

```bash
docker-compose pull
docker-compose up -d
docker-compose logs -f
```

### Backups

SQLite uses WAL mode. Copying only the `.db` file without checkpointing can miss recent writes.

**Safe backup procedure:**

```bash
docker-compose down
sqlite3 /path/to/data/howcani.db "PRAGMA wal_checkpoint(TRUNCATE);"
cp /path/to/data/howcani.db /backups/howcani-$(date +%Y%m%d).db
docker-compose up -d
```

**Restore:**

```bash
docker-compose down
cp /backups/howcani-20250213.db /path/to/data/howcani.db
rm -f /path/to/data/howcani.db-wal /path/to/data/howcani.db-shm
docker-compose up -d
```

**Rollback to a previous version:** update the image tag in `docker-compose.yml` and run `docker-compose pull && docker-compose up -d`.

## MCP Server

HowCanI exposes an MCP endpoint at `/mcp` for AI clients (Claude Code, Claude Desktop).

### Available tools

| Tool | Auth required | Description |
|------|--------------|-------------|
| `search_items` | No | Full-text search with optional tag filter |
| `list_items` | No | Paginated list, newest first |
| `get_item` | No | Fetch a single item by ID |
| `list_tags` | No | All tags with item counts |
| `create_item` | Bearer token | Create an item (auto-creates tags) |

### Authentication model

Reads are public, resolved per request in this order:

- **Bearer token present** — it is authoritative. The token is verified and its user is used; any `X-Username` header is ignored. An invalid or expired token is rejected (the request does not fall back to `X-Username`).
- **No token** — the `X-Username` header selects the user (public read).
- **Neither** — the tool returns a "username is required" error.

Writes (`create_item`, `update_item`) always require a valid Bearer token. The `/mcp` endpoint does not send a wildcard `Access-Control-Allow-Origin`, so it cannot be called cross-origin from a browser; use a server-side MCP client.

### Getting an API token

```bash
curl -X POST http://localhost:3000/api/auth/api-token \
  -H "Content-Type: application/json" \
  -d '{"username": "jan", "password": "your-password", "days": 90}'
```

### Connecting Claude Code

Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "howcani": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer ${HOWCANI_TOKEN}"
      }
    }
  }
}
```

Set `HOWCANI_TOKEN` to your API token. Replace `localhost:3000` with your server address for remote deployments.
