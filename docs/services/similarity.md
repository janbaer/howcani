> **Status:** Final — 2026-10-24
> **Open:** —

# Related items and duplicates

## Related items: separate public endpoint, fixed top 5

`GET /api/:username/items/:id/related` is public like item reading, scoped by the URL username so nothing leaks across users, and returns a fixed top 5 without pagination. It is a separate endpoint because a query parameter on the item GET would make the response schema conditional. The panel fetches on mount and whenever the item changes.

Satisfies: R9, R2 · Origin: #32 · Date: 2026-02-23

## Relevance percentage is relative to the top hit

Percentage is cosine divided by the top cosine, with cosine = 1 - L2²/2 (sqlite-vec returns L2 distance on normalized vectors). Absolute cosine of the top five clusters tightly (about 40 to 51 %), so raw values look meaningless. The top item therefore always shows 100 %. Scores are rounded before the division, so close scores collapse. The repository returns the raw distance and the conversion happens in the service, since percent is presentation. The duplicate badge, in contrast, shows absolute cosine.

Satisfies: R9 · Origin: #37 · Date: 2026-02-24

## Duplicate threshold is a percentage, converted to a distance

`duplicate.threshold` is a percentage (default 80, range 50 to 100). `findDuplicates` fetches the 11 nearest neighbours and keeps those within distance sqrt(2 * (1 - pct/100)), at most 10. A threshold set too low floods the panel with false positives.

Satisfies: R10 · Origin: #43 · Date: 2026-02-26

## Duplicates overview runs one KNN per item

The overview iterates every embedded item, calls `findDuplicates` for each and de-duplicates mirrored pairs with the key `[a,b].sort().join('|')` in the repository. A SQL self-join was rejected: sqlite-vec has no pairwise similarity join. Fine for hundreds of items (about 300 queries stay under a second), it would need batching at thousands. The primary item of a group is arbitrary but deterministic.

Satisfies: R10 · Origin: #43 · Date: 2026-02-26
