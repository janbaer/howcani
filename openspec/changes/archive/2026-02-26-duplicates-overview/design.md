## Context

The existing `findDuplicates(itemId, userId, threshold)` on `ItemRepository` runs a KNN query for a single item. To find all duplicate pairs across a knowledge base we need to iterate over every item that has an embedding and collect duplicates for each one.

With ~300 items and sqlite-vec's fast in-process KNN, 300 individual queries complete in well under a second. No new infrastructure is needed.

## Goals / Non-Goals

**Goals:**
- Single endpoint returns all duplicate groups for a user in one request
- Symmetric pairs deduplicated (A→B appears once, not twice)
- Frontend shows the list grouped by primary item on the Settings page
- Works gracefully when sqlite-vec is unavailable (returns empty array)

**Non-Goals:**
- Merging or deleting duplicate items
- Pagination (all pairs fit in one response for the foreseeable scale)
- Cross-user duplicate detection

## Decisions

### Iterate per-item, deduplicate in-service

Reuse the existing `findDuplicates` repository method. The service iterates all items with embeddings for the user, calls `findDuplicates` for each, and deduplicates symmetric pairs using a `Set<string>` of sorted id pairs (`min(a,b)|max(a,b)`).

**Alternative considered**: A single SQL self-join on vec_items. Rejected — sqlite-vec does not expose a pairwise similarity join; the per-item KNN approach is simpler and fast enough.

### Deduplicate by canonical pair key

Use `[a, b].sort().join('|')` as the pair key. The group containing the item with the lexicographically smaller id is kept as the primary group.

**Alternative**: Deduplicate by keeping the group whose primary item appears first in the full item list. Rejected — unnecessary complexity.

### Endpoint: `GET /api/:username/duplicates`

Public endpoint (no auth required), consistent with `/related` and `/duplicates`. The owner's `duplicate_threshold` is read from the user record.

### Response shape

```json
[
  {
    "item": { "id": "...", "question": "...", ... },
    "duplicates": [
      { "id": "...", "question": "...", "relevance": 95, ... }
    ]
  }
]
```

Groups with zero duplicates are excluded. Response is an empty array when no duplicates exist.

### Frontend placement

A new card section on the Settings page, below the threshold input, titled "Possible duplicates across your knowledge base". This keeps duplicate management co-located with the threshold control. The section is only rendered when the response is non-empty or loading.

## Risks / Trade-offs

- **Performance at scale** → For significantly larger knowledge bases (thousands of items) the per-item KNN approach would need batching. Acceptable for now; can be revisited.
- **sqlite-vec unavailable** → Returns empty array with a note in the UI. No risk to data.
- **Pair deduplication ordering** → The "primary" item in each group is determined by which item's query first returned the other. This is deterministic for a given data set but not meaningful to the user — both items link to each other anyway.
