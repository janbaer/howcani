## Why

MCP read tools resolve the username from the `X-Username` header **before** consulting the bearer token (`server.ts:20-28`), so a token is never authoritative: a caller sending a valid token for `alice` plus `X-Username: bob` reads bob's data. Combined with `Access-Control-Allow-Origin: *` on `/mcp`, any browser origin can invoke the read tools cross-origin. Reads are intentionally public, but the token must win when present, and the wildcard CORS is an unintended exposure.

## What Changes

- Invert username-resolution precedence: a present bearer token is authoritative (its username is used, `X-Username` ignored); `X-Username` is the fallback only when no token is sent.
- A present but invalid/expired token is **rejected** rather than silently falling back to `X-Username`.
- Reads remain public: no token and no `X-Username` still resolves via `X-Username`; absence of both returns the existing "username is required" error.
- Remove the wildcard `Access-Control-Allow-Origin: *` from `/mcp`.
- Document the MCP auth model in the README.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `mcp-server`: username resolution becomes token-authoritative with an `X-Username` fallback and invalid-token rejection; `/mcp` no longer emits wildcard CORS.

## Impact

- `src/server/mcp/server.ts` (username resolution + error messages)
- `src/server/mcp/index.ts` (CORS)
- `src/server/mcp/server.spec.ts` (precedence, invalid-token, CORS tests)
- `README.md` (MCP auth section)
- No config change, no client change. Write tools unchanged.
