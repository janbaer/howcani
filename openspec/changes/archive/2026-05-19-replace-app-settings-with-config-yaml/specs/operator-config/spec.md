## ADDED Requirements

### Requirement: Operator config file

The system SHALL load all operator-level configuration from a single YAML file at startup. The file path SHALL be resolved from the `HOWCANI_CONFIG_PATH` environment variable, defaulting to `./config.yaml` when unset. The file SHALL contain `embedding`, `backup`, and `duplicate` sections. The system SHALL NOT read operator configuration from a database table or from per-setting environment variables.

#### Scenario: Config loaded from default path

- **WHEN** the server starts with no `HOWCANI_CONFIG_PATH` set and a valid `./config.yaml` present
- **THEN** the system SHALL parse the file, expose the typed values to the embedding, backup, and duplicate subsystems, and boot normally

#### Scenario: Config loaded from custom path

- **WHEN** `HOWCANI_CONFIG_PATH=/data/config.yaml` is set and a valid file exists there
- **THEN** the system SHALL load configuration from `/data/config.yaml`

#### Scenario: Config is read once at startup

- **WHEN** the server is running
- **THEN** editing `config.yaml` SHALL NOT change runtime behaviour until the process is restarted

### Requirement: Fail-fast on missing or invalid config

The system SHALL refuse to start if `config.yaml` is missing, unreadable, not valid YAML, or fails schema validation. The system SHALL NOT fall back to silent defaults. The startup error message SHALL name the problem and point at the documented example file.

#### Scenario: Missing config file

- **WHEN** the server starts and no config file exists at the resolved path
- **THEN** the process SHALL log an error referencing `config.example.yaml` and exit non-zero before binding the HTTP port

#### Scenario: Malformed value fails validation

- **WHEN** the config file is present but a field has the wrong type (e.g. `embedding.dimension` is a string)
- **THEN** the process SHALL log a Zod-style validation error naming the offending field and expected type, then exit non-zero

#### Scenario: llamacpp provider without endpoint

- **WHEN** `embedding.enabled` is `true`, `embedding.provider` is `llamacpp`, `embedding.model` is set, and `embedding.endpoint` is null or omitted
- **THEN** schema validation SHALL fail with a message that `endpoint` is required for the `llamacpp` provider, and the process SHALL exit non-zero

#### Scenario: Enabled without provider

- **WHEN** `embedding.enabled` is `true` and `embedding.provider` is omitted
- **THEN** schema validation SHALL fail with a message that `provider` is required when `embedding.enabled` is true, and the process SHALL exit non-zero

#### Scenario: Enabled without model

- **WHEN** `embedding.enabled` is `true`, `embedding.provider` is set, and `embedding.model` is omitted
- **THEN** schema validation SHALL fail with a message that `model` is required when `embedding.enabled` is true, and the process SHALL exit non-zero

### Requirement: Secrets stay in environment variables

The system SHALL NOT read secrets from `config.yaml`. `OPENROUTER_API_KEY` and `HOWCANI_JWT_SECRET` SHALL continue to be read only from environment variables. The system SHALL NOT implement `${VAR}` interpolation inside the YAML file.

#### Scenario: API key is not taken from YAML

- **WHEN** `embedding.provider` is `openrouter`
- **THEN** the system SHALL read the API key from `process.env.OPENROUTER_API_KEY` only, and `config.yaml` SHALL contain no secret values

#### Scenario: Example config is safe to commit

- **WHEN** `config.example.yaml` is committed to the repository
- **THEN** it SHALL contain no secrets, and the real `config.yaml` SHALL be git-ignored

### Requirement: Config schema

The config schema SHALL define: `embedding.enabled` (boolean, default `false`), `embedding.provider` (`openrouter` | `llamacpp`, required when `embedding.enabled` is `true`), `embedding.model` (non-empty string, required when `embedding.enabled` is `true`, no default), `embedding.dimension` (positive integer), `embedding.endpoint` (string | null, required when provider is `llamacpp`), `embedding.allowDimensionReset` (boolean), `backup.enabled` (boolean), `backup.time` (HH:MM 24h string), `backup.retentionDays` (integer 1–30), `duplicate.threshold` (integer 50–100). A `false` or omitted `embedding.enabled` SHALL disable embeddings; `provider` and `model` have no fallback defaults.

#### Scenario: enabled false disables embeddings

- **WHEN** `embedding.enabled` is `false` or the `embedding` section is omitted
- **THEN** the embedding factory SHALL return no provider and semantic search SHALL be treated as disabled, equivalent to the previous "EMBEDDING_PROVIDER unset" behaviour

#### Scenario: Out-of-range numeric values rejected

- **WHEN** `duplicate.threshold` is 40 or `backup.retentionDays` is 0
- **THEN** schema validation SHALL fail and the process SHALL exit non-zero
