## Context

The item detail page currently shows a single item in isolation. The project already has a full vector search infrastructure: item embeddings (1536-dim float32) are stored in the `vec_items` virtual table via sqlite-vec, and a KNN query is already used in hybrid search. This change reuses that infrastructure to surface related items without any new external dependencies.

The panel must degrade gracefully when sqlite-vec is unavailable (e.g., dev environments without the extension).

## Goals / Non-Goals

**Goals:**
- Add a collapsible "Related items" panel to the item detail page
- Load related items lazily only when the panel is expanded
- Reuse the existing KNN vector search infrastructure
- Provide a public API endpoint (no auth required — consistent with item reading)

**Non-Goals:**
- No changes to how embeddings are generated or stored
- No new database schema changes
- No pagination of related items (top 5 is sufficient)
- No caching layer (queries are fast enough)

## Decisions

### 1. API endpoint: `/api/:username/items/:id/related`

**Decision**: Add a new GET route returning the top N semantically similar items.

**Rationale**: Keeps the API RESTful and consistent with existing patterns. The username scopes the query to one user's items, preventing cross-user leakage. No auth required — reading items is already public.

**Alternative considered**: Add a `related` query param to the existing item GET endpoint. Rejected: mixing concerns and makes the response schema conditional.

### 2. KNN query approach

**Decision**: Use the existing `vec_distance_cosine` KNN query pattern from `searchHybrid()`, restricted to the current item's user and excluding the item itself.

**Rationale**: The pattern is already proven. Limit to top 5 matches. If the current item has no embedding yet (async generation), return an empty array.

**Alternative considered**: Compute similarity at request time using raw SQL joins. Rejected: vec_items virtual table KNN syntax is more efficient.

### 3. Lazy loading in the frontend

**Decision**: The panel renders collapsed by default. The API call is made only when the user first expands it, not on page load.

**Rationale**: Avoids unnecessary network requests and KNN query overhead for users who never open the panel. Once loaded, results are cached in component state for the lifetime of the page.

### 4. Graceful degradation

**Decision**: If sqlite-vec is unavailable (checked via `isSqliteVecAvailable()`), the endpoint returns an empty array with HTTP 200.

**Rationale**: Consistent with the existing pattern for hybrid search — the app works without the extension, just with reduced functionality.

## Risks / Trade-offs

- **No embedding yet**: Items created very recently may not have embeddings. The endpoint returns empty array in this case — acceptable since the cron job backfills within 5 minutes.
- **Query latency**: KNN queries on large vec_items tables can be slow. Mitigated by limiting to 5 results and filtering by user_id first.
- **Panel UX**: A collapsed-by-default panel may be missed. Acceptable for a first iteration — the panel can be made more prominent later.
