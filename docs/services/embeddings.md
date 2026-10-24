> **Status:** Final — 2026-10-24
> **Open:** —

# Embeddings

## Embedding provider and model have no defaults

When `embedding.enabled` is true, `provider` and `model` are mandatory, and `endpoint` is mandatory for llamacpp. A per-provider default model once survived a switch to another model and silently caused a dimension mismatch in dev. The non-null assertions on `model` and `endpoint` in the provider factory are only sound because the schema guarantees them. `enabled: false` is an explicit choice and logs no warning.

Satisfies: R7, R8, R12 · Origin: #97 · Date: 2026-05-19

## Switching model or dimension is destructive and opt-in

`vec_items` is a fixed-width table, so a new model or dimension means wiping `item_embeddings`, recreating `vec_items` and re-embedding everything. Startup compares the distinct stored models and the dimension of one row (`LENGTH(embedding)/4`, which assumes float32), or the declared `vec_items` dimension when there are no rows, and exits fatally on a mismatch unless `embedding.allowDimensionReset: true`. Set it back to false after the next successful deploy. The flag exists because a Docker deployment has no CLI, so a redeploy is the only gesture; an admin reset endpoint was rejected as a danger button. The stored model id includes the query/document prefix tag, so adding or removing a prefix triggers the same reset.

Satisfies: R7, R8, R12 · Origin: #96 · Date: 2026-05-13

## Startup self-check embeds once

With embeddings enabled, boot runs one test embed in the background. A vector of the wrong length is fatal, because the config is wrong and failing fast beats logging forever. A network failure only warns and the backfill cron is registered either way, so an endpoint that comes up late is fine.

Satisfies: R7, R8, R12 · Origin: #96 · Date: 2026-05-13

## The cron is the only retry, and jobs never overlap

There is no retry on the write path. The backfill cron (every 5 minutes, up to 100 items per run) picks items with no embedding row or with `item_embeddings.created_at < items.updated_at`; the second condition catches edits made while the provider was down. Each scheduler job has a running flag on the `SchedulerService` instance, cleared in `finally`, so a run that outlasts the tick does not cause duplicate embed calls. The flag is per instance on purpose, so tests get fresh ones.

Satisfies: R7, R8 · Origin: semantic-search, #128 · Date: 2026-09-22
