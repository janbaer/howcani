## Context

The related items feature uses sqlite-vec KNN search to find the top 5 semantically similar items. The current `findRelated` repository method discards the `distance` score returned by sqlite-vec, returning only the item records. The distance is an L2 (Euclidean) distance between 1536-dim float32 vectors from OpenAI's `text-embedding-3-small`, which produces **normalized** vectors.

## Goals / Non-Goals

**Goals:**
- Expose a `relevance` percentage (0–100 integer) per related item in the API response
- Display the percentage as a subtle badge in the `RelatedItemsPanel` sidebar
- Preserve the existing ordered result (closest match first)

**Non-Goals:**
- Handling sqlite-vec unavailability (guaranteed to be available per user decision)
- Exposing scores via the MCP `get_related_items` tool

## Decisions

### Normalize scores relative to the top result

Scores are normalized within the result set so the closest match always shows 100%, with others scaled proportionally:

```
cosine_similarity = 1 - (L2_distance² / 2)
top_score = cosine_similarity of the first (closest) result
percentage = Math.round((cosine_similarity / top_score) * 100)
```

This approach was chosen because absolute cosine similarity scores for top-5 KNN results cluster tightly (typically 70–95%), making the raw values unintuitive — users would see badges like "47%" for a strong match. Relative normalization ensures the UI conveys meaningful differentiation within the actual result set.

**Alternatives considered:**
- Raw L2 distance: not intuitive to display as percentage
- Absolute cosine similarity: values cluster too narrowly to be meaningful to users (e.g. all results showing 40–51%)
- Cosine similarity directly from query: sqlite-vec's `embedding MATCH` returns L2 distance, not cosine distance, so conversion is needed

### Return a `RelatedItem` type from the repository

`findRelated` returns `Array<{ item: Item; score: number }>` where `score` is the raw L2 distance. Conversion to percentage happens in the service layer (or route handler), keeping the repository simple.

**Alternative:** Convert in the repository. Rejected — percentages are a presentation concern; the repository should return raw data.

### Add `relevance` to the API response shape

The `/related` route returns `{ items: ItemWithTags[] }`. This becomes `{ items: Array<ItemWithTags & { relevance: number }> }`. The `relevance` field is an integer 0–100.

The client `Item` type gains an optional `relevance?: number` field so the panel can use it without a separate type.

## Risks / Trade-offs

- **Top item always 100%**: A user may see "100% relevance" for an item that is only moderately similar in absolute terms. This is a deliberate trade-off — the goal is to communicate relative ranking within the result set, not absolute semantic quality.
- **Score range**: All items are now expressed relative to the best match, so the spread between results is visible even when absolute similarities are clustered tightly.
- **Rounding**: Intermediate rounding of raw cosine values before normalization can collapse very close scores (e.g. 0.872 and 0.868 both rounding to 87). Acceptable given that the displayed granularity is whole percentages.
