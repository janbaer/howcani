## Why

The login JWT lifetime is hardcoded to `7d` (`TOKEN_EXPIRATION` in `src/server/auth/jwt.ts`). Session length is an operator policy decision — some deployments want shorter-lived tokens, others longer. Today changing it needs a code edit and rebuild; every other operator setting already lives in `config.yaml`.

## What Changes

- Add an `auth.tokenExpiration` field to the `config.yaml` schema, defaulting to `7d`.
- Reject invalid duration strings at startup (fail-fast, consistent with the rest of the config).
- `createToken` reads the configured value instead of the module-level `TOKEN_EXPIRATION` constant.
- Document the new `auth` block in `config.example.yaml`.

Scope is the login token only; the `/api/auth/api-token` route already takes an explicit `days` argument and is unchanged.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `operator-config`: the config schema gains an `auth.tokenExpiration` field with a `7d` default and duration-string validation.
- `authentication`: login token expiration is driven by the configured value rather than a fixed 7 days.

## Impact

- `src/server/config/config.schema.ts`, `src/server/config/config.service.ts` (default seed)
- `src/server/auth/jwt.ts` (`createToken`)
- `config.example.yaml`
- No API surface change; no client change.
