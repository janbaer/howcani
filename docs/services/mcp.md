> **Status:** Final — 2026-10-24
> **Open:** —

# MCP

## The token wins, `X-Username` is only a public fallback

A present bearer token is authoritative and its username is used. An invalid or expired token is rejected, it never falls back to `X-Username`. Only without a token does the header pick the user, which keeps reads public; the header is unauthenticated by design. The earlier header-first order let a valid token for alice plus `X-Username: bob` read bob's data. The header is set once per MCP client, so one server serves several users without a restart. Read tools have no `username` argument: it was removed rather than ignored, so the schema does not advertise a field that has no effect. `/mcp` sends no `Access-Control-Allow-Origin`, so browsers cannot read it cross-origin; revisit with an origin allow-list only if a browser MCP client appears.

Satisfies: R11, R2 · Origin: #75, #76, #118 · Date: 2026-07-19

## Reads are public, API tokens live up to 365 days

Read tools need no token, write tools need one. Tokens from the API token endpoint can be valid for up to 365 days and there is no rate limiting, an accepted trade-off. Stateful sessions were rejected, the transport is stateless.

Satisfies: R11, R2 · Origin: #10 · Date: 2026-02-17

## Updates are partial and ownership failures look like misses

`update_item` takes question, answer and tags as optional; a call with none of them is accepted and only bumps the item. Tags, when given, replace the full set, as in REST. The item is resolved by id and user, so a missing and a foreign item produce the same error. `get_related_items` also returns an error for them rather than an empty array, so callers notice bad ids.

Satisfies: R11, R3 · Origin: #17, #34 · Date: 2026-02-18
