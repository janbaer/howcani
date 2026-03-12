## Context

PR #75 made `username` optional in all five read tool schemas, with the `X-Username` request header as the fallback. Both mechanisms now coexist. The original motivation for keeping the argument was backwards compatibility — but since #75 was just merged and this is a personal tool, the window to clean it up is now, before the dual-mechanism becomes an established API surface.

## Goals / Non-Goals

**Goals:**
- Remove `username` from the Zod schema of all five read tools
- Simplify `resolveUsername()` — it no longer needs to accept an argument; it reads only `defaultUsername`
- Keep the error path: tools return a clear error when no `X-Username` header was provided

**Non-Goals:**
- Changing write tool behaviour (`create_item`, `update_item`)
- Changing how `defaultUsername` is populated in `handleMcpRequest()` — that stays as-is
- Changing the HTTP or REST API

## Decisions

### Remove argument, not just make it inaccessible

Since the MCP SDK enforces Zod schemas strictly, removing `username` from the schema means callers passing it will get a validation error. This is the cleanest break — no silent ignoring of the argument.

**Alternative considered**: Keep the field in the schema but ignore it. Rejected — it would confuse callers and make the schema misleading.

### Simplify resolveUsername to a zero-arg helper

With the argument gone, `resolveUsername(args.username)` becomes `resolveUsername()` returning `defaultUsername ?? null`. This makes the resolution chain trivially obvious.

## Risks / Trade-offs

- [Breaking change] Any external caller passing `username` explicitly will receive a Zod validation error. Impact is low: this is a personal tool, no known external clients.
- [No risk] Existing clients using `X-Username` header (the primary use case post-#75) are unaffected.
