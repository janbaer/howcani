## Context

The FTS5 search pipeline has three precision problems and one ranking imbalance:

1. **Stop words inflate scores**: Common words (wie, kann, ich, the, can, how) are indexed and matched equally with content words. A BM25 query for "Wie kann ich die Festplatte vergrössern" matches any item containing "wie" or "kann", pushing items with many stop-word occurrences to the top.

2. **OR logic causes false positives**: `sanitizeFtsQuery` joins all terms with `OR`, so a single term match — even a stop word — is sufficient to return a result.

3. **Default tokenizer mishandles umlauts**: The FTS5 default (`porter`) does not correctly normalize German characters (ä → ae, ö → oe, etc.), breaking case-insensitive matching for German content.

4. **KNN/FTS5 imbalance in hybrid search**: The RRF merge uses 200 FTS5 candidates vs. 20 KNN candidates. Because FTS5 contributes 10× more entries to the score map, semantically relevant items found by vector search are routinely outranked by items with high BM25 keyword scores.

## Goals / Non-Goals

**Goals:**
- Filter stop words before FTS5 query construction so only content words drive matching
- Switch query logic to AND so all meaningful terms must appear in results
- Migrate FTS5 to `unicode61` tokenizer for correct umlaut normalization
- Normalize ASCII umlaut transliterations in queries to match the indexed forms
- Rebalance hybrid search so vector and FTS5 results have equal weight in RRF
- Preserve existing behavior when all query terms are stop words (fallback to OR)

**Non-Goals:**
- Stemming / morphological analysis (e.g., "Festplatten" finding "Festplatte")
- Configurable stop word lists per user or language
- Changing BM25 weights or RRF K parameter

## Decisions

### Stop word filtering in `sanitizeFtsQuery`

**Decision**: Filter stop words at query-build time in the repository layer, not in the service layer or at the DB level.

**Rationale**: `sanitizeFtsQuery` is already the single place where raw user input becomes an FTS5 query string. Filtering here keeps the change minimal and co-located with the existing escaping logic.

**Alternative considered**: FTS5 custom tokenizer with a stop list — rejected because SQLite's built-in tokenizer API doesn't support dynamic stop word configuration without a compiled extension.

### AND logic (space-separated terms)

**Decision**: Join filtered terms with space (FTS5 implicit AND) instead of ` OR `.

**Rationale**: For a personal knowledge base, precision matters more than recall. If a user searches for "Festplatte vergrössern", both terms should be required. A single-term match against "vergrössern" in an unrelated item is noise.

**Trade-off**: AND logic reduces recall. Queries with rare or misspelled terms may return zero results. For a knowledge base where the user controls the content, this is acceptable.

**Fallback**: When all query terms are stop words, the function falls back to OR with the original terms. This prevents "wie kann ich" from returning nothing.

### unicode61 tokenizer

**Decision**: Migrate `items_fts` to `tokenize='unicode61 remove_diacritics 1'` via a new migration.

**Rationale**: The `unicode61` tokenizer correctly handles Unicode case folding and diacritic removal, making "Festplatte" and "festplatte" match, and enabling "Umlaut" searches to find "umlauts". The `porter` tokenizer (default) applies English stemming, which is incorrect for German content.

**Migration safety**: The `items_fts` virtual table is a derived index — all content is sourced from the `items` table. Dropping and rebuilding it loses no user data.

### ASCII umlaut normalization in `normalizeQueryTerm`

**Decision**: Before building the FTS5 query, lowercase and replace `ae→a`, `oe→o`, `ue→u` in each query term.

**Rationale**: `unicode61 remove_diacritics 1` strips diacritics from indexed content (ö→o, ä→a, ü→u). Users who lack a German keyboard type `oe`, `ae`, `ue` instead. Without normalization, `"vergroessern"` doesn't match `"vergrossern"` (indexed form of "vergrössern"), so AND logic returns zero useful results.

**Trade-off**: Words with natural `ae/oe/ue` sequences (e.g., "Israel" → "Isral") will no longer match their indexed form. Acceptable for a German-primary personal knowledge base where such words are rare search targets.

### Hybrid search rebalancing (FTS5 50 / KNN 50)

**Decision**: Reduce FTS5 candidates from 200 to 50; increase KNN candidates from 20 to 50.

**Rationale**: With 200 FTS5 vs. 20 KNN, RRF is effectively FTS5-only — most of the score map is populated by FTS5 entries with no KNN contribution. Equal candidate counts (50/50) give vector similarity the same influence as keyword ranking. Items semantically close to the query but not matching exact keywords can now reach the top.

**Alternative considered**: Weighted RRF (multiplying KNN scores by a constant) — rejected as more complex and harder to reason about than simply equalizing candidate pool sizes.

## Risks / Trade-offs

- **Reduced recall for short queries**: A two-word query where one is a stop word leaves only one required term, which is correct. A single-word stop word query triggers the OR fallback, also correct.
- **Zero results for strict AND**: "docker kubernetes openshift" requires all three terms. If a user's items only cover two of the three, they get no results. Acceptable for a personal knowledge base.
- **Migration runtime**: Rebuilding `items_fts` from the `items` table is a full table scan. For large datasets (10k+ items) this may take a few seconds on startup. Acceptable for a self-hosted app.

## Migration Plan

Migration 9 runs automatically on startup via `runMigrations()`:
1. Drop existing triggers and `items_fts` virtual table
2. Recreate `items_fts` with `unicode61 remove_diacritics 1`
3. Recreate triggers
4. Backfill index: `INSERT INTO items_fts SELECT rowid, question, answer FROM items`

No rollback path needed — reverting to the old tokenizer would require re-running a migration, which is handled by the migration system.
