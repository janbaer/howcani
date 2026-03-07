## ADDED Requirements

### Requirement: Health endpoint includes application version
The `GET /health` endpoint SHALL return a `version` field in the response body containing the current application version string matching `package.json`.

#### Scenario: Version present in health response
- **WHEN** a client sends `GET /health`
- **THEN** the response SHALL be `{ "status": "ok", "version": "<semver>" }` with HTTP 200

#### Scenario: Version matches package.json
- **WHEN** the application version in `package.json` is `"3.0.60"`
- **THEN** the `version` field in the health response SHALL be `"3.0.60"`
