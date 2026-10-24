> **Status:** Final — 2026-10-24
> **Open:** —

# Auth

## Token lifetime is validated against jose's grammar

`auth.tokenExpiration` (default `7d`) is checked in Zod with a regex copied from jose's `secs()` grammar, restricted to positive forward durations. Anything that passes config validation is therefore accepted by `setExpirationTime`, and a bad value fails at boot instead of at the first login. If jose changes its grammar, the regex has to change with it. Only the login token is configurable; `/api/auth/api-token` takes an explicit `days` argument. Sliding or refresh expiry is deferred (#116).

Satisfies: R1, R12 · Origin: #117 · Date: 2026-07-18
