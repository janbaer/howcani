## MODIFIED Requirements

### Requirement: Pre-push hook runs build and tests
The system SHALL run `bun run build && bun check && bun run check:svelte && bun test --isolate` as a git pre-push hook. If the build, either type check or any test fails, the push SHALL be aborted and the error output displayed to the developer.

#### Scenario: Build, type checks and tests pass
- **WHEN** developer runs `git push` and build succeeds, `bun check` and `bun run check:svelte` exit 0 and all tests pass
- **THEN** the push proceeds normally

#### Scenario: Build fails
- **WHEN** developer runs `git push` and `bun run build` exits with a non-zero code
- **THEN** the push is aborted and the build error is printed to the terminal

#### Scenario: Type check fails
- **WHEN** developer runs `git push` and `bun check` exits with a non-zero code
- **THEN** the push is aborted and the type errors are printed to the terminal

#### Scenario: Svelte type check fails
- **WHEN** developer runs `git push` and `bun run check:svelte` exits with a non-zero code
- **THEN** the push is aborted and the component type errors are printed to the terminal

#### Scenario: Tests fail
- **WHEN** developer runs `git push` and build and type checks succeed but `bun test` exits with a non-zero code
- **THEN** the push is aborted and the test failure output is printed to the terminal
