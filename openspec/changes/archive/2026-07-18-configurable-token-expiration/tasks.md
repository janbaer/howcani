## 1. Config schema

- [x] 1.1 Add an `authSchema` (`tokenExpiration` string, regex-validated, default `7d`) to `config.schema.ts` and wire it into `configSchema` as a `.prefault({})` section
- [x] 1.2 Add a schema spec covering: default when omitted, valid custom value accepted, invalid string rejected

## 2. Token creation

- [x] 2.1 Replace the `TOKEN_EXPIRATION` constant usage in `createToken` with `getConfig().auth.tokenExpiration`

## 3. Docs

- [x] 3.1 Document the new `auth.tokenExpiration` block in `config.example.yaml`

## 4. Verify

- [x] 4.1 Run lint, build, and tests
- [x] 4.2 Execute the issue's "How to Test" scenarios (1m expiry, default fallback, invalid value fails startup)
