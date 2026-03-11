
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

The system SHALL automatically generate embeddings for items that are missing or stale.

#### Scenario: Cron job runs on configured interval

- **WHEN** the server is running with `OPENROUTER_API_KEY` set
- **THEN** the cron job SHALL run every 5 minutes and query for items where either no `item_embeddings` row exists, or the existing embedding's `created_at` is older than the item's `updated_at`

#### Scenario: Cron job processes missing and stale embeddings in batches

- **WHEN** the cron job finds items without embeddings or with stale embeddings
- **THEN** the system SHALL process them in batches of 20, calling the OpenRouter API and upserting results into `item_embeddings` and `vec_items`

#### Scenario: Embedding refreshed by cron job after failed update

- **WHEN** the OpenRouter API call fails during an item update, leaving the item's `updated_at` newer than its embedding's `created_at`
- **THEN** the cron job SHALL detect the stale embedding and regenerate it on the next run

#### Scenario: Cron job skipped when API key absent

- **WHEN** `OPENROUTER_API_KEY` is not set
- **THEN** the cron job SHALL not run

### Requirement: Embedding Configuration

The system SHALL use environment variables to configure the embedding model.

#### Scenario: Default embedding model used when not configured

- **WHEN** `EMBEDDING_MODEL` environment variable is not set
- **THEN** the system SHALL use `openai/text-embedding-3-small` as the model identifier

#### Scenario: Custom embedding model used when configured

- **WHEN** `EMBEDDING_MODEL` is set to a valid OpenRouter model identifier
- **THEN** the system SHALL use that model for all embedding generation calls
