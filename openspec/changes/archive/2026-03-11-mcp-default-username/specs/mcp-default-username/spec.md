## ADDED Requirements

### Requirement: Default username via X-Username request header
The MCP server SHALL read the `X-Username` HTTP request header on each incoming request and use its value as the default `username` for all read tools when the caller does not supply one explicitly. The header value SHALL be passed to `createMcpServer()` as `defaultUsername` in `handleMcpRequest()`.

#### Scenario: Read tools resolve username from X-Username header
- **WHEN** the MCP client sends `X-Username: jan` and calls any read tool without a `username` argument
- **THEN** the tool resolves the username to "jan" and returns results for that user

#### Scenario: Explicit username arg takes precedence over X-Username header
- **WHEN** the MCP client sends `X-Username: jan` and calls a read tool with `username: "alice"`
- **THEN** the tool uses "alice", not "jan"

#### Scenario: Missing username without header
- **WHEN** no `X-Username` header is sent and an MCP client calls a read tool without a `username` argument
- **THEN** the tool returns `isError: true` with a message indicating username is required and how to provide it

### Requirement: defaultUsername option on createMcpServer
The `createMcpServer()` function SHALL accept a `defaultUsername` option used as the fallback username for all read tools. `handleMcpRequest()` SHALL populate this option from the `X-Username` header value.

#### Scenario: defaultUsername option resolves username
- **WHEN** `createMcpServer({ defaultUsername: "alice" })` is called and a read tool is invoked without `username`
- **THEN** the tool resolves to "alice"
