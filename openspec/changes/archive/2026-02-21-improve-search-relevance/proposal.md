## Why

FTS5 search returns irrelevant results because stop words (wie, kann, ich, the, can, how) are treated as equally meaningful search terms, and a single term match is sufficient to include a result (OR logic). This causes queries like "Wie kann ich die Festplatte vergrössern" to surface items that merely contain common words rather than semantically relevant content.

## What Changes

- `sanitizeFtsQuery` filters 54 German and English stop words before building the FTS5 query
- Query logic switches from OR to AND: all meaningful terms must appear in results
- Fallback: if all query terms are stop words, uses OR with all terms (preserves existing behavior)
- FTS5 virtual table migrated to `unicode61` tokenizer with `remove_diacritics 1` for correct umlaut handling (ä, ö, ü)
- Query terms normalized: ASCII umlaut transliterations (ae→a, oe→o, ue→u) are mapped to the same form that `unicode61 remove_diacritics` produces from real umlauts, so "vergroessern" finds "vergrössern"
- Hybrid search rebalanced: FTS5 candidates reduced from 200 to 50, KNN candidates increased from 20 to 50, giving vector search equal weight in RRF ranking

## Capabilities

### New Capabilities

None — this is a pure improvement to existing search behavior.

### Modified Capabilities

- `search-filtering`: Stop word filtering and AND logic change query construction behavior; unicode61 tokenizer changes how content is indexed and matched.

## Impact

- `src/server/repositories/item.repository.ts`: `sanitizeFtsQuery`, `normalizeQueryTerm`, `STOP_WORDS`, hybrid search FTS5/KNN limits
- `src/server/db/migrations.ts`: Migration 9 rebuilds `items_fts` with unicode61 tokenizer
- Existing FTS5 index is dropped and rebuilt on startup (no data loss, only index structure)
