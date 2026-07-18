## Context

`createToken` in `src/server/auth/jwt.ts` calls `.setExpirationTime(TOKEN_EXPIRATION)` with a module-level `const TOKEN_EXPIRATION = '7d'`. `jose` parses that string into a relative offset via its internal `secs()` helper. All other operator settings already come from the Zod-validated `config.yaml` singleton (`getConfig()`), which fails fast on invalid input.

## Goals / Non-Goals

**Goals:**
- Move the login-token lifetime into `config.yaml` as `auth.tokenExpiration`, default `7d`.
- Reject invalid duration strings at startup, not at token-creation time.
- No behaviour change when the setting is omitted.

**Non-Goals:**
- Sliding/refresh expiration (tracked separately in #116).
- Changing the `/api/auth/api-token` route, which already takes an explicit `days` argument.

## Decisions

- **Validation regex mirrors jose.** The Zod field uses a regex copied from jose's own `secs()` grammar, restricted to the positive forward-duration subset (no leading sign, no `ago`/`from now`): `^\d+(\.\d+)? ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)$` (case-insensitive). This guarantees every value that passes config validation is one `setExpirationTime` accepts, so a bad value fails at boot rather than silently at first login.
- **New `auth` config section.** Add `auth: { tokenExpiration: string }` as a `.prefault({})` section so an omitted block still yields the `7d` default, matching how `embedding`/`backup`/`duplicate` are handled.
- **`createToken` reads `getConfig()`.** Replace the constant with `getConfig().auth.tokenExpiration`. `createApiToken` is untouched.

## Risks / Trade-offs

- Regex drift if jose changes its grammar. Low risk: the grammar is stable and copied verbatim from the installed version; a mismatch would only ever reject a value jose would accept, surfacing loudly at boot rather than as a silent bug.
- `createToken` now depends on the config singleton being loaded. It already is at startup (`loadConfig()` in `index.ts`) before any request can trigger token creation; tests seed config via the existing `__seedDefaultConfigForTests()` helper.
