## MODIFIED Requirements

### Requirement: Embedding Configuration

The system SHALL configure the embedding provider, endpoint, model, dimension, and reset behavior from the `embedding` section of `config.yaml`, not from environment variables.

#### Scenario: Provider model used as embedding model identifier

- **WHEN** `embedding.model` is set to a valid model identifier for the active provider
- **THEN** the system SHALL use that model in the embeddings API call and store it as the `model` value in `item_embeddings`

#### Scenario: Custom llama.cpp endpoint

- **WHEN** `embedding.provider` is `llamacpp` and `embedding.endpoint` is `https://llm.home.janbaer.de/v1/embeddings`
- **THEN** the LlamaCppProvider SHALL POST to that exact URL for every embedding call

#### Scenario: Dimension configured via config

- **WHEN** `embedding.dimension` is `768`
- **THEN** the system SHALL declare `vec_items.embedding` as `float[768]` and the self-check SHALL require returned vectors of length 768

### Requirement: Provider Selection

The system SHALL select the embedding provider at startup from `config.yaml`'s `embedding` section, gated by `embedding.enabled`. When `embedding.enabled` is `true`, `embedding.provider` (`openrouter` | `llamacpp`) and `embedding.model` are mandatory and have no fallback defaults. Selection happens once at process start; runtime switching is not supported.

#### Scenario: OpenRouter provider selected

- **WHEN** `embedding.enabled` is `true`, `embedding.provider` is `openrouter`, `embedding.model` is set, and `OPENROUTER_API_KEY` is set in the environment
- **THEN** the factory SHALL return an `OpenRouterProvider` that calls `https://openrouter.ai/api/v1/embeddings` with `Authorization: Bearer ${OPENROUTER_API_KEY}` and reports its `backfillDelayMs` as `200`

#### Scenario: LlamaCpp provider selected

- **WHEN** `embedding.enabled` is `true`, `embedding.provider` is `llamacpp`, `embedding.model` is set, and `embedding.endpoint` is set
- **THEN** the factory SHALL return a `LlamaCppProvider` that posts to the configured endpoint with no `Authorization` header and reports its `backfillDelayMs` as `0`

#### Scenario: Embeddings disabled

- **WHEN** `embedding.enabled` is `false` or the `embedding` section is omitted
- **THEN** the factory SHALL return `null` without logging a warning, and embedding generation SHALL be skipped

#### Scenario: OpenRouter provider missing API key

- **WHEN** `embedding.enabled` is `true`, `embedding.provider` is `openrouter`, and `OPENROUTER_API_KEY` is not set in the environment
- **THEN** the factory SHALL return `null`, the system SHALL log a warning at startup, and embedding generation SHALL be skipped

### Requirement: Startup Mismatch Detection

The system SHALL detect on startup whether the stored embeddings match the currently-configured provider. Detection compares the configured model identifier against `item_embeddings.model` of one existing row, and compares the configured dimension against `LENGTH(item_embeddings.embedding) / 4` of that row.

#### Scenario: No embeddings stored

- **WHEN** `item_embeddings` contains zero rows
- **THEN** the system SHALL consider this a no-mismatch state and boot normally; the backfill cron will populate embeddings under the configured provider

#### Scenario: Configuration matches stored embeddings

- **WHEN** every distinct `model` in `item_embeddings` equals the configured model AND the byte length of the first row's embedding divided by 4 equals the configured dimension
- **THEN** the system SHALL boot normally

#### Scenario: Mismatch without reset flag

- **WHEN** the stored model or dimension differs from the configured value AND `embedding.allowDimensionReset` is not `true`
- **THEN** the system SHALL log a fatal error explaining the mismatch and the exact `config.yaml` field to change, then exit non-zero

#### Scenario: Mismatch with reset flag

- **WHEN** the stored model or dimension differs from the configured value AND `embedding.allowDimensionReset` is `true`
- **THEN** the system SHALL delete all rows from `item_embeddings`, drop and recreate the `vec_items` virtual table at the configured dimension, log a warning describing the wipe, and continue booting

### Requirement: Model-Aware Task Prefixes

Some embedding models (notably the `nomic-embed-text` family) are trained with task-instruction prefixes (`search_query: ` for queries, `search_document: ` for indexed documents) and produce degraded retrieval quality without them. The system SHALL maintain a registry mapping model identifiers to their required prefixes, apply them automatically before delegating to the provider, and encode the applied document-prefix into the persisted model identifier so that a change in prefix mode triggers the same mismatch-detection flow as a model or dimension change.

#### Scenario: Prefixes applied for nomic-embed-text models

- **WHEN** `embedding.model` starts with `nomic-embed-text` (case-insensitive)
- **THEN** `EmbeddingService.embedDocument(text)` SHALL call the provider with `search_document: ${text}` and `EmbeddingService.embedQuery(text)` SHALL call the provider with `search_query: ${text}`; `embedDocumentBatch` SHALL apply the document prefix to every input

#### Scenario: No prefixes applied for unprefixed models

- **WHEN** `embedding.model` is a model not listed in the prefix registry (e.g. `bge-m3`, `openai/text-embedding-3-small`, `jina-embeddings-v2-base-de`)
- **THEN** `embedDocument`, `embedQuery`, and `embedDocumentBatch` SHALL pass inputs to the provider unchanged

#### Scenario: Document-prefix mode encoded in stored model identifier

- **WHEN** a document prefix is applied for the configured model
- **THEN** the value persisted in `item_embeddings.model` SHALL be `${embedding.model}+${prefixTag}` (where `prefixTag` is the document prefix with its trailing colon removed, e.g. `nomic-embed-text-v1.5+search_document`); when no prefix applies, the bare model identifier is stored

#### Scenario: Prefix-mode change triggers wipe

- **WHEN** the stored model identifier does not include a prefix suffix but the newly-configured model requires a prefix (or vice versa) — and `embedding.allowDimensionReset` is `true`
- **THEN** the startup mismatch-detection path SHALL wipe `item_embeddings`, drop and recreate `vec_items` at the configured dimension, and let the backfill cron regenerate embeddings with the correct prefix behaviour

### Requirement: Startup Self-Check

When an embedding provider is configured, the system SHALL perform a one-time embedding test at startup to verify the live endpoint returns vectors of the configured dimension before registering the backfill cron.

#### Scenario: Self-check succeeds with correct dimension

- **WHEN** the test embed call returns a vector whose length equals `embedding.dimension`
- **THEN** the system SHALL log success and continue with cron registration

#### Scenario: Self-check returns wrong dimension

- **WHEN** the test embed call succeeds but the returned vector length does not equal `embedding.dimension`
- **THEN** the system SHALL log a fatal error showing expected vs actual dimension and exit non-zero

#### Scenario: Self-check endpoint unreachable

- **WHEN** the test embed call fails due to network error, timeout, or non-2xx HTTP response
- **THEN** the system SHALL log a warning, continue booting, and register the backfill cron anyway
