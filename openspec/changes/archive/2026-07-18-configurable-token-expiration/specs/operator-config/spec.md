## ADDED Requirements

### Requirement: Auth token expiration configuration

The config schema SHALL define an `auth.tokenExpiration` field: a duration string (e.g. `7d`, `24h`, `30m`) that sets the lifetime of login JWTs. It SHALL default to `7d` when the `auth` section or the field is omitted. An invalid duration string SHALL fail schema validation at startup, consistent with fail-fast behaviour for the rest of the config. Secrets remain in environment variables; `auth.tokenExpiration` is not a secret and lives in `config.yaml`.

#### Scenario: Default when omitted

- **WHEN** the `auth` section or `auth.tokenExpiration` is omitted from `config.yaml`
- **THEN** the resolved config SHALL expose `auth.tokenExpiration` as `7d`

#### Scenario: Custom value accepted

- **WHEN** `auth.tokenExpiration` is set to a valid duration string such as `1m` or `30d`
- **THEN** schema validation SHALL succeed and expose that value to the auth subsystem

#### Scenario: Invalid duration rejected

- **WHEN** `auth.tokenExpiration` is set to a non-duration string such as `banana`
- **THEN** schema validation SHALL fail with a message naming the offending field, and the process SHALL exit non-zero before binding the HTTP port
