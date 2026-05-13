# vector-embeddings Specification

## Purpose

Defines how items are represented as float32 embedding vectors, how the backfill cron keeps them in sync, and how hybrid FTS5+KNN search consumes them.
## Requirements
### Requirement: Embedding Storage Schema

The system SHALL store one float32 embedding vector per item in a dedicated table and an ANN index. The vector dimension of the ANN index SHALL be derived from the `EMBEDDING_DIMENSION` environment variable rather than a hardcoded literal.

#### Scenario: item_embeddings table exists after migration

- **WHEN** database migration version 6 runs
- **THEN** the system SHALL:
  - Create table `item_embeddings` with columns `item_id TEXT PRIMARY KEY`, `embedding BLOB NOT NULL`, `model TEXT NOT NULL`, `created_at TEXT NOT NULL`
  - Add foreign key from `item_embeddings.item_id` to `items.id` with `ON DELETE CASCADE`

#### Scenario: vec_items table created at configured dimension

- **WHEN** migration 7 runs with `EMBEDDING_DIMENSION=N`
- **THEN** the system SHALL create the `vec_items` virtual table using `vec0` with `item_id TEXT PRIMARY KEY` and `embedding float[N]`

#### Scenario: item_embeddings row deleted when item is deleted

- **WHEN** an item is deleted from the `items` table
- **THEN** the system SHALL automatically delete the corresponding row in `item_embeddings` via the CASCADE constraint

### Requirement: Embedding Generation on Write

The system SHALL generate an embedding for an item after it is created or updated, using whichever provider is currently configured.

#### Scenario: Embedding generated after item create

- **WHEN** an item is created and an embedding provider is configured
- **THEN** the system SHALL call the configured provider's embeddings endpoint with the concatenated `question + "\n" + answer`, upsert the result into `item_embeddings` with the provider's `model` identifier, and upsert the float32 vector into `vec_items`

#### Scenario: Embedding updated after item update

- **WHEN** an item's question or answer is updated and an embedding provider is configured
- **THEN** the system SHALL regenerate the embedding via the configured provider and replace the existing rows in `item_embeddings` and `vec_items`

#### Scenario: Item saved successfully even if embedding generation fails

- **WHEN** the provider's embeddings call fails during item create or update
- **THEN** the system SHALL save the item normally, log a warning to stdout, and NOT return an error to the client

#### Scenario: Embedding generation skipped when no provider configured

- **WHEN** no embedding provider is configured (e.g., `EMBEDDING_PROVIDER` unset, or `openrouter` with no API key)
- **THEN** the system SHALL skip all embedding generation calls and log a warning to stdout at startup

### Requirement: Embedding Backfill Cron Job

The system SHALL automatically generate embeddings for items that are missing or stale. The cron SHALL be registered via `Bun.cron` with the expression `*/5 * * * *` and SHALL run only when both `app_settings.semantic_search_enabled = 1` and an embedding provider is configured. Toggling `semantic_search_enabled` via `PATCH /api/settings` SHALL re-apply the scheduler so the cron starts or stops without a server restart. Each cron tick fetches up to 100 items and submits them to the provider's `embedBatch` method. The provider chunks the request internally according to its own `maxBatchSize` so each HTTP call respects upstream timeouts.

#### Scenario: Cron registered when toggle is on and provider is configured

- **GIVEN** `app_settings.semantic_search_enabled = 1` and a provider is configured
- **WHEN** `SchedulerService.init()` runs
- **THEN** `Bun.cron` is called with the expression `*/5 * * * *`

#### Scenario: Cron not registered when the toggle is off

- **GIVEN** `app_settings.semantic_search_enabled = 0`
- **WHEN** `SchedulerService.init()` runs
- **THEN** no embedding cron is registered

#### Scenario: Cron not registered without a configured provider

- **GIVEN** `app_settings.semantic_search_enabled = 1` and no provider configured
- **WHEN** `SchedulerService.init()` runs
- **THEN** no embedding cron is registered, and a warning is logged

#### Scenario: Toggling off stops the cron without a restart

