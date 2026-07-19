## Context

`createMcpServer` (`server.ts`) builds a `usernamePromise` that returns `X-Username` first and only falls back to the token when the header is absent. Read tools call `await usernamePromise` and error if it's null. Write tools (`create_item`, `update_item`) independently verify the bearer in `tools.ts`. `mcp/index.ts` wraps every `/mcp` response in `corsHeaders` including `Access-Control-Allow-Origin: *`.

## Goals / Non-Goals

**Goals:**
- Token authoritative when present; `X-Username` fallback only when no token.
- Invalid/expired token → reject, no `X-Username` fallback.
- Reads stay public (no token + `X-Username` works).
- Drop the wildcard CORS on `/mcp`.

**Non-Goals:**
- Changing write-tool auth (already token-verified).
- Making reads token-only / private.
- Origin allow-listing / configurable CORS (chosen to drop the header outright).

## Decisions

- **Tagged resolution result.** Replace the `Promise<string | null>` with a `Promise` of a discriminated result: `{ ok: true, username }` | `{ ok: false, reason: 'invalid_token' | 'missing_username' }`. This lets read tools distinguish a rejected bad token from a missing identity and return the right message. Resolution order: token present → verify → valid uses token username, invalid → `invalid_token`; else `X-Username` → username; else `missing_username`.
- **Two error messages.** Keep the existing "username is required…" for `missing_username`; add "invalid or expired token" for `invalid_token`. Read tools map the reason to the message.
- **CORS: remove the ACAO line.** Delete `'Access-Control-Allow-Origin': '*'` from `corsHeaders`. No ACAO is emitted, so browsers cannot read `/mcp` cross-origin; server-side MCP clients are unaffected.

## Risks / Trade-offs

- A client that (incorrectly) sent a token *and* relied on `X-Username` pointing elsewhere changes behaviour — but that combination is exactly the vulnerability being closed.
- Dropping ACAO breaks any browser-based MCP client that connected cross-origin to `/mcp`. None are known; the REST API remains the browser surface. Revisit with an origin allow-list if a browser MCP client is introduced.
