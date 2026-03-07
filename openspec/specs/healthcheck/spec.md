# healthcheck Specification

## Purpose
Describes the contract for the `GET /api/health` endpoint, which allows operators and monitoring tools to verify that the application is running and to identify the deployed version.

## Requirements

### Requirement: Health endpoint includes application version
The `GET /api/health` endpoint SHALL return a `version` field in the response body containing the current application version string.

#### Scenario: Version present in health response
- **WHEN** a client sends `GET /api/health`
- **THEN** the response SHALL be `{ "status": "ok", "version": "<semver>" }` with HTTP 200

#### Scenario: Version matches package.json
- **WHEN** the application version in `package.json` is `"X.Y.Z"`
- **THEN** the `version` field in the health response SHALL equal `"X.Y.Z"`