- **GIVEN** the embedding cron is running
- **WHEN** the user toggles `semantic_search_enabled` to `0` via `PATCH /api/settings`
- **THEN** `schedulerService.applyEmbeddingSettings({ enabled: false })` is called and the embedding cron is stopped

#### Scenario: Cron submits up to 100 items in one batched call per tick

- **WHEN** the cron fires and finds items without embeddings or with stale embeddings
- **THEN** the system selects up to 100 such items and submits them in a single call to `embeddingService.embedDocumentBatch`, which delegates to the provider's `embedBatch`; results are upserted into `item_embeddings` and `vec_items`

#### Scenario: Provider chunks oversized batches via maxBatchSize

- **WHEN** `embedBatch` is called with more inputs than the provider's `maxBatchSize` (e.g. 100 inputs against `LlamaCppProvider.maxBatchSize = 16`)
- **THEN** the provider SHALL split the request into sequential HTTP calls of at most `maxBatchSize` inputs each, preserving the original order in the returned `Float32Array | null` array

#### Scenario: Embedding refreshed by cron after a failed update

- **WHEN** the provider call fails during an item update, leaving the item's `updated_at` newer than its embedding's `created_at`
- **THEN** the cron detects the stale embedding and regenerates it on the next run

### Requirement: Embedding Configuration

The system SHALL use environment variables to configure the embedding provider, endpoint, model, dimension, and reset behavior.

#### Scenario: Provider model used as embedding model identifier

- **WHEN** `EMBEDDING_MODEL` is set to a valid model identifier for the active provider
- **THEN** the system SHALL use that model in the embeddings API call and store it as the `model` value in `item_embeddings`

#### Scenario: Custom llama.cpp endpoint

- **WHEN** `EMBEDDING_PROVIDER=llamacpp` and `EMBEDDING_ENDPOINT=https://llm.home.janbaer.de/v1/embeddings`
- **THEN** the LlamaCppProvider SHALL POST to that exact URL for every embedding call

#### Scenario: Dimension configured via env

- **WHEN** `EMBEDDING_DIMENSION=768` is set
- **THEN** the system SHALL declare `vec_items.embedding` as `float[768]` and the self-check SHALL require returned vectors of length 768

### Requirement: Provider Selection

The system SHALL select the embedding provider at startup from the `EMBEDDING_PROVIDER` environment variable. Valid values are `openrouter` and `llamacpp`. Selection happens once at process start; runtime switching is not supported.

#### Scenario: OpenRouter provider selected

- **WHEN** `EMBEDDING_PROVIDER=openrouter` and `OPENROUTER_API_KEY` is set
- **THEN** the factory SHALL return an `OpenRouterProvider` that calls `https://openrouter.ai/api/v1/embeddings` with `Authorization: Bearer ${OPENROUTER_API_KEY}` and reports its `backfillDelayMs` as `200`

#### Scenario: LlamaCpp provider selected

- **WHEN** `EMBEDDING_PROVIDER=llamacpp` and `EMBEDDING_ENDPOINT` is set
- **THEN** the factory SHALL return a `LlamaCppProvider` that posts to `${EMBEDDING_ENDPOINT}` with no `Authorization` header and reports its `backfillDelayMs` as `0`

#### Scenario: No provider configured

- **WHEN** `EMBEDDING_PROVIDER` is unset or set to an unknown value
- **THEN** the factory SHALL return `null`, the system SHALL log a warning at startup, and embedding generation SHALL be skipped (same effect as missing API key today)

#### Scenario: LlamaCpp provider missing endpoint

- **WHEN** `EMBEDDING_PROVIDER=llamacpp` and `EMBEDDING_ENDPOINT` is unset
- **THEN** the system SHALL log a fatal error and exit non-zero at startup

### Requirement: Startup Mismatch Detection

The system SHALL detect on startup whether the stored embeddings match the currently-configured provider. Detection compares the configured model identifier against `item_embeddings.model` of one existing row, and compares the configured dimension against `LENGTH(item_embeddings.embedding) / 4` of that row.

#### Scenario: No embeddings stored

