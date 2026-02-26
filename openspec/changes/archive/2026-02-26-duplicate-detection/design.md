## Context

The app already has a Related Items feature: `GET /api/:username/items/:id/related` uses KNN vector search (sqlite-vec) to find the top-5 semantically similar items. The `findRelated` repository method queries the `vec_items` virtual table, filters by `user_id`, and returns items sorted by L2 distance.

Duplicate detection is the same concept but with a higher similarity threshold — only items that are *extremely* close (near-identical) should appear. The feature reuses the existing embedding and vector infrastructure with a user-configurable threshold instead of returning a fixed top-N.

## Goals / Non-Goals

**Goals:**
- Surface semantically near-duplicate items on the detail page without adding new dependencies
- Let users tune the sensitivity threshold (default 92%) per their knowledge base
- Mirror the Related Items UI pattern for visual consistency

**Non-Goals:**
- Automatic merging or deletion of duplicates
- Cross-user duplicate detection
- Running without sqlite-vec (graceful empty response when unavailable)

## Decisions

### Threshold as percentage in settings, distance in DB query

sqlite-vec KNN returns L2 distance on normalised vectors, where L2 distance relates to cosine similarity as: `cosine_similarity = 1 - (distance² / 2)`. The user-facing setting is expressed as an integer percentage (0–100); the backend converts it to an L2 distance threshold at query time.

**Alternative considered**: Store a raw float distance. Rejected — percentages are easier for users to reason about.

### Reuse `findRelated` pattern with a distance cap instead of top-N

The existing `findRelated` returns the top-5 closest items regardless of how similar they are. For duplicates we invert the logic: return all items *within* a distance threshold (equivalent to above a similarity threshold), capped at a reasonable maximum (e.g. 10 results).

**Alternative considered**: Call `findRelated` and post-filter in-service. Rejected — better to push the threshold into the DB query for efficiency.

### New repository method `findDuplicates(itemId, userId, threshold)`

A dedicated `findDuplicates` method keeps concerns separate and allows the threshold to be parameterised cleanly. The method mirrors `findRelated` but replaces the `LIMIT` clause with a `WHERE distance <= ?` filter.

### Setting stored as INTEGER percentage in `users` table

Consistent with `semantic_search_enabled` (also an INTEGER column). A new `duplicate_threshold` column is added via migration with `DEFAULT 92`.

### New API endpoint `GET /api/:username/items/:id/duplicates`

Mirrors the related-items route at `/:id/related`. The endpoint is public (no auth required) and uses the same session/service pattern.

## Risks / Trade-offs

- **sqlite-vec unavailable** → return empty array (same fallback as related items). No risk to data integrity.
- **Threshold too low** → floods the panel with false positives. Mitigated by sensible default (92%) and user control.
- **Performance** → sqlite-vec KNN scans the entire `vec_items` table filtered by user. For large knowledge bases this could be slow. Acceptable for now — same trade-off already accepted in related items.

## Migration Plan

1. Add migration: `ALTER TABLE users ADD COLUMN duplicate_threshold INTEGER NOT NULL DEFAULT 92`
2. Deploy — existing users automatically get the default threshold
3. No rollback complexity; the column is additive
