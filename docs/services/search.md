> **Status:** Final — 2026-10-24
> **Open:** —

# Search

## FTS5 index is an external-content table on `items.rowid`

Item ids are UUID text, but FTS5 `content_rowid` needs an integer, so `items_fts` uses `content=items, content_rowid=rowid`. A standalone FTS table with manual sync was rejected (double storage, fragile triggers). Search lives in `ItemRepository`, not a separate repository. `items_fts` is derived, so dropping and rebuilding it loses nothing.

Satisfies: R5 · Origin: implement-search-filtering, #31 · Date: 2026-02-10

## Tag filter is AND

Filtering by several tags returns only items carrying all of them. On the FTS-only path text and tag filter run in one query with `HAVING COUNT(DISTINCT tags.id) = <n>`; one JOIN per tag was rejected because it needs dynamic SQL. On the hybrid path the tag filter is applied to the merged result afterwards.

Satisfies: R6 · Origin: implement-search-filtering · Date: 2026-02-10

## Stop words are dropped, terms are ANDed

`sanitizeFtsQuery` drops German and English stop words and joins the rest with implicit AND, every term as a prefix query, so "wie kann ich ..." gives precise matches: precision beats recall in a personal knowledge base. If every term is a stop word it falls back to OR over the original terms. A custom FTS5 tokenizer with a stop list was rejected, it needs a compiled extension.

Satisfies: R5 · Origin: #31 · Date: 2026-02-21

## Tokenizer and umlaut transliteration change together

`items_fts` uses `unicode61 remove_diacritics 1`, not porter (English stemming is wrong for German). Indexed text therefore loses diacritics (ö becomes o), so `normalizeQueryTerm` lowercases and maps ae/oe/ue to a/o/u. Change one without the other and matching breaks. Known side effects: words with a natural ae/oe/ue ("Israel") no longer match, and there is no stemming ("Festplatten" does not find "Festplatte").

Satisfies: R5 · Origin: #31 · Date: 2026-02-21

## Hybrid search fetches 50 candidates per arm

FTS5 and KNN each fetch 50 candidates for the RRF merge (k=60, not tunable). With 200 FTS against 20 KNN the merge was effectively FTS-only and semantic hits never reached the top. Weighted RRF was rejected as harder to reason about. Vectors live in sqlite-vec to keep everything in one SQLite file; JS-side cosine similarity and a separate vector database were rejected. `item_embeddings` stays next to the `vec_items` table so "which items lack an embedding" can be queried without the virtual table.

Satisfies: R7 · Origin: #31, semantic-search · Date: 2026-02-21

## The KNN arm is trimmed by a relevance band

KNN always returns its nearest neighbours, so a nonsense query still got 50 unrelated hits. `embedding.minSimilarity` (default 20) is a hard ceiling: if even the best vector match is below it, the KNN arm is empty. `embedding.relevanceBand` (default 60) keeps results up to best + band% of the gap between the best match and that ceiling. The band is relative because it moves with the query: an easy query has relevant siblings well behind its best hit, a cross-language one sits near the ceiling. It applies to hybrid search in the API and MCP, not to related items or duplicates. Both settings assume normalised vectors; retune after switching models.

Satisfies: R7 · Origin: #120 · Date: 2026-08-12
