## 1. Stop Word Filtering + AND Logic

- [x] 1.1 Add `STOP_WORDS` Set (German + English) to `item.repository.ts`
- [x] 1.2 Update `sanitizeFtsQuery` to filter stop words and use AND logic
- [x] 1.3 Add fallback to OR when all terms are stop words
- [x] 1.4 Export `sanitizeFtsQuery` and add unit tests covering stop word filtering, AND logic, fallback, and edge cases

## 2. ASCII Umlaut Normalization

- [x] 2.1 Add `normalizeQueryTerm` function normalizing ae→a, oe→o, ue→u (lowercase + replace)
- [x] 2.2 Apply `normalizeQueryTerm` to all query terms in `sanitizeFtsQuery` (both AND path and OR fallback)
- [x] 2.3 Update and extend unit tests to cover normalization cases

## 3. FTS5 unicode61 Tokenizer Migration

- [x] 3.1 Add migration 9 to `migrations.ts` that drops `items_fts`, recreates with `unicode61 remove_diacritics 1`, recreates triggers, and backfills index

## 4. Hybrid Search Rebalancing

- [x] 4.1 Reduce FTS5 candidates from 200 to 50 in `searchHybrid`
- [x] 4.2 Increase KNN candidates from 20 to 50 in `searchHybrid`

## 5. Verification

- [x] 5.1 All tests pass (`bun test`)
- [x] 5.2 Lint passes (`bun run lint`)
