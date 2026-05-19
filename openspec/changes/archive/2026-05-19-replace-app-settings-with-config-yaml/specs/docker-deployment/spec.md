## MODIFIED Requirements

### Requirement: Docker Compose Configuration

The system SHALL provide a `docker-compose.yml` file for production deployment.

The compose file MUST define a service that uses the HowCanI Docker image from the Forgejo registry.

The compose file SHALL hardcode runtime values rather than expose `${VAR}` interpolation knobs. The `environment:` block SHALL carry only the variables the application genuinely requires that are not already baked into the image:

- `DATABASE_URL` — pins the relative `./data/howcani.db` default to the `/data` volume (only honoured when `NODE_ENV=production`, which the image provides).
- `BACKUP_DIR` — pins the relative `./data/backups` default to the `/data` volume.
- `HOWCANI_CONFIG_PATH` — points at the in-container mounted config path; the relative `./config.yaml` default would resolve to `/app/config.yaml` and the server would refuse to start.
- `TZ` — the backup cron converts the configured local time to UTC; the container default is UTC.

`NODE_ENV` and `PORT` SHALL NOT be set in the compose file — the Dockerfile already bakes them in (`ENV NODE_ENV=production`, `ENV PORT=3000`). Secrets (`HOWCANI_JWT_SECRET`, `OPENROUTER_API_KEY`) SHALL come from the `.env` file via `env_file`, never the `environment:` block.

The compose file MUST mount the data directory from host to `/data` in the container for database persistence.

The compose file MUST mount the operator config file from the host into the container and set `HOWCANI_CONFIG_PATH` to the in-container path so the server can locate `config.yaml`.

The compose file SHALL configure the container to run as a fixed non-root user and group ID.

#### Scenario: Default configuration

- **WHEN** `docker-compose.yml` is run
- **THEN** the service SHALL run on port 3000, mount `./data` to `/data`, mount `./config.yaml` to `/data/config.yaml`, run as user 1000:1000, and use the latest image tag

#### Scenario: Config file mounted into container

- **WHEN** the container starts with a host `config.yaml` mounted
- **THEN** the server SHALL read configuration from the in-container path given by `HOWCANI_CONFIG_PATH` and boot normally

#### Scenario: Missing config file fails the container

- **WHEN** the container starts with no `config.yaml` present at the mounted path
- **THEN** the process SHALL exit non-zero with a clear error, the healthcheck SHALL fail, and `restart: unless-stopped` SHALL keep retrying until the operator provides the file

#### Scenario: Image-provided NODE_ENV and PORT

- **WHEN** the compose file omits `NODE_ENV` and `PORT`
- **THEN** the container SHALL still run in production mode on port 3000 because the Dockerfile sets `ENV NODE_ENV=production` and `ENV PORT=3000`, and `DATABASE_URL` SHALL be honoured (it is only read when `NODE_ENV=production`)

#### Scenario: Specific version deployment

- **WHEN** the `docker-compose.yml` image tag is set to a specific version (e.g., 3.0.1)
- **THEN** the service SHALL use that specific version instead of latest
