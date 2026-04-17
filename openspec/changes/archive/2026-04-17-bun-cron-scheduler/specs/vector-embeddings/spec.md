## MODIFIED Requirements

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
