> **Status:** Final — 2026-10-24
> **Open:** —

# Auth

## Token lifetime is validated against jose's grammar

`auth.tokenExpiration` (default `7d`) is checked in Zod with a regex copied from jose's `secs()` grammar, restricted to positive forward durations. Anything that passes config validation is therefore accepted by `setExpirationTime`, and a bad value fails at boot instead of at the first login. If jose changes its grammar, the regex has to change with it. Only the login token is configurable; `/api/auth/api-token` takes an explicit `days` argument. Sliding or refresh expiry is deferred (#116).

Satisfies: R1, R12 · Origin: #117 · Date: 2026-07-18

## Only a login token can mint an API token

Tokens carry a `kind` claim, `login` or `api`. `/api/auth/api-token` accepts a Bearer token only when its kind is `login`, so a leaked API token cannot renew itself indefinitely; the user comes from the token, never from the body. Tokens issued before the claim existed have no `kind`: they still authenticate everywhere else, but are refused here, because an old API token is indistinguishable from an old login token. The username/password variant stays for scripts. Any `Authorization` header selects the Bearer path, so an invalid token is rejected even when valid credentials are in the body.

Satisfies: R1, R11 · Origin: #184 · Date: 2026-11-12
