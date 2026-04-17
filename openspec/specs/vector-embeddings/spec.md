# vector-embeddings Specification

## Purpose

Defines how items are represented as float32 embedding vectors, how the backfill cron keeps them in sync, and how hybrid FTS5+KNN search consumes them.
## Requirements
### Requirement: Embedding Storage Schema

The system SHALL store one float32 embedding vector per item in a dedicated table and ANN index.

#### Scenario: item_embeddings table exists after migration

- **WHEN** database migration version 6 runs
- **THEN** the system SHALL:
  - Create table `item_embeddings` with columns `item_id TEXT PRIMARY KEY`, `embedding BLOB NOT NULL`, `model TEXT NOT NULL`, `created_at TEXT NOT NULL`
  - Add foreign key from `item_embeddings.item_id` to `items.id` with `ON DELETE CASCADE`
  - Create `vec_items` virtual table using `vec0` with `item_id TEXT PRIMARY KEY` and `embedding float[1536]`

#### Scenario: item_embeddings row deleted when item is deleted

- **WHEN** an item is deleted from the `items` table
- **THEN** the system SHALL automatically delete the corresponding row in `item_embeddings` via the CASCADE constraint

### Requirement: Embedding Generation on Write

The system SHALL generate an embedding for an item after it is created or updated.

#### Scenario: Embedding generated after item create

- **WHEN** an item is created and `OPENROUTER_API_KEY` is set
- **THEN** the system SHALL call the OpenRouter embeddings API with the concatenated `question + "\n" + answer`, upsert the result into `item_embeddings`, and upsert the float32 vector into `vec_items`

#### Scenario: Embedding updated after item update

- **WHEN** an item's question or answer is updated and `OPENROUTER_API_KEY` is set
- **THEN** the system SHALL regenerate the embedding and replace the existing rows in `item_embeddings` and `vec_items`

#### Scenario: Item saved successfully even if embedding generation fails

- **WHEN** the OpenRouter API call fails during item create or update
- **THEN** the system SHALL save the item normally, log a warning to stdout, and NOT return an error to the client

#### Scenario: Embedding generation skipped when API key absent

- **WHEN** `OPENROUTER_API_KEY` environment variable is not set
- **THEN** the system SHALL skip all embedding API calls and log a warning to stdout at startup

### Requirement: Embedding Backfill Cron Job

The system SHALL automatically generate embeddings for items that are missing or stale. The cron SHALL be registered via `Bun.cron` with the expression `*/5 * * * *` — not `setInterval` — and SHALL run only when both `app_settings.semantic_search_enabled = 1` and `OPENROUTER_API_KEY` is set. Toggling `semantic_search_enabled` via `PATCH /api/settings` SHALL re-apply the scheduler so the cron starts or stops without a server restart.

#### Scenario: Cron registered when toggle is on and API key is present

- **GIVEN** `app_settings.semantic_search_enabled = 1` and `OPENROUTER_API_KEY` is set
- **WHEN** `SchedulerService.init()` runs
- **THEN** `Bun.cron` is called with the expression `*/5 * * * *`

#### Scenario: Cron not registered when the toggle is off

- **GIVEN** `app_settings.semantic_search_enabled = 0`
- **WHEN** `SchedulerService.init()` runs
- **THEN** no embedding cron is registered

#### Scenario: Cron not registered without the API key

- **GIVEN** `app_settings.semantic_search_enabled = 1` and `OPENROUTER_API_KEY` is unset
- **WHEN** `SchedulerService.init()` runs
- **THEN** no embedding cron is registered, and a warning is logged

#### Scenario: Toggling off stops the cron without a restart

- **GIVEN** the embedding cron is running
- **WHEN** the user toggles `semantic_search_enabled` to `0` via `PATCH /api/settings`
- **THEN** `schedulerService.applyEmbeddingSettings({ enabled: false })` is called and the embedding cron is stopped

#### Scenario: Cron processes missing and stale embeddings in batches

- **WHEN** the cron fires and finds items without embeddings or with stale embeddings
- **THEN** the system processes them in batches of 20, calling the OpenRouter API and upserting results into `item_embeddings` and `vec_items`

#### Scenario: Embedding refreshed by cron after a failed update

- **WHEN** the OpenRouter API call fails during an item update, leaving the item's `updated_at` newer than its embedding's `created_at`
- **THEN** the cron detects the stale embedding and regenerates it on the next run

### Requirement: Embedding Configuration

The system SHALL use environment variables to configure the embedding model.

#### Scenario: Default embedding model used when not configured

- **WHEN** `EMBEDDING_MODEL` environment variable is not set
- **THEN** the system SHALL use `openai/text-embedding-3-small` as the model identifier

#### Scenario: Custom embedding model used when configured

- **WHEN** `EMBEDDING_MODEL` is set to a valid OpenRouter model identifier
- **THEN** the system SHALL use that model for all embedding generation calls

