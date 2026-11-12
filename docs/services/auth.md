> **Status:** Final — 2026-10-24
> **Open:** —

# Auth

## Token lifetime is validated against jose's grammar

`auth.tokenExpiration` (default `7d`) is checked in Zod with a regex copied from jose's `secs()` grammar, restricted to positive forward durations. Anything that passes config validation is therefore accepted by `setExpirationTime`, and a bad value fails at boot instead of at the first login. If jose changes its grammar, the regex has to change with it. Only the login token is configurable; `/api/auth/api-token` takes an explicit `days` argument. Sliding or refresh expiry is deferred (#116).

Satisfies: R1, R12 · Origin: #117 · Date: 2026-07-18

## Only a login token can mint an API token

Tokens carry a `kind` claim, `login` or `api`. `/api/auth/api-token` accepts a Bearer token only when its kind is `login`, so a leaked API token cannot renew itself indefinitely; the user comes from the token, never from the body. Tokens issued before the claim existed have no `kind`: they still authenticate everywhere else, but are refused here, because an old API token is indistinguishable from an old login token. The username/password variant stays for scripts. Any `Authorization` header selects the Bearer path, so an invalid token is rejected even when valid credentials are in the body.

Satisfies: R1, R11 · Origin: #184 · Date: 2026-11-12

## OIDC login maps to existing users by username

With `auth.provider: oidc` the provider's `preferred_username` selects an existing user (case-insensitive, `username` is `COLLATE NOCASE`); there is no `sub` binding and no auto-creation. That is only safe because Jan is the sole Pocket ID admin who assigns usernames and the client is restricted to an allowed group. Discovery runs lazily on the first login and is retried after a failure, so an unreachable issuer never blocks the start, public reads or MCP. State, nonce and PKCE verifier travel in one short-lived HttpOnly cookie with `SameSite=Lax`, which survives the cross-site redirect back from the provider. The token endpoint gets the configured `redirectUri` with the callback's query, not the request URL, which behind the proxy carries the internal host. The callback hands the JWT to the SPA in the URL fragment, which never reaches the server or its logs. Disabling a user in Pocket ID takes effect only when the HowCanI token expires, there is no revocation.

Satisfies: R12, R20 · Origin: #185 · Date: 2026-11-12