- **WHEN** `item_embeddings` contains zero rows
- **THEN** the system SHALL consider this a no-mismatch state and boot normally; the backfill cron will populate embeddings under the configured provider

#### Scenario: Configuration matches stored embeddings

- **WHEN** every distinct `model` in `item_embeddings` equals the configured model AND the byte length of the first row's embedding divided by 4 equals the configured dimension
- **THEN** the system SHALL boot normally

#### Scenario: Mismatch without reset flag

- **WHEN** the stored model or dimension differs from the configured value AND `EMBEDDING_ALLOW_DIMENSION_RESET` is not set to `true`
- **THEN** the system SHALL log a fatal error explaining the mismatch and the exact env variable to add, then exit non-zero

#### Scenario: Mismatch with reset flag

- **WHEN** the stored model or dimension differs from the configured value AND `EMBEDDING_ALLOW_DIMENSION_RESET=true`
- **THEN** the system SHALL delete all rows from `item_embeddings`, drop and recreate the `vec_items` virtual table at the configured dimension, log a warning describing the wipe, and continue booting

### Requirement: Model-Aware Task Prefixes

Some embedding models (notably the `nomic-embed-text` family) are trained with task-instruction prefixes (`search_query: ` for queries, `search_document: ` for indexed documents) and produce degraded retrieval quality without them. The system SHALL maintain a registry mapping model identifiers to their required prefixes, apply them automatically before delegating to the provider, and encode the applied document-prefix into the persisted model identifier so that a change in prefix mode triggers the same mismatch-detection flow as a model or dimension change.

#### Scenario: Prefixes applied for nomic-embed-text models

- **WHEN** `EMBEDDING_MODEL` starts with `nomic-embed-text` (case-insensitive)
- **THEN** `EmbeddingService.embedDocument(text)` SHALL call the provider with `search_document: ${text}` and `EmbeddingService.embedQuery(text)` SHALL call the provider with `search_query: ${text}`; `embedDocumentBatch` SHALL apply the document prefix to every input

#### Scenario: No prefixes applied for unprefixed models

- **WHEN** `EMBEDDING_MODEL` is a model not listed in the prefix registry (e.g. `bge-m3`, `openai/text-embedding-3-small`, `jina-embeddings-v2-base-de`)
- **THEN** `embedDocument`, `embedQuery`, and `embedDocumentBatch` SHALL pass inputs to the provider unchanged

#### Scenario: Document-prefix mode encoded in stored model identifier

- **WHEN** a document prefix is applied for the configured model
- **THEN** the value persisted in `item_embeddings.model` SHALL be `${EMBEDDING_MODEL}+${prefixTag}` (where `prefixTag` is the document prefix with its trailing colon removed, e.g. `nomic-embed-text-v1.5+search_document`); when no prefix applies, the bare model identifier is stored

#### Scenario: Prefix-mode change triggers wipe

- **WHEN** the stored model identifier does not include a prefix suffix but the newly-configured model requires a prefix (or vice versa) — and `EMBEDDING_ALLOW_DIMENSION_RESET=true`
- **THEN** the startup mismatch-detection path SHALL wipe `item_embeddings`, drop and recreate `vec_items` at the configured dimension, and let the backfill cron regenerate embeddings with the correct prefix behaviour

### Requirement: Startup Self-Check

When `semantic_search_enabled = 1` and a provider is configured, the system SHALL perform a one-time embedding test at startup to verify the live endpoint returns vectors of the configured dimension before registering the backfill cron.

#### Scenario: Self-check succeeds with correct dimension

- **WHEN** the test embed call returns a vector whose length equals `EMBEDDING_DIMENSION`
- **THEN** the system SHALL log success and continue with cron registration

#### Scenario: Self-check returns wrong dimension

- **WHEN** the test embed call succeeds but the returned vector length does not equal `EMBEDDING_DIMENSION`
- **THEN** the system SHALL log a fatal error showing expected vs actual dimension and exit non-zero

#### Scenario: Self-check endpoint unreachable

- **WHEN** the test embed call fails due to network error, timeout, or non-2xx HTTP response
- **THEN** the system SHALL log a warning, continue booting, and register the backfill cron anyway

